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
    this.fromTimetable = false;
    if (vehicle === null) {
      this.fromTimetable = true;
    }
    this.busReplaced = checkIfBusReplaced(serviceId);
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
    if (this.fromTimetable) {
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
    this.arrived = (this.lastStation == this.timetable.destination);
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
    this.crew = rosteringLogic.crewRoster.getCrewDetailsForService(this.serviceId,
        current.rosterDuties,
        current.timetable);
    const lastServiceId = rosteringLogic.trainRoster.getPrevServiceTrainRoster(this.serviceId, current.tripSheet);
    const nextServiceId = rosteringLogic.trainRoster.getNextServiceTrainRoster(this.serviceId, current.tripSheet);
    // check last service exists
    if (lastServiceId == '') {
      this.hasLastService = false;
      this.lastServiceStillTracking = false;
    } else {
      this.hasLastService = true;
      this.lastService = timetableLogic.getTimetableDetails(lastServiceId,
          current.timetable,
          false,
          '');
      this.lastServiceStillTracking = checkPreviousServiceStillTracking(this.lastService.serviceId);
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
    let statusMessage = '';
    let tempStatus;
    // this will be in the format of [0] = delays,
    //                               [1] = tracking,
    //                               [2] = stopped
    const statusArray = ['', '', ''];

    if (this.thirdParty) {
      statusMessage = 'Non-Metlink Service';
      statusArray[0] = statusMessage;
      statusArray[1] = statusMessage;
      stopProcessing = true;
    } else if (this.fromTimetable) {
      statusMessage = 'No Linked Unit';

      if (this.busReplaced) {
        statusMessage = 'Bus Replaced';
      }

      if (this.lastServiceStillTracking) {
        statusMessage = 'Previous Service Delayed';
      }
      stopProcessing = true;
    } else if (this.arrived) {
      statusMessage = 'Arriving';
      stopProcessing = true;
    }
    // the early/late status generation
    if (!stopProcessing && !this.thirdParty) {
      if (this.varianceFriendly < -1.5) {
        tempStatus = 'Running Early';
        statusArray[0] = tempStatus;
      } else if (this.varianceFriendly < 5) {
        tempStatus = 'Running Ok';
        statusArray[0] = tempStatus;
      } else if (this.varianceFriendly < 15) {
        tempStatus = 'Running Late';
        statusArray[0] = tempStatus;
      } else if (this.varianceFriendly >= 15) {
        tempStatus = 'Running Very Late';
        statusArray[0] = tempStatus;
      }
      if (statusMessage == '') {
        statusMessage = tempStatus;
      }
    }
    // compare turnarounds to lateness to look for issues
    const trainTurnaroundExceeded = (this.hasNextService
      && (this.nextTurnaround + 5 < this.scheduleVariance.delay));
    const leTurnaroundExceeded = (this.crew.LE.nextService.serviceId !== ''
      && (this.crew.LE.nextService.turnaround + 5 < this.scheduleVariance.delay));
    const tmTurnaroundExceeded = (this.crew.TM.nextService.serviceId !== ''
      && (this.crew.TM.nextService.turnaround + 5 < this.scheduleVariance.delay));

    if (!stopProcessing
      && (trainTurnaroundExceeded || leTurnaroundExceeded || tmTurnaroundExceeded)) {
      tempStatus = 'Delay Risk:';

      if (trainTurnaroundExceeded) {
        tempStatus = tempStatus + ' Train';
      }
      if (leTurnaroundExceeded) {
        tempStatus = tempStatus + ' LE';
      }
      if (tmTurnaroundExceeded) {
        tempStatus = tempStatus + ' TM';
      }
      // check for negative turnarounds and just give an error status
      if ((this.nextTurnaround < 0)
        || (this.crew.LE.nextService.turnaround < 0)
        || (this.crew.TM.nextService.turnaround < 0)) {
        tempStatus = 'Timetravel Error';
      }
      if (stopProcessing == false) {
        statusMessage = tempStatus;
      }
      stopProcessing = true;
    }
    // look at linking issues
    if (!this.thirdParty && this.locationAge >= 180) {
      let inTunnel = false;
      // TempStatus = '';
      const tunnelExceptionsList = nzRailConventions.tunnelTrackingExceptions;
      // identify tunnel tracking issues
      if (this.direction == 'UP') {
        for (const tunnel of tunnelExceptionsList) {
          if (tunnel.southStation == this.lastStation
            && tunnel.secondsTheshold > this.locationAge
            && tunnel.line == this.line) {
            inTunnel = true;
            tempStatus = tunnel.statusMessage;
            statusArray[1] = tempStatus;
          }
        }
      } else if (this.direction == 'DOWN') {
        for (const tunnel of tunnelExceptionsList) {
          if (tunnel.northStation == this.lastStation
            && tunnel.secondsTheshold > this.locationAge
            && tunnel.line == this.line) {
            inTunnel = true;
            tempStatus = tunnel.statusMessage;
            statusArray[1] = tempStatus;
          }
        }
      }
      if (!inTunnel) {
        if (this.hasDeparted == false) {
          tempStatus = 'Awaiting Departure';
          statusArray[0] = tempStatus;
          statusArray[1] = tempStatus;
        } else if (this.secondVehicle !== undefined) {
          const firstCarLocation = {
            latitude: this.linkedVehicle.location.lat,
            longitude: this.linkedVehicle.location.long,
          };
          const secondCarLocation = {
            latitude: this.secondVehicle.location.lat,
            longitude: this.secondVehicle.location.long,
          };
          if (linearLogic.distanceBetween2Points(firstCarLocation, secondCarLocation) > 2000) {
            console.log('distance between units exceeds 2km');
            tempStatus = 'GPS Fault';
            statusArray[1] = tempStatus;
          } else {
            tempStatus = 'Check OMS Linking';
            statusArray[1] = tempStatus;
          }
        } else {
          tempStatus = 'Check OMS Linking';
          statusArray[1] = tempStatus;
        }
      }
      if (stopProcessing == false) {
        statusMessage = tempStatus;
        stopProcessing = true;
      }
    }
    if (!this.thirdParty && !this.hasDeparted) {
      tempStatus = 'Awaiting Departure';
      statusArray[0] = tempStatus;
      statusArray[1] = tempStatus;
      statusMessage = tempStatus;
      stopProcessing = true;
    }
    if (this.linkedVehicle !== null
      && this.linkedVehicle.location.speed == 0
      && this.lastStationCurrent == false) {
      if (this.lastStation == 'POMA' && this.timetable.origin == 'TAIT') {
        this.lastStation = 'TAIT';
        tempStatus = 'In Storage Road';
        statusArray[2] = tempStatus;
      } else if (this.lastStation == 'TEHO' && this.timetable.origin == 'WAIK') {
        this.lastStation = 'WAIK';
        tempStatus = 'In Turn Back Road';
        statusArray[2] = tempStatus;
      } else {
        tempStatus = 'Stopped between stations';
        statusArray[2] = tempStatus;
      }
      statusMessage = tempStatus;
      stopProcessing = true;
    }
    if (statusMessage == 0 || statusMessage == false || typeof statusMessage == 'undefined') {
      statusMessage = '';
    }
    this.statusMessage = statusMessage;
    this.statusArray = statusArray;

    /**
     * checks if a service is included in a bus replacement list
     * @param {string} serviceId
     * @return {boolean}
     */
    function checkIfBusReplaced(serviceId) {
      let busReplaced = false;
      for (let svc = 0; svc < current.busReplacementList.length; svc++) {
        if (current.busReplacementList[svc].serviceId == serviceId) {
          busReplaced = true;
        }
      }
      return busReplaced;
    }
    /**
     * checks if a service is still running
     * @param {string} lastServiceId
     * @return {boolean}
     */
    function checkPreviousServiceStillTracking(lastServiceId) {
      let previousServiceStillTracking = false;
      const geVisVehicles = current.geVisVehicles.features;
      for (let gv = 0; gv < geVisVehicles.length; gv++) {
        if (geVisVehicles[gv].attributes.TRNID == lastServiceId) {
          previousServiceStillTracking = true;
        }
      }
      return previousServiceStillTracking;
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
