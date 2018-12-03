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
        let serviceId = train.TRNID;
        let serviceDescription = train.TRNDESCRP;
        let linkedUnit = train.VEHID;
        let secondUnit = '';
        let secondUnitLat = '';
        let secondUnitLong = '';
        //  work out what the second half of the train unit is
        if (train.EQUIPDESC.trim() == 'Matangi Power Car') {
            secondUnit = 'FT' + linkedUnit.substring(2, 6);
        } else if (train.EQUIPDESC.trim() == 'Matangi Trailer Car') {
            secondUnit = 'FP' + linkedUnit.substring(2, 6);
        }
        if (secondUnit !== '') {
          for (su = 0; su < trains.length; su++) {
            if (trains[su].attributes.VEHID == secondUnit) {
              secondUnitLat = trains[su].attributes.LAT;
              secondUnitLong = trains[su].attributes.LON;
              break;
            }
          }
        }
        let speed = train.VEHSPD;
        let compass = train.VEHDIR;
        let loadTime = moment(train.TIMESTMPGIS);
        let positionTime = moment(train.TIMESTMPNZ);
        let locationAgeRAW = loadTime.diff(positionTime);
        // console.log(locationAgeRAW);
        // console.log(Number(moment.utc(locationAgeRAW).format('s')));
        // console.log(Number(moment.utc(locationAgeRAW).valueOf()/1000));
        let locationAge = moment.utc(locationAgeRAW).format('mm:ss'); // locationAgeRAW.format('mmm:ss');
        let locationAgeSeconds = Number(moment.utc(locationAgeRAW).valueOf()/1000);
        let varianceKiwirail = train.DELAYTIME;
        let lat = train.LAT;
        let long = train.LON;
        //  new service object
        let service = new Service(currentMoment,
                                  serviceId,
                                  serviceDescription,
                                  linkedUnit,
                                  secondUnit,
                                  secondUnitLat,
                                  secondUnitLong,
                                  speed,
                                  compass,
                                  locationAge,
                                  locationAgeSeconds,
                                  varianceKiwirail,
                                  lat,
                                  long,
                                  currentRosterDuties,
                                  currentTimetable,
                                  currentBusReplacementList);
        currentServices.push(service.web());
    };
  }
  //  get all timetabled services
  let alreadyTracking = false;
  //  cycle through services
  let servicesToday = currentTripSheet;
  for (let st = 0; st < servicesToday.length; st++) {
    let timetabledService = servicesToday[st];
    alreadyTracking = false;
    let serviceTimePoints = currentTimetable.filter(
        (currentServiceTimetable) => currentServiceTimetable.serviceId == timetabledService.serviceId);
    let serviceDeparts = serviceTimePoints[0].departs;
    let serviceArrives = serviceTimePoints[serviceTimePoints.length-1].arrives;
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
          };
          if (alreadyTracking == false) {
            let service = new Service(currentMoment,
              timetabledService.serviceId,
              'FROM TIMETABLE',
              '', '', '', '',
              '', '',
              '00:00',
              0,
              0,
              '', '',
              currentRosterDuties,
              currentTimetable,
              currentBusReplacementList);
            // look for previous service and mark if still running
            for (csa = 0; csa < currentServices.length; csa++) {
              if (service.statusMessage !== 'Previous Service Delayed'
                  && currentServices[csa].serviceId == service.lastService) {
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
      if (train.TRNID !== null &&
      train.LON > westernBoundary &&
      train.LAT < northernBoundary &&
      train.EQUIPDESC !== 'KAIARAHI' &&
      train.EQUIPDESC !== 'ARATERE' &&
      train.EQUIPDESC !== 'KAITAKI') {
          return true;
      } else {
      return false;
      }
  }
};
