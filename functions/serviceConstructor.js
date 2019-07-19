'use strict';
const moment = require('moment-timezone');
moment().tz('Pacific/Auckland').format();
// supporting functions
const meterageCalculation = require('./meterageCalculation');
const delayCalculation = require('./delayCalculation');
const linearLogic = require('./linearLogic');
const rosteringLogic = require('./rosteringLogic');
const timetableLogic = require('./timetableLogic');
const nzRailConventions = require('../data/nzRailConventions');

/**
 * represents a train service
 * @class Service
 */
module.exports = class Service {
  /**
   *Creates an instance of Service.
    * @param {object} currentMoment
    * @param {string} serviceId
    * @param {string} serviceDescription
    * @param {object} vehicle
    * @param {object} secondVehicle
    * @param {object} current
    * @memberof Service
    */
  constructor(currentMoment,
      serviceId,
      serviceDescription,
      vehicle,
      secondVehicle,
      current) {
    let fromTimetable = false;
    if (vehicle === null) {
      fromTimetable = true;
    }
    this.currenttime = moment(currentMoment);
    this.serviceId = serviceId;
    this.serviceDescription = serviceDescription;
    this.line = linearLogic.getMetlinkLineFromId(this.serviceId);
    this.kiwirailLineId = linearLogic.convertMetlinkLinetoKiwirailLine(this.line);
    this.operator = linearLogic.getOperatorFromServiceId(this.serviceId);
    if (this.operator.kiwirail && this.kiwirailLineId == '') {
      this.kiwirailLineId = linearLogic.getKiwirailLineFromServiceId(this.serviceId);
    }
    this.thirdParty = (this.operator !== 'TDW');
    this.direction = linearLogic.getDirectionFromId(this.serviceId);
    this.linkedVehicle = vehicle;
    this.linkedVehicleId = this.linkedVehicle ? this.linkedVehicle.vehicleId : '';
    this.secondVehicle = secondVehicle;
    if (fromTimetable) {
      this.locationAge = 0;
      this.location = {
        lat: 0,
        long: 0,
        speed: 0,
        compass: 0,
        meterage: -1,
        kiwirailLineId: '',
        estimatedDirection: '',
      };
      this.moving = false;
      this.varianceKiwirail = 0;
    } else {
      this.locationAge = this.linkedVehicle.locationAgeSeconds;
      this.location = this.linkedVehicle.location;
      this.location.direction = this.direction;
      this.moving = (this.location.speed >= 1);
      this.varianceKiwirail = this.linkedVehicle.varianceKiwirail;
    }
    this.location.kiwirailLineId = this.kiwirailLineId;
    this.location = meterageCalculation.getmeterage(this.location);
    const lastStationDetails = linearLogic.getlaststationDetails(this.location);
    if (lastStationDetails) {
      this.lastStation = lastStationDetails.stationId;
      this.lastStationCurrent = lastStationDetails.stationCurrent;
    } else {
      this.lastStation = '';
      this.lastStationCurrent = false;
    }
    // several functions downstream depend on -1 meterage
    // as universal invalid meterage
    if (this.location.meterage == ''
      || this.location.meterage == undefined) {
      this.location.meterage = -1;
    }
    this.IncorrectLine = !linearLogic.checkCorrectLine(this.location);
    this.timetable = timetableLogic.getTimetableDetails(this.serviceId,
        current.timetable,
        this.thirdParty,
        this.serviceDescription);
    this.hasDeparted = (this.currenttime > this.timetable.departs);
    if (!this.IncorrectLine) {
      this.scheduleVariance = delayCalculation.getScheduleVariance(this.thirdParty,
          this.currenttime,
          this.direction,
          this.timetable,
          this.location,
          this.locationAge);
      this.scheduleVarianceMin = this.scheduleVariance.delay;
    }
    // decide correct schedule variance to use
    // fall back to kiwirail variance if no calculation could be done
    this.varianceFriendly = '';
    if (this.scheduleVarianceMin == '') {
      this.varianceFriendly = this.varianceKiwirail;
    } else {
      this.varianceFriendly = parseInt(this.scheduleVarianceMin);
    }
    this.crew = getCrewDetails(this.serviceId, current.rosterDuties);
    const lastServiceId = rosteringLogic.trainRoster.getPrevServiceTrainRoster(this.serviceId, current.tripSheet);
    const nextServiceId = rosteringLogic.trainRoster.getNextServiceTrainRoster(this.serviceId, current.tripSheet);
    // check last service exists
    if (lastServiceId == '') {
      this.hasLastService = false;
    } else {
      this.hasLastService = true;
      this.lastService = timetableLogic.getTimetableDetails(lastServiceId,
          current.timetable,
          false,
          '');
    }
    // check next service exists
    if (nextServiceId == '') {
      this.hasNextService = false;
      this.nextService = '';
      this.nextTurnaround = '';
    } else {
      this.hasNextService = true;
      this.nextService = timetableLogic.getTimetableDetails(nextServiceId, current.timetable, false, '');
      this.nextTurnaround = rosteringLogic.common.getTurnaround(this.timetable.arrives, this.nextService.departs);
    }

    // generate Status Messages
    // used to be own function, but needed too many variables
    let stopProcessing = false;
    let StatusMessage = '';
    let TempStatus;
    // this will be in the format of [0] = delays,
    //                               [1] = tracking,
    //                               [2] = stopped
    const statusArray = ['', '', ''];

    // filter out the non metlinks
    if (this.thirdParty) {
      TempStatus = 'Non-Metlink Service';
      statusArray[0] = TempStatus;
      statusArray[1] = TempStatus;
      if (StatusMessage == '' && stopProcessing == false) {
        StatusMessage = TempStatus;
      }
      stopProcessing = true;
    }
    // filter out things found from timetable
    if (this.linkedVehicle == undefined) {
      let busReplaced = false;
      for (let svc = 0; svc < current.busReplacementList.length; svc++) {
        if (current.busReplacementList[svc].serviceId == this.serviceId) {
          busReplaced = true;
        }
      }
      if (busReplaced) {
        TempStatus = 'Bus Replaced';
      } else {
        TempStatus = 'No Linked Unit';
      }
      if (StatusMessage == '' && stopProcessing == false) {
        StatusMessage = TempStatus;
      }
      stopProcessing = true;
    }
    // filter already arrived trains
    if (this.lastStation == this.destination) {
      TempStatus = 'Arriving';
      if (StatusMessage == '' && stopProcessing == false) {
        StatusMessage = TempStatus;
      }
      stopProcessing = true;
    }
    // check for duplicate shiftnames error
    if (this.crew.TM.shiftId !== '' && this.crew.LE.shiftId == this.crew.TM.shiftId) {
      TempStatus = 'VDS Error';
      StatusMessage = TempStatus;
      stopProcessing = true;
    }
    // the early/late status generation
    if (this.varianceFriendly < -1.5 && this.thirdParty == false) {
      TempStatus = 'Running Early';
      statusArray[0] = TempStatus;
    } else if (this.varianceFriendly < 5 && this.thirdParty == false) {
      TempStatus = 'Running Ok';
      statusArray[0] = TempStatus;
    } else if (this.varianceFriendly < 15 && this.thirdParty == false) {
      TempStatus = 'Running Late';
      statusArray[0] = TempStatus;
    } else if (this.varianceFriendly >= 15 && this.thirdParty == false) {
      TempStatus = 'Running Very Late';
      statusArray[0] = TempStatus;
    }
    if (StatusMessage == '' && !stopProcessing) {
      StatusMessage = TempStatus;
    }
    // compare turnarounds to lateness to look for issues
    if (!stopProcessing && ((this.NextTurnaround != '')
      && (this.NextTurnaround < this.schedule_variance_min))
      || ((this.crew.LE.nextService.turnaround != '')
        && (this.le_turnaround < this.schedule_variance_min))
      || ((this.crew.TM.nextService.turnaround != '')
        && (this.crew.TM.nextService.turnaround < this.schedule_variance_min))) {
      TempStatus = 'Delay Risk:';

      if ((this.NextTurnaround < this.schedule_variance_min)) {
        TempStatus = TempStatus + ' Train';
      }
      if ((this.crew.LE.nextService.turnaround < this.schedule_variance_min)) {
        TempStatus = TempStatus + ' LE';
      }
      if ((this.crew.TM.nextService.turnaround < this.schedule_variance_min)) {
        TempStatus = TempStatus + ' TM';
      }
      // check for negative turnarounds and just give an error status
      if ((this.NextTurnaround < 0)
        || (this.crew.LE.nextService.turnaround < 0)
        || (this.crew.TM.nextService.turnaround < 0)) {
        TempStatus = 'Timetravel Error';
      }
      if (stopProcessing == false) {
        StatusMessage = TempStatus;
      }
      stopProcessing = true;
    }
    // look at linking issues
    if (this.locationAge >= 180 && this.thirdParty == false) {
      // TempStatus = '';
      const tunnelExceptionsList = nzRailConventions.tunnelTrackingExceptions;
      // identify tunnel tracking issues
      if (this.direction == 'UP') {
        for (const tunnel of tunnelExceptionsList) {
          if (tunnel.southStation == this.lastStation
            && tunnel.secondsTheshold > this.locationAge
            && tunnel.line == this.line) {
            TempStatus = tunnel.statusMessage;
            statusArray[1] = TempStatus;
          }
        }
      } else if (this.direction == 'DOWN') {
        for (const tunnel of tunnelExceptionsList) {
          if (tunnel.northStation == this.lastStation
            && tunnel.secondsTheshold > this.locationAge
            && tunnel.line == this.line) {
            TempStatus = tunnel.statusMessage;
            statusArray[1] = TempStatus;
          }
        }
      }
      if (this.hasDeparted == false && TempStatus == '') {
        TempStatus = 'Awaiting Departure';
        statusArray[0] = TempStatus;
        statusArray[1] = TempStatus;
      } else if (this.secondVehicle !== null && TempStatus == '') {
        const firstCarLocation = {
          latitude: this.vehicle.location.lat,
          longitude: this.vehicle.location.long,
        };
        const secondCarLocation = {
          latitude: this.secondVehicle.location.lat,
          longitude: this.secondVehicle.location.long,
        };
        if (linearLogic.distanceBetween2Points(firstCarLocation, secondCarLocation) > 2000) {
          console.log('distance between units exceeds 2km');
          TempStatus = 'GPS Fault';
          statusArray[1] = TempStatus;
        } else {
          TempStatus = 'Check OMS Linking';
          statusArray[1] = TempStatus;
        }
      } else if (TempStatus == '') {
        TempStatus = 'Check OMS Linking';
        statusArray[1] = TempStatus;
      }
      if (stopProcessing == false) {
        StatusMessage = TempStatus;
      }
    }
    if (this.hasDeparted == false && this.thirdParty == false) {
      TempStatus = 'Awaiting Departure';
      statusArray[0] = TempStatus;
      statusArray[1] = TempStatus;
      StatusMessage = TempStatus;
      stopProcessing = true;
    }
    if (this.speed == 0 && this.lastStationCurrent == false) {
      if (this.lastStation == 'POMA' && this.origin == 'TAIT') {
        this.lastStation = 'TAIT';
        TempStatus = 'In Storage Road';
        statusArray[2] = TempStatus;
      } else if (this.lastStation == 'TEHO' && this.origin == 'WAIK') {
        this.lastStation = 'WAIK';
        TempStatus = 'In Turn Back Road';
        statusArray[2] = TempStatus;
      } else {
        TempStatus = 'Stopped between stations';
        statusArray[2] = TempStatus;
      }
      if (StatusMessage == '' && !stopProcessing) {
        StatusMessage = TempStatus;
      }
      stopProcessing = true;
    }
    if (StatusMessage == 0 || StatusMessage == false || typeof StatusMessage == 'undefined') {
      StatusMessage = '';
    }
    this.statusMessage = StatusMessage;
    this.statusArray = statusArray;
    /**
 * Takes a service Id and the currentRosterDuties
 * gives back a crew object
 * @param {string} serviceId
 * @param {array} currentRosterDuties
 * @return {object} crew details object
 */
    function getCrewDetails(serviceId, currentRosterDuties) {
      /**
       * represents a crew member
       * @class CrewMember
       */
      class CrewMember {
        /**
         *Creates an instance of CrewMember.
         * @param {string} shiftId
         * @memberof CrewMember
         */
        constructor(shiftId) {
          // functions needed
          const getNextServiceCrewRoster = rosteringLogic.crewRoster.getNextServiceCrewRoster;
          const getTurnaround = rosteringLogic.common.getTurnaround;
          // defaults
          this.staffId = '';
          this.staffName = '';
          this.shiftId = '';
          this.nextService = {
            serviceId: '',
            serviceDeparts: '',
            serviceDepartsString: '',
            turnaround: '',
          };
          if (shiftId) {
            // filter rosters for just this shift
            const staffRosterItems = currentRosterDuties.filter((currentRosterDuties) =>
              currentRosterDuties.shiftId == shiftId);
            this.staffId = staffRosterItems[0].staffId;
            this.staffName = staffRosterItems[0].staffName;
            this.shiftId = shiftId;
            this.nextService = {
              serviceId: '',
              serviceDeparts: '',
              serviceDepartsString: '',
              turnaround: '',
            };
            const thisServiceArrives = timetableLogic.getTimetableDetails(serviceId,
                current.timetable,
                false,
                '').arrives;
            const nextServiceId = getNextServiceCrewRoster(serviceId, shiftId, currentRosterDuties);
            const nextServiceDeparts = timetableLogic.getTimetableDetails(nextServiceId,
                current.timetable,
                false,
                '').departs;
            if (thisServiceArrives !== '' || nextServiceDeparts !== '') {
              this.nextService.serviceId = nextServiceId;
              this.nextService.serviceDeparts = moment(nextServiceDeparts);
              if (this.nextService.serviceDeparts !== '' && this.nextService.serviceDeparts.isValid()) {
                this.nextService.serviceDepartsString = moment(nextServiceDeparts).format('HH:mm');
                this.nextService.turnaround = getTurnaround(thisServiceArrives, nextServiceDeparts);
              } else {
                this.nextService.serviceDepartsString = '';
                this.nextService.turnaround = '';
              }
            }
          }
        }
      }

      const crewDetails = {
        LE: '',
        LEExists: false,
        TM: '',
        TMExists: false,
        PO: [],
        POExists: false,
      };
      const serviceRosterItems = currentRosterDuties.filter(
          (currentRosterDuties) => currentRosterDuties.dutyName == serviceId);
      for (let c = 0; c < serviceRosterItems.length; c++) {
        if (serviceRosterItems[c].dutyType == 'TRIP') {
          crewDetails.LE = new CrewMember(serviceRosterItems[c].shiftId);
          crewDetails.LEExists = true;
        }
        if (serviceRosterItems[c].dutyType == 'TRIPT') {
          crewDetails.TM = new CrewMember(serviceRosterItems[c].shiftId);
          crewDetails.TMExists = true;
        }
        if (serviceRosterItems[c].dutyType == 'TRIPP') {
          crewDetails.PO.push(new CrewMember(serviceRosterItems[c].shiftId));
          crewDetails.POExists = true;
        }
      }
      // extra pass to find things marked as 'OTH' and 'SHUNT'
      for (let c = 0; c < serviceRosterItems.length; c++) {
        if (crewDetails.LE.staffName == undefined && serviceRosterItems[c].shiftType == 'LE') {
          crewDetails.LE = new CrewMember(serviceRosterItems[c].shiftId);
          crewDetails.LEExists = true;
        }
        if (crewDetails.TM.staffName == undefined && serviceRosterItems[c].shiftType == 'TM') {
          crewDetails.TM = new CrewMember(serviceRosterItems[c].shiftId);
          crewDetails.TMExists = true;
        }
        if (crewDetails.PO == [] && serviceRosterItems[c].shiftType == 'PO') {
          crewDetails.PO.push(new CrewMember(serviceRosterItems[c].shiftId));
          crewDetails.POExists = true;
        }
      }
      // fill in blank staff if none exist
      if (crewDetails.LE.staffName == undefined) {
        crewDetails.LE = new CrewMember();
      }
      if (crewDetails.TM.staffName == undefined) {
        crewDetails.TM = new CrewMember();
      }
      return crewDetails;
    }
  }

  /**
   * generates a slim version of service for transmission over web
   * this is the legacy version to work with the old client
   * @return {object} service object
   */
  webLegacy() {
    const serviceLite = {
      serviceId: this.serviceId,
      blockId: this.timetable.blockId || '',
      line: this.line,
      kiwirail: this.thirdParty,
      direction: this.direction,
      linkedUnit: this.linkedVehicleId,
      cars: this.timetable.consist || '',
      speed: this.location.speed,
      locationAge: this.linkedVehicle ? this.linkedVehicle.locationAge : '',
      locationAgeSeconds: this.locationAge,
      varianceFriendly: this.varianceFriendly,
      scheduleVariance: this.scheduleVariance ? this.scheduleVariance.delayFriendly : '',
      varianceKiwirail: this.varianceKiwirail,
      departs: this.timetable.departs ? this.timetable.departs.format('HH:mm') : '',
      origin: this.timetable.origin || '',
      arrives: this.timetable.arrives ? this.timetable.arrives.format('HH:mm') : '',
      destination: this.timetable.destination || '',
      lastStation: this.lastStation,
      lastStationCurrent: this.lastStationCurrent,
      hasNextService: this.hasNextService,
      nextService: this.nextService.serviceId || '',
      nextTime: this.nextService ? this.nextService.departs.format('HH:mm') : '',
      LE: this.crew.LE.staffName,
      LEExists: this.crew.LEExists,
      LEShift: this.crew.LE.shiftId,
      LENextService: this.crew.LE.nextService.serviceId,
      LENextServiceTime: this.crew.LE.nextService.serviceDepartsString,
      TM: this.crew.TM.staffName,
      TMExists: this.crew.TMExists,
      TMShift: this.crew.TM.shiftId,
      TMNextService: this.crew.TM.nextService.serviceId,
      TMNextServiceTime: this.crew.TM.nextService.serviceDepartsString,
      passengerOperatorList: this.crew.PO,
      POExists: this.crew.POExists,
      statusMessage: this.statusMessage,
      statusArray: this.statusArray,
      lat: this.location.lat,
      long: this.location.long,
      meterage: this.location.meterage,
    };
    return serviceLite;
  }
};
