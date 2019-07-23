const moment = require('moment-timezone');
moment().tz('Pacific/Auckland').format();
const Service = require('./serviceConstructor');
const Vehicle = require('./vehicleConstructor');
const timetableLogic = require('./timetableLogic');

module.exports = function(geVisVehicles, current, time) {
  const currentTimetable = current.timetable;
  const trains = geVisVehicles;
  const currentServices = [];
  const currentMoment = time;
  // itterate through all items in geVisVehicles and use all relevant ones
  for (let gj = 0; gj < trains.length; gj++) {
    const train = trains[gj].attributes;
    if (checkTrainMeetsSelectionCriteria(train)) {
      const vehicle = new Vehicle(train);
      // work in progress, this new 'Vehicle' object will replace a lot of the below code
      const secondVehicleId = vehicle.secondVehicleId();
      let secondVehicle;
      if (secondVehicleId !== '') {
        for (let su = 0; su < trains.length; su++) {
          if (trains[su].attributes.VEHID == secondVehicleId) {
            secondVehicle = new Vehicle(trains[su].attributes);
            break;
          }
        }
      }

      const service = new Service(currentMoment,
          vehicle.serviceId,
          vehicle.serviceDescription,
          vehicle,
          secondVehicle,
          current);
      currentServices.push(service);
    }
  }
  //  get all timetabled services
  let alreadyTracking = false;
  //  cycle through services
  const validTimetabledServices = timetableLogic.getValidServicesAtTime(currentTimetable, currentMoment);
  for (let vts = 0; vts < validTimetabledServices.length; vts++) {
    alreadyTracking = false;
    // check against currentServices
    for (let cs = 0; cs < currentServices.length; cs++) {
      if (!alreadyTracking && currentServices[cs].serviceId == validTimetabledServices[vts]) {
        alreadyTracking = true;
      }
    }
    if (!alreadyTracking) {
      const service = new Service(currentMoment,
          validTimetabledServices[vts],
          'FROM TIMETABLE',
          null,
          null,
          current);
      currentServices.push(service);
    }
  }
  return currentServices;
  /**
   * decides if train meets selection criteria
   * @param {object} train
   * - a train object from GeVis API
   * @return {boolean} true if meets criteria
   */
  function checkTrainMeetsSelectionCriteria(train) {
    const northernBoundary = -40.625887; // Levin
    const westernBoundary = 174.5; // cook strait
    const meetsLocationCondition = (train.LON > westernBoundary && train.LAT < northernBoundary);
    const excludedEquiptment = ['KAIARAHI', 'ARATERE', 'KAITAKI'].includes(train.EQUIPDESC);
    if (train.TRNID !== null &&
      meetsLocationCondition &&
      !excludedEquiptment) {
      return true;
    } else {
      return false;
    }
  }
};
