let moment = require('moment-timezone');
moment().tz('Pacific/Auckland').format();
let Service = require('./serviceConstructor');
module.exports = function(geVisVehicles, current) {
  /**
   * represents a Train Vehicle, usually a EMU Car, Loco or Generator Carriage
   * @class Vehicle
   */
  class Vehicle {
    /**
     *Creates an instance of Unit.
     * @param {object} geVisVehicle
     * @memberof Unit
     */
    constructor(geVisVehicle) {
      this.VehicleId = geVisVehicle.VEHID.trim();
      this.selcall = geVisVehicle.SELCALL.trim();
      this.equipmentDescription = geVisVehicle.EQUIPDESC.trim();
      this.location = {
        lat: geVisVehicle.LON,
        long: geVisVehicle.LAT,
        speed: geVisVehicle.VEHSPD,
        compass: geVisVehicle.VEHDIR,
        meterage: -1,
        kiwirailLineId: '',
        estimatedDirection: '',
      }
      this.loadTime = moment(geVisVehicle.TIMESTMPGIS);
      this.positionTime = moment(geVisVehicle.TIMESTMPNZ);
      let locationAgeRAW = this.loadTime.diff(this.positionTime);
      this.locationAge = moment.utc(locationAgeRAW).format('mm:ss');
      this.locationAgeSeconds = Number(moment.utc(locationAgeRAW).valueOf()/1000);
      this.serviceId = geVisVehicle.TRNID.trim();
      this.serviceDescription = geVisVehicle.TRNDESCRP.trim();
      this.varianceKiwirail = gevisvariancefix(geVisVehicle.DELAYTIME);
      this.linked = function() {
        if (this.serviceId) {
          return true;
        } else {
          return false;
        }
      };
      this.secondVehicleId = function() {
        //  if EMU, work out what the second half of the train unit is
        let secondCar = '';
        if (this.equipmentDescription == 'Matangi Power Car') {
          secondCar = 'FT' + this.VehicleId.substring(2, 6);
        } else if (this.equipmentDescription == 'Matangi Trailer Car') {
          secondCar = 'FP' + this.VehicleId.substring(2, 6);
        }
        return secondCar;
      };
      /**
     * Converts GeVis API schedule variance from negative is late to negative is early
     * @param {number} scheduleVariance
     * @return {number} corrected scheduleVariance
     */
    function gevisvariancefix(scheduleVariance) {
      let fixedvariance;
      if (scheduleVariance < 0) {
        fixedvariance = Math.abs(scheduleVariance);
      };
      if (scheduleVariance == 0) {
        fixedvariance = 0;
      };
      if (scheduleVariance > 0) {
        fixedvariance = 0 - scheduleVariance;
      };
      return fixedvariance;
    };
    }
  }

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
  if (checkTrainMeetsSelectionCriteria(train)) {
    let vehicle = new Vehicle(train);
    // work in progress, this new 'Vehicle' object will replace a lot of the below code
    let secondVehicle;
    if (vehicle.secondVehicleId !== '') {
      for (su = 0; su < trains.length; su++) {
        if (trains[su].attributes.VEHID == vehicle.secondVehicleId) {
          secondVehicle = new Vehicle(trains[su].attributes)
          break;
        }
      }
    }
    let service = new Service(currentMoment,
      serviceId,
      serviceDescription,
      vehicle,
      secondVehicle,
      current);

        // let serviceId = train.TRNID;
        // let serviceDescription = train.TRNDESCRP;
        // let linkedCar = train.VEHID;
        // let secondCar = '';
        // let secondCarLat = '';
        // let secondCarLong = '';
        // //  work out what the second half of the train unit is
        // if (train.EQUIPDESC.trim() == 'Matangi Power Car') {
        //     secondCar = 'FT' + linkedCar.substring(2, 6);
        // } else if (train.EQUIPDESC.trim() == 'Matangi Trailer Car') {
        //     secondCar = 'FP' + linkedCar.substring(2, 6);
        // }
        // if (secondCar !== '') {
        //   for (su = 0; su < trains.length; su++) {
        //     if (trains[su].attributes.VEHID == secondCar) {
        //       secondCarLat = trains[su].attributes.LAT;
        //       secondCarLong = trains[su].attributes.LON;
        //       break;
        //     }
        //   }
        // }
        // let speed = train.VEHSPD;
        // let compass = train.VEHDIR;
        // let loadTime = moment(train.TIMESTMPGIS);
        // let positionTime = moment(train.TIMESTMPNZ);
        // let locationAgeRAW = loadTime.diff(positionTime);
        // // console.log(locationAgeRAW);
        // // console.log(Number(moment.utc(locationAgeRAW).format('s')));
        // // console.log(Number(moment.utc(locationAgeRAW).valueOf()/1000));
        // let locationAge = moment.utc(locationAgeRAW).format('mm:ss'); // locationAgeRAW.format('mmm:ss');
        // let locationAgeSeconds = Number(moment.utc(locationAgeRAW).valueOf()/1000);
        // let varianceKiwirail = train.DELAYTIME;
        // let lat = train.LAT;
        // let long = train.LON;
        //  new service object
        let service = new Service(currentMoment,
                                  serviceId,
                                  serviceDescription,
                                  linkedCar,
                                  secondCar,
                                  secondCarLat,
                                  secondCarLong,
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
  };
};
