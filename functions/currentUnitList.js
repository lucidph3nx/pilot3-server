let moment = require('moment-timezone');
moment().tz('Pacific/Auckland').format();
let StationGeoboundaries = require('../Data/StationGeoboundaries');
let StationMeterage = require('../Data/StationMeterage');
let meterageCalculation = require('./meterageCalculation');

module.exports = function(geVisVehicles) {
  let trains = geVisVehicles.features;
  let activeUnits = [];
  let currentCarList = [];
  let currentUnitList = [];

  // itterate through all items in GeVisJSON and use all relevant ones
  for (gj = 0; gj < trains.length; gj++) {
    let train = trains[gj].attributes;
    if (train.EQUIPDESC.trim() == 'Matangi Power Car' || train.EQUIPDESC.trim() == 'Matangi Trailer Car') {
      let loadTime = moment(train.TIMESTMPGIS);
      let positionTime = moment(train.TIMESTMPNZ);
      let locationAgeRAW = loadTime.diff(positionTime);
      let locationAge = moment.utc(locationAgeRAW).format('mm:ss');
      let isLinked = false;
      if (train.TRNID !== null) {
        isLinked = true;
      }
      // build the car object
      let car = {
        carId: train.VEHID,
        lat: train.LAT,
        lon: train.LON,
        positionAgeSeconds: parseInt(locationAge.toString().split(':')[0] * 60)
        + parseInt(locationAge.toString().split(':')[1]),
        positionAge: locationAge,
        speed: train.VEHSPD,
        linked: isLinked,
        linkedServiceId: train.TRNID,
      };
      // adds this Unit to the active Units array to later build the Unit object.
      let thisUnit = train.VEHID.substring(2, 6);
      if (activeUnits.indexOf(thisUnit) == -1) {
        activeUnits.push(thisUnit);
      }
      currentCarList.push(car);
    }
  }
  // itterate through all items in the activeUnits array and build unit objects from them
  for (u = 0; u < activeUnits.length; u++) {
    let FP = currentCarList.find(function(car) {
      return car.carId == 'FP' + activeUnits[u];
    });
    let FT = currentCarList.find(function(car) {
      return car.carId == 'FT' + activeUnits[u];
    });
    let linkedServiceId = '';
    if (FP !== undefined && FP.linked) {
      linkedServiceId = FP.linkedServiceId;
    } else if (FT !== undefined && FT.linked) {
      linkedServiceId = FT.linkedServiceId;
    };
    let trackingPreference;
    if (FP !== undefined && FT !== undefined && FP.positionAgeSeconds <= FT.positionAgeSeconds) {
      trackingPreference = FP;
    } else if (FP !== undefined) {
      trackingPreference = FP;
    } else if (FT !== undefined) {
      trackingPreference = FT;
    };

    let closestStation = getClosestStation(trackingPreference.lat, trackingPreference.lon);
    let guessLineArray = guessLine(closestStation.stationId);
    let meterage;
    if (line !== '???') {
      meterage = meterageCalculation.getmeterage(trackingPreference.lat, trackingPreference.lon, line);
    } else {
      meterage = guessLineArray[1];
    }
    let speed = trackingPreference.speed;
    let unit = {
      uniId: activeUnits[u],
      linkedServiceId: linkedServiceId,
      speed: speed,
      line: guessLineArray[0],
      meterage: meterage,
      closestStation: closestStation.stationId,
      FP: FP,
      FT: FT,
    };
    currentUnitList.push(unit);
  }
// OLD CODE

// for (gj = 0; gj < trains.length; gj++) {
// let train = trains[gj].attributes;
// if (train.EQUIPDESC.trim() == 'Matangi Power Car' || train.EQUIPDESC.trim() == 'Matangi Trailer Car') {
//   let loadTime = moment(train.TIMESTMPGIS);
//   let positionTime = moment(train.TIMESTMPNZ);
//   let locationAgeRAW = loadTime.diff(positionTime);
//   let locationAge = moment.utc(locationAgeRAW).format('mm:ss'); // locationAgeRAW.format('mmm:ss');
//   let closestStation = getClosestStation(train.LAT, train.LON);
//   let guessLineArray = guessLine(closestStation.stationId);
//     unit = {
//       UnitId: train.VEHID.substring(2, 6),
//       CarId: train.VEHID,
//       lat: train.LAT,
//       long: train.LON,
//       location: train.LAT + ' ' + train.LON,
//       positionAge: locationAge,
//       positionAgeSeconds: parseInt(locationAge.toString().split(':')[0]*60)
//                         + parseInt(locationAge.toString().split(':')[1]),
//       vehicleSpeed: train.VEHSPD,
//       serviceId: train.TRNID,
//       closestStation: closestStation.stationId,
//       closestStationMeterage: guessLineArray[1],
//       distance: closestStation.stationDistance,
//       line: guessLineArray[0],
//     };
//     currentUnitList.push(unit);
//   };
// };
return [currentUnitList, currentCarList];
};
/**
 * Makes a best guess of the line the train is on based on nearest station
 * @param {string} nearestStationId
 * @return {array} line
 */
function guessLine(nearestStationId) {
  let line;
  let meterage;
  if (nearestStationId != 'WELL'
    && nearestStationId != 'KAIW'
    && nearestStationId != 'NGAU') {
    for (st = 0; st < StationMeterage.length; st++) {
      if (StationMeterage[st].station_id == nearestStationId) {
        line = StationMeterage[st].KRLine;
        meterage = StationMeterage[st].meterage;
      };
    };
  } else {
    line = '???';
    meterage = 0;
  };
  return [line, meterage];
}
/**
 * finds the closest station from raw lat and long
 * @param {number} lat
 * @param {number} long
 * @return {object} stationDetails Object
 */
function getClosestStation(lat, long) {
  let thisLocation = {
    latitude: lat,
    longitude: long,
  };
  let closestStation = {
    stationId: '',
    latitude: 0,
    longitude: 0,
    stationDistance: 99999999999999,
  };

  for (st = 0; st < StationGeoboundaries.length; st++) {
    let queryStation = {
      stationId: StationGeoboundaries[st].station_id,
      latitude: (StationGeoboundaries[st].north + StationGeoboundaries[st].south) / 2,
      longitude: (StationGeoboundaries[st].east + StationGeoboundaries[st].west) / 2,
      stationDistance: 0,
    };
    queryStation.stationDistance = parseInt(distance(thisLocation, queryStation));
    if (queryStation.stationDistance < closestStation.stationDistance) {
      closestStation = queryStation;
    }
  }
  return closestStation;
};
/**
* gets distance in meters between 2 points
* @param {object} position1 lat long pair
* @param {object} position2 lat long pair
* @return {number}  distance in meters between 2 points
*/
function distance(position1, position2) {
  let lat1 = position1.latitude;
  let lat2 = position2.latitude;
  let lon1 = position1.longitude;
  let lon2 = position2.longitude;
  let R = 6371000; // radius of earth in metres
  let φ1 = lat1 * Math.PI / 180;
  let φ2 = lat2 * Math.PI / 180;
  let Δφ = (lat2 - lat1) * Math.PI / 180;
  let Δλ = (lon2 - lon1) * Math.PI / 180;
  let a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  let d = R * c;
  return d;
};
