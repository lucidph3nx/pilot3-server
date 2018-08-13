module.exports = function(geVisVehicles) {
  let trains = geVisVehicles.features;
  let currentUnitList = [];

  // itterate through all items in GeVisJSON and use all relevant ones
  for (gj = 0; gj < trains.length; gj++) {
  let train = trains[gj].attributes;
  if (train.EquipDesc.trim() == 'Matangi Power Car' || train.EquipDesc.trim() == 'Matangi Trailer Car') {
      unit = {
        UnitId: train.VehicleID,
        location: train.Latitude + ' ' + train.Longitude,
        positionAge: train.PositionAge,
        positionAgeSeconds: parseInt(train.PositionAge.toString().split(':')[0]*60)
                          + parseInt(train.PositionAge.toString().split(':')[1]),
        vehicleSpeed: train.VehicleSpeed,
        serviceId: train.TrainID,
      };
      currentUnitList.push(unit);
    };
  };
  return currentUnitList;
};
