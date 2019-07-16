const moment = require('moment-timezone');
moment().tz('Pacific/Auckland').format();
const Service = require('./serviceConstructor');
const Vehicle = require('./vehicleConstructor');
module.exports = function(geVisVehicles, current) {
  const currentTimetable = current.timetable;
  const currentTripSheet = current.tripSheet;
  const trains = geVisVehicles.features;
  const currentServices = [];
  const currentMoment = moment();
  // itterate through all items in geVisVehicles and use all relevant ones
  for (let gj = 0; gj < trains.length; gj++) {
    const train = trains[gj].attributes;
    if (checkTrainMeetsSelectionCriteria(train)) {
      const vehicle = new Vehicle(train);
      // work in progress, this new 'Vehicle' object will replace a lot of the below code
      let secondVehicle;
      if (vehicle.secondVehicleId !== '') {
        for (let su = 0; su < trains.length; su++) {
          if (trains[su].attributes.VEHID == vehicle.secondVehicleId) {
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
  const servicesToday = currentTripSheet;
  for (let st = 0; st < servicesToday.length; st++) {
    const timetabledService = servicesToday[st];
    alreadyTracking = false;
    const serviceTimePoints = currentTimetable.filter(
        (currentServiceTimetable) => currentServiceTimetable.serviceId == timetabledService.serviceId);
    const serviceDeparts = serviceTimePoints[0].departs;
    const serviceArrives = serviceTimePoints[serviceTimePoints.length-1].arrives;
    // if (timetabledService.serviceId == '3616') {
    //   console.log('this')
    // }

    // find if fits within specified timeband
    if (serviceDeparts < moment(currentMoment).subtract(1, 'minutes') &&
        serviceArrives > moment(currentMoment).add(5, 'minutes')) {
      // console.log(timetabledService.serviceId);
      for (let cs = 0; cs < currentServices.length; cs++) {
        if (!alreadyTracking && currentServices[cs].serviceId == timetabledService.serviceId) {
          alreadyTracking = true;
        }
      }
      if (alreadyTracking == false) {
        const service = new Service(currentMoment,
            timetabledService.serviceId,
            'FROM TIMETABLE',
            null,
            null,
            current);
        // look for previous service and mark if still running
        for (let csa = 0; csa < currentServices.length; csa++) {
          if (service.statusMessage !== 'Previous Service Delayed'
                  && currentServices[csa].serviceId == service.lastService) {
            service.statusMessage = 'Previous Service Delayed';
          }
        }
        currentServices.push(service);
      }
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
