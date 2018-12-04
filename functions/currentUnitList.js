let moment = require('moment-timezone');
moment().tz('Pacific/Auckland').format();

module.exports = function(geVisVehicles) {
  let trains = geVisVehicles.features;
  let currentUnitList = [];

  // itterate through all items in GeVisJSON and use all relevant ones
  for (gj = 0; gj < trains.length; gj++) {
  let train = trains[gj].attributes;
  if (train.EQUIPDESC.trim() == 'Matangi Power Car' || train.EQUIPDESC.trim() == 'Matangi Trailer Car') {
    let loadTime = moment(train.TIMESTMPGIS);
    let positionTime = moment(train.TIMESTMPNZ);
    let locationAgeRAW = loadTime.diff(positionTime);
    let locationAge = moment.utc(locationAgeRAW).format('mm:ss'); // locationAgeRAW.format('mmm:ss');
      unit = {
        UnitId: train.VEHID.substring(2, 6),
        CarId: train.VEHID,
        location: train.LAT + ' ' + train.LON,
        positionAge: locationAge,
        positionAgeSeconds: parseInt(locationAge.toString().split(':')[0]*60)
                          + parseInt(locationAge.toString().split(':')[1]),
        vehicleSpeed: train.VEHSPD,
        serviceId: train.TRNID,
      };
      currentUnitList.push(unit);
    };
  };
  return currentUnitList;
};
