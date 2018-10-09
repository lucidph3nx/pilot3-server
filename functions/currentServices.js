let moment = require('moment-timezone');
moment().tz('Pacific/Auckland').format();
let Service = require('./serviceConstructor');
module.exports = function(geVisVehicles, current) {
  let currentRosterDuties = current.rosterDuties;
  let currentTimetable = current.timetable;
  let currentTripSheet = current.tripSheet;
  let currentBusReplacementList = current.busReplacementList;
  let trains = geVisVehicles.features;
  let currentServices = [];
  let currentMoment = moment();
  // itterate through all items in geVisVehicles and use all relevant ones
  for (gj = 0; gj < trains.length; gj++) {
    let train = trains[gj].attributes;
  if (meetsTrainSelectionCriteria(train)) {
        let serviceId = train.TrainID;
        let serviceDate = train.TrainDate;
        let serviceDescription = train.TrainDesc;
        let linkedUnit = train.VehicleID;
        let secondUnit = '';
        let secondUnitLat = '';
        let secondUnitLong = '';
        //  work out what the second half of the train unit is
        if (train.EquipDesc.trim() == 'Matangi Power Car') {
            secondUnit = 'FT' + linkedUnit.substring(2, 6);
        } else if (train.EquipDesc.trim() == 'Matangi Trailer Car') {
            secondUnit = 'FP' + linkedUnit.substring(2, 6);
        }
        if (secondUnit !== '') {
          for (su = 0; su < trains.length; su++) {
            if (trains[su].attributes.VehicleID == secondUnit) {
              secondUnitLat = trains[su].attributes.Latitude;
              secondUnitLong = trains[su].attributes.Longitude;
              break;
            }
          }
        }
        let speed = train.VehicleSpeed;
        let compass = train.DirectionCompass;
        let locationAge = train.PositionAge;
        let varianceKiwirail = train.DelayTime;
        let lat = train.Latitude;
        let long = train.Longitude;
        //  new service object
        let service = new Service(currentMoment,
                                  serviceId,
                                  serviceDate,
                                  serviceDescription,
                                  linkedUnit,
                                  secondUnit,
                                  secondUnitLat,
                                  secondUnitLong,
                                  speed,
                                  compass,
                                  locationAge,
                                  varianceKiwirail,
                                  lat,
                                  long,
                                  currentRosterDuties,
                                  currentTimetable,
                                  currentBusReplacementList);
        currentServices.push(service.web());
    };
  }
  //  get all timetabled services that are not active
  let alreadyTracking = false;
  let serviceDate = moment().format('YYYYMMDD');
  //  cycle through services
  let servicesToday = currentTripSheet;
  for (st = 0; st < servicesToday.length; st++) {
    let timetabledService = servicesToday[st];
    alreadyTracking = false;
    console.log(st)
    console.log(servicesToday[st])
    let serviceTimePoints = currentTimetable.filter(
        (currentServiceTimetable) => currentServiceTimetable.serviceId == timetabledService.serviceId);
    console.log(serviceTimePoints[0].serviceId)
    let serviceDeparts = serviceTimePoints[0].departs;
    let serviceArrives = serviceTimePoints[serviceTimePoints.length-1].arrives;
    console.log(serviceDeparts.format('HH:mm') + ' ' + serviceArrives.format('HH:mm'))
    // find if fits within specified timeband
    if (serviceDeparts < moment(currentMoment).subtract(1, 'minutes') &&
        serviceArrives > moment(currentMoment).add(5, 'minutes')) {
          for (cs = 0; cs < currentServices.length; cs++) {
            if (currentServices[cs].serviceId == timetabledService.serviceId) {
              alreadyTracking = true;
            }
            if (alreadyTracking) break;
          };
          if (alreadyTracking == false) {
            let service = new Service(currentMoment,
              timetabledService.serviceId,
              serviceDate,
              'FROM TIMETABLE',
              '', '', '', '',
              '', '',
              '00:00',
              0,
              '', '',
              currentRosterDuties,
              currentTimetable,
              currentBusReplacementList);
            // look for previous service and mark if still running
            for (csa = 0; csa < currentServices.length; csa++) {
              if (currentServices[csa].serviceId == service.LastService) {
                service.statusMessage = 'Previous Service Delayed';
              }
            };
            currentServices.push(service.web());
          }
      };
  };
  return currentServices;
  /**
   * decides if train meets selection criteria
   * @param {object} train
   * - a train object from GeVis API
   * @return {boolean}
   */
  function meetsTrainSelectionCriteria(train) {
      const northernBoundary = -40.625887; // Levin
      const westernBoundary = 174.5; // cook strait
      if (train.TrainID !== '' &&
      train.Longitude > westernBoundary &&
      train.Latitude < northernBoundary &&
      train.EquipmentDesc.trim() !== 'Rail Ferry' ) {
          return true;
      } else {
      return false;
      }
  }
};
