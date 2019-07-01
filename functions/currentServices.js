const moment = require('moment-timezone');
moment().tz('Pacific/Auckland').format();
const Service = require('./serviceConstructor');
<<<<<<< HEAD
module.exports = function(geVisVehicles, currentWorkingData) {
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
      this.lat = geVisVehicle.LON;
      this.long = geVisVehicle.LAT;
      this.speed = geVisVehicle.VEHSPD;
      this.compass = geVisVehicle.VEHDIR;
      this.loadTime = moment(geVisVehicle.TIMESTMPGIS);
      this.positionTime = moment(geVisVehicle.TIMESTMPNZ);
      const locationAgeRAW = this.loadTime.diff(this.positionTime);
      this.locationAge = moment.utc(locationAgeRAW).format('mm:ss'); ;
      this.locationAgeSeconds = Number(moment.utc(locationAgeRAW).valueOf()/1000);
      this.serviceId = geVisVehicle.TRNID.trim();
      this.serviceDescription = geVisVehicle.TRNDESCRP.trim();
      this.varianceKiwirail = geVisVehicle.DELAYTIME;
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
          secondCar = 'FT' + linkedCar.substring(2, 6);
        } else if (this.equipmentDescription == 'Matangi Trailer Car') {
          secondCar = 'FP' + linkedCar.substring(2, 6);
        }
        return secondCar;
      };
    }
  }

  const currentRosterDuties = currentWorkingData.rosterDuties;
  const currentTimetable = currentWorkingData.timetable;
  const currentTripSheet = currentWorkingData.tripSheet;
  const currentBusReplacementList = currentWorkingData.busReplacementList;
=======
const Vehicle = require('./vehicleConstructor');
module.exports = function(geVisVehicles, current) {
  const currentTimetable = current.timetable;
  const currentTripSheet = current.tripSheet;
>>>>>>> 080ba4c31e9f2b238795b860c520394481ed6b29
  const trains = geVisVehicles.features;
  const currentServices = [];
  const currentMoment = moment();
  // itterate through all items in geVisVehicles and use all relevant ones
  for (gj = 0; gj < trains.length; gj++) {
    const train = trains[gj].attributes;
    if (checkTrainMeetsSelectionCriteria(train)) {
<<<<<<< HEAD
      // work in progress, this new 'Vehicle' object will replace a lot of the below code
      // const vehicle = new Vehicle(train);
      // let secondVehicle;
      // if (vehicle.secondVehicleId !== '') {
      //   for (su = 0; su < trains.length; su++) {
      //     if (trains[su].attributes.VEHID == vehicle.secondVehicleId) {
      //       secondVehicle = new Vehicle(trains[su].attributes);
      //       break;
      //     }
      //   }
      // }
      // const serviceId = vehicle.serviceId
      // const serviceDescription = vehicle.serviceDescription;
      // const service = new Service(currentMoment,
      //   serviceId,
      //   serviceDescription,
      //   vehicle,
      //   secondVehicle,
      //   currentWorkingData
      //   );

      const serviceId = train.TRNID;
      const serviceDescription = train.TRNDESCRP;
      const linkedCar = train.VEHID;
      let secondCar = '';
      let secondCarLat = '';
      let secondCarLong = '';
      //  work out what the second half of the train unit is
      if (train.EQUIPDESC.trim() == 'Matangi Power Car') {
        secondCar = 'FT' + linkedCar.substring(2, 6);
      } else if (train.EQUIPDESC.trim() == 'Matangi Trailer Car') {
        secondCar = 'FP' + linkedCar.substring(2, 6);
      }
      if (secondCar !== '') {
        for (su = 0; su < trains.length; su++) {
          if (trains[su].attributes.VEHID == secondCar) {
            secondCarLat = trains[su].attributes.LAT;
            secondCarLong = trains[su].attributes.LON;
=======
      const vehicle = new Vehicle(train);
      // work in progress, this new 'Vehicle' object will replace a lot of the below code
      let secondVehicle;
      if (vehicle.secondVehicleId !== '') {
        for (su = 0; su < trains.length; su++) {
          if (trains[su].attributes.VEHID == vehicle.secondVehicleId) {
            secondVehicle = new Vehicle(trains[su].attributes);
>>>>>>> 080ba4c31e9f2b238795b860c520394481ed6b29
            break;
          }
        }
      }
<<<<<<< HEAD
      const speed = train.VEHSPD;
      const compass = train.VEHDIR;
      const loadTime = moment(train.TIMESTMPGIS);
      const positionTime = moment(train.TIMESTMPNZ);
      const locationAgeRAW = loadTime.diff(positionTime);
      const locationAge = moment.utc(locationAgeRAW).format('mm:ss');
      const locationAgeSeconds = Number(moment.utc(locationAgeRAW).valueOf()/1000);
      const varianceKiwirail = train.DELAYTIME;
      const lat = train.LAT;
      const long = train.LON;
      //  new service object
      const service = new Service(currentMoment,
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
=======

      const service = new Service(currentMoment,
          vehicle.serviceId,
          vehicle.serviceDescription,
          vehicle,
          secondVehicle,
          current);
>>>>>>> 080ba4c31e9f2b238795b860c520394481ed6b29
      currentServices.push(service.web());
    };
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
      };
      if (alreadyTracking == false) {
        const service = new Service(currentMoment,
            timetabledService.serviceId,
            'FROM TIMETABLE',
<<<<<<< HEAD
            '', '', '', '',
            '', '',
            '00:00',
            0,
            0,
            '', '',
            currentRosterDuties,
            currentTimetable,
            currentBusReplacementList);
=======
            null,
            null,
            current);
>>>>>>> 080ba4c31e9f2b238795b860c520394481ed6b29
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
<<<<<<< HEAD
  }
=======
  };
>>>>>>> 080ba4c31e9f2b238795b860c520394481ed6b29
};
