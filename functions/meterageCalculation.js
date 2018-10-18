let lineshapes = require('../Data/lineshapes');

/**
 * Takes GPS coodinates and which line the train belongs to
 * works out what the current meterage should be (closest intesect)
 * @param {number} lat
 * @param {number} long
 * @param {string} KRline
 * @return {number} Meterage of train service
 */
module.exports = {
    getmeterage: function getmeterage(lat, long, KRline) {
    // if rail line is undefined, give up
    if (typeof KRline == 'undefined' || KRline == '') {
        return 0;
    }
    // position we are solving for
    let position = {'coords': {'latitude': lat, 'longitude': long}};
    // array of line locations of known meterage
    let locations = lineshapes.filter((lineshapes) => lineshapes.lineId == KRline);
    let pointA = locations[0];
    let pointB = locations[1];
    let closest;
    let nextclosest;
    // on a corner, a location could exist out of bounds, in this case, mark it for future comparison.
    let suspectedOutofboundsPoint;
    let distancePointA = distance(pointA, position.coords);
    // loop through all line points from lowest to highest meterage
    for (i = 1; i < locations.length; i++) {
        // loop component
        if (distance(locations[i], position.coords) < distancePointA) {
                pointB = pointA;
                distancePointB = distancePointA;
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
            };
            // keep on looping
            pointB = pointA;
            distancePointB = distancePointA;
            pointA = locations[i];
            distancePointA = distance(locations[i], position.coords);
        };
        };
        // test if out of bounds point is closest available point to position
        if (suspectedOutofboundsPoint !== undefined) {
        for (i = 0; i < locations.length; i++) {
            if (suspectedOutofboundsPoint !== undefined &&
                distance(locations[i], position.coords) < distance(suspectedOutofboundsPoint, position.coords)) {
            suspectedOutofboundsPoint = undefined;
            }
        }
        }
        // if out of bounds point is not undefined
        // it is the closest match, so use it and skip over the rest of the code
        if (suspectedOutofboundsPoint !== undefined) {
        return Math.floor(suspectedOutofboundsPoint.meterage);
        }
        // now that the looping is finished, the two closest points are left over, work out which is closest
        if (distance(pointA, position.coords) < distance(pointB, position.coords)) {
        closest = pointA;
        nextclosest = pointB;
        } else {
        closest = pointB;
        nextclosest = pointA;
        };
    // checks the order (direction) of the points selected
    if (closest.order < nextclosest.order) {
        // beyond closest meterage
        let XX = nextclosest.latitude - closest.latitude;
        let YY = nextclosest.longitude - closest.longitude;
        let ShortestLength = ((XX * (position.coords.latitude - closest.latitude))
                            + (YY * (position.coords.longitude - closest.longitude))) / ((XX * XX) + (YY * YY));
        let Vlocation = {
        'latitude': (closest.latitude + XX * ShortestLength),
        'longitude': (closest.longitude + YY * ShortestLength),
        };
        meterage = closest.meterage + distance(Vlocation, closest);
    } else {
        // behind closest meterage
        let XX = closest.latitude - nextclosest.latitude;
        let YY = closest.longitude - nextclosest.longitude;
        let ShortestLength = ((XX * (position.coords.latitude - nextclosest.latitude))
                            + (YY * (position.coords.longitude - nextclosest.longitude))) / ((XX * XX) + (YY * YY));
        let Vlocation = {
        'latitude': (nextclosest.latitude + XX * ShortestLength),
        'longitude': (nextclosest.longitude + YY * ShortestLength),
        };
        meterage = closest.meterage - distance(Vlocation, closest);
    };
    return Math.floor(meterage);
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
        let AB = bearing(position1, position2);
        let CB = bearing(position3, position2);
        let CA = bearing(position3, position1);
        // let BA = bearing(position2, position1)
        // let BC = bearing(position2, position3)
        let BAC = AC - AB;
        let BCA = CB - CA;
        // let ABC = BA - BC
        if (BAC < 0) {
            BAC = 360 + BAC;
        }
        if (BCA < 0) {
            BCA = 360 + BCA;
        }
        // if (ABC < 0) {ABC = 360 + BAC}
        // let triangle = BAC + BCA + ABC
        if (BAC > 90 || BCA > 90) {
        return false;
        } else {
        return true;
        }
        /**
         * Finds bearing (degrees) of position2 from position 1
         * @param {object} position1 lat long pair
         * @param {object} position2 lat long pair
         * @return {number} bearing
         */
        function bearing(position1, position2) {
        let lat1=position1.latitude;
        let lat2=position2.latitude;
        let lon1=position1.longitude;
        let lon2=position2.longitude;
        let φ1 = lat1 * Math.PI / 180;
        let φ2 = lat2 * Math.PI / 180;
        let λ1 = lon1 * Math.PI / 180;
        let λ2 = lon2 * Math.PI / 180;
        let y = Math.sin(λ2-λ1) * Math.cos(φ2);
        let x = Math.cos(φ1)*Math.sin(φ2) -
                Math.sin(φ1)*Math.cos(φ2)*Math.cos(λ2-λ1);
        let bearing = Math.atan2(y, x) * 180 / Math.PI;
        return bearing;
        };
    };
        /**
        * gets distance in meters between 2 points
        * @param {object} position1 lat long pair
        * @param {object} position2 lat long pair
        * @return {number}  distance in meters between 2 points
        */
        function distance(position1, position2) {
            let lat1=position1.latitude;
            let lat2=position2.latitude;
            let lon1=position1.longitude;
            let lon2=position2.longitude;
            let R = 6371000; // radius of earth in metres
            let φ1 = lat1 * Math.PI / 180;
            let φ2 = lat2 * Math.PI / 180;
            let Δφ = (lat2-lat1) * Math.PI / 180;
            let Δλ = (lon2-lon1) * Math.PI / 180;
            let a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
            let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
            let d = R * c;
            return d;
            };
    },
};
