const lineshapes = require('../Data/lineshapes');

/**
 * Takes GPS coodinates and which line the train/point belongs to
 * works out what the current meterage should be (closest intesect)
 * @param {object} Location
 * @return {object} Location now with Meterage of train service and estimated direction
 */
module.exports = {
  getmeterage: function getmeterage(location) {
    const lat = location.lat;
    const long = location.long;
    const trainBearing = location.compass;
    const kiwirailLine = location.kiwirailLineId;
    // if rail line is undefined, give up
    if (typeof kiwirailLine == 'undefined' || kiwirailLine == '' || lat == '' || long == '') {
      return location;
    }
    // position we are solving for
    const position = {'coords': {'latitude': lat, 'longitude': long}};
    // array of line locations of known meterage
    const locations = lineshapes.filter((lineshapes) => lineshapes.lineId == kiwirailLine);
    let pointA = locations[0];
    let pointB = locations[1];
    // let pointC = locations[2];
    let closest;
    let nextclosest;
    // on a corner, a location could exist out of bounds, in this case, mark it for future comparison.
    let suspectedOutofboundsPoint;
    let distancePointA = distance(pointA, position.coords);
    // let distancePointB = distance(pointB, position.coords);
    // let distancePointC = distance(pointC, position.coords);
    // loop through all line points from lowest to highest meterage
    for (let i = 1; i < locations.length; i++) {
      // loop component
      if (distance(locations[i], position.coords) < distancePointA) {
        pointB = pointA;
        // distancePointB = distancePointA;
        pointA = locations[i];
        distancePointA = distance(locations[i], position.coords);
        // stopping component
      } else if (inbetween(pointB, position.coords, pointA)) {
        // stop looping
      } else {
        // we may suspect that the point is in fact the closest point, save for later
        if (suspectedOutofboundsPoint == undefined) {
          suspectedOutofboundsPoint = pointB;
          // if we already have a suspect point, test against this to get the closer of the two
        } else if (distance(pointB, position.coords) < distance(suspectedOutofboundsPoint, position.coords)) {
          suspectedOutofboundsPoint = pointB;
        }
        // keep on looping
        pointB = pointA;
        // distancePointB = distancePointA;
        pointA = locations[i];
        distancePointA = distance(locations[i], position.coords);
      }
    }
    // test if out of bounds point is closest available point to position
    if (suspectedOutofboundsPoint !== undefined) {
      for (let i = 0; i < locations.length; i++) {
        if (suspectedOutofboundsPoint !== undefined &&
                    distance(locations[i], position.coords) < distance(suspectedOutofboundsPoint, position.coords)) {
          suspectedOutofboundsPoint = undefined;
        }
      }
    }
    // if out of bounds point is not undefined
    // it is the closest match, so use it and skip over the rest of the code
    if (suspectedOutofboundsPoint !== undefined) {
      location.meterage = Math.floor(suspectedOutofboundsPoint.meterage);
      return location;
    }
    // now that the looping is finished, the two closest points are left over, work out which is closest
    if (distance(pointA, position.coords) < distance(pointB, position.coords)) {
      closest = pointA;
      nextclosest = pointB;
    } else {
      closest = pointB;
      nextclosest = pointA;
    }
    let bearingUp;
    let meterage;
    let adjustedTrainBearing;
    // checks the order (direction) of the points selected
    if (closest.order < nextclosest.order) {
      // beyond closest meterage
      bearingUp = bearing(closest, nextclosest); // wanted for up down estimation
      const XX = nextclosest.latitude - closest.latitude;
      const YY = nextclosest.longitude - closest.longitude;
      const ShortestLength = ((XX * (position.coords.latitude - closest.latitude))
                + (YY * (position.coords.longitude - closest.longitude))) / ((XX * XX) + (YY * YY));
      const Vlocation = {
        'latitude': (closest.latitude + XX * ShortestLength),
        'longitude': (closest.longitude + YY * ShortestLength),
      };
      meterage = closest.meterage + distance(Vlocation, closest);
    } else {
      // behind closest meterage
      bearingUp = bearing(nextclosest, closest); // wanted for up down estimation
      const XX = closest.latitude - nextclosest.latitude;
      const YY = closest.longitude - nextclosest.longitude;
      const ShortestLength = ((XX * (position.coords.latitude - nextclosest.latitude))
                + (YY * (position.coords.longitude - nextclosest.longitude))) / ((XX * XX) + (YY * YY));
      const Vlocation = {
        'latitude': (nextclosest.latitude + XX * ShortestLength),
        'longitude': (nextclosest.longitude + YY * ShortestLength),
      };
      meterage = closest.meterage - distance(Vlocation, closest);
    }
    // us the bearingUp to see if train seems to be traveling up or down
    let direction;
    if (trainBearing > 180) {
      adjustedTrainBearing = trainBearing - 360;
    } else {
      adjustedTrainBearing = trainBearing;
    }
    const bearingUpMin = bearingUp - 90;
    const bearingUpMax = bearingUp + 90;

    if ((bearingUpMin < adjustedTrainBearing) && (adjustedTrainBearing < bearingUpMax)) {
      direction = 'UP';
    } else {
      direction = 'DOWN';
    }

    if (meterage == undefined) {
      console.log('undefined Meterage');
    }
    location.meterage = Math.floor(meterage);
    location.estimatedDirection = direction;
    return location;
    /**
     * Works out if position 2 is inbetween positions 1 & 3
     * @param {object} position1 lat long pair
     * @param {object} position2 lat long pair
     * @param {object} position3 lat long pair
     * @return {boolean} if inbetween then true
     */
    function inbetween(position1, position2, position3) {
      // function determines if position 2 is inbetween 1 & 3
      // see if either BAC or BCA are > 90
      let AC = bearing(position1, position3);
      if (AC < 0) {
        AC = 360 + AC;
      }
      let AB = bearing(position1, position2);
      if (AB < 0) {
        AB = 360 + AB;
      }
      let CB = bearing(position3, position2);
      if (CB < 0) {
        CB = 360 + CB;
      }
      let CA = bearing(position3, position1);
      if (CA < 0) {
        CA = 360 + CA;
      }
      let BA = bearing(position2, position1);
      if (BA < 0) {
        BA = 360 + BA;
      }
      let BC = bearing(position2, position3);
      if (BC < 0) {
        BC = 360 + BC;
      }
      let BAC;
      if (AC > AB) {
        BAC = AC - AB;
      } else {
        BAC = AB - AC;
      }
      let BCA;
      if (CB > CA) {
        BCA = CB - CA;
      } else {
        BCA = CA - CB;
      }
      // let ABC
      // if (BA > BC) {ABC = BA - BC} else {ABC = BC - BA}
      // let triangle = BAC + BCA + ABC
      if (BAC > 90 || BCA > 90) {
        return false;
      } else {
        return true;
      }
    }
    /**
             * Finds bearing (degrees) of position2 from position 1
             * @param {object} position1 lat long pair
             * @param {object} position2 lat long pair
             * @return {number} bearing
             */
    function bearing(position1, position2) {
      const lat1 = position1.latitude;
      const lat2 = position2.latitude;
      const lon1 = position1.longitude;
      const lon2 = position2.longitude;
      const φ1 = lat1 * Math.PI / 180;
      const φ2 = lat2 * Math.PI / 180;
      const λ1 = lon1 * Math.PI / 180;
      const λ2 = lon2 * Math.PI / 180;
      const y = Math.sin(λ2 - λ1) * Math.cos(φ2);
      const x = Math.cos(φ1) * Math.sin(φ2) -
                    Math.sin(φ1) * Math.cos(φ2) * Math.cos(λ2 - λ1);
      const bearing = Math.atan2(y, x) * 180 / Math.PI;
      return bearing;
    }
    /**
        * gets distance in meters between 2 points
        * @param {object} position1 lat long pair
        * @param {object} position2 lat long pair
        * @return {number}  distance in meters between 2 points
        */
    function distance(position1, position2) {
      const lat1 = position1.latitude;
      const lat2 = position2.latitude;
      const lon1 = position1.longitude;
      const lon2 = position2.longitude;
      const R = 6371000; // radius of earth in metres
      const φ1 = lat1 * Math.PI / 180;
      const φ2 = lat2 * Math.PI / 180;
      const Δφ = (lat2 - lat1) * Math.PI / 180;
      const Δλ = (lon2 - lon1) * Math.PI / 180;
      const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
                Math.cos(φ1) * Math.cos(φ2) *
                Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const d = R * c;
      return d;
    }
  },
};
