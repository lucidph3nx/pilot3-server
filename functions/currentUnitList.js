const Vehicle = require('./vehicleConstructor');
const Unit = require('./unitConstructor');
/**
 * generates a list of all units and cars
 * based on a geVisVehicles Object
 * Only selects for Matangi EMU
 * @param {object} geVisVehicles
 * @return {array} an Array with 2 sub-Arrays [currentUnitList, currentCarList]
 */
module.exports = function(geVisVehicles) {
  const trains = geVisVehicles.features;
  const activeUnits = [];
  const currentCarList = [];
  const currentUnitList = [];

  // itterate through all items in GeVisJSON and use all relevant ones
  for (gj = 0; gj < trains.length; gj++) {
    const car = new Vehicle(trains[gj].attributes);
    const isMatangiPowerCar = (car.equipmentDescription == 'Matangi Power Car');
    const isMatangiTrailerCar = (car.equipmentDescription == 'Matangi Trailer Car');
    if (isMatangiPowerCar || isMatangiTrailerCar) {
      // adds this Unit to the active Units array to later build the Unit object.
      const thisUnit = car.vehicleId.substring(2, 6);
      if (activeUnits.indexOf(thisUnit) == -1) {
        activeUnits.push(thisUnit);
      }
      currentCarList.push(car);
    }
  };
  // itterate through all items in the activeUnits array and build units
  for (u = 0; u < activeUnits.length; u++) {
    const FP = currentCarList.find(function(car) {
      return car.vehicleId == 'FP' + activeUnits[u];
    });
    const FT = currentCarList.find(function(car) {
      return car.vehicleId == 'FT' + activeUnits[u];
    });
    const unit = new Unit(FP, FT);

    currentUnitList.push(unit);
  }
  return [currentUnitList, currentCarList];
};
