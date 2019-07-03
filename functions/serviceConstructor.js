'use strict';
let moment = require('moment-timezone');
moment().tz('Pacific/Auckland').format();
// supporting data files
let stationGeoboundaries = require('../Data/StationGeoboundaries');
let stationMeterage = require('../Data/StationMeterage');
// supporting functions
let meterageCalculation = require('./meterageCalculation');
let delayCalculation = require('./delayCalculation');

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
    let lineTemp = getLineDirection(this.serviceId, this.serviceDescription);
    this.line = lineTemp.lineId;
    this.kiwirailLineId = lineTemp.kiwirailLineId;
    this.kiwirail = lineTemp.kiwirailBoolean;
    this.direction = lineTemp.direction;
    this.linkedVehicle = vehicle;
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
      this.lastStation = '';
      this.lastStationCurrent = false;
    } else {
      this.locationAge = this.linkedVehicle.locationAgeSeconds;
      this.location = this.linkedVehicle.location;
      this.moving = (this.location.speed >= 1);
      this.varianceKiwirail = this.linkedVehicle.varianceKiwirail;
      let lastStationDetails = getlaststationDetails(this.location);
      this.lastStation = lastStationDetails.stationId;
      this.lastStationCurrent = lastStationDetails.stationCurrent;
    }
    this.location.kiwirailLineId = this.kiwirailLineId;
    this.location = meterageCalculation.getmeterage(this.location);

    // several functions downstream depend on -1 meterage as universal invalid meterage
    if (this.location.meterage == '' || this.location.meterage == undefined) {
      this.location.meterage = -1;
    }

    this.timetable = getTimetableDetails(this.serviceId, current.timetable, this.kiwirail, this.serviceDescription);
    this.scheduleVariance = delayCalculation.getScheduleVariance(this.kiwirail,
      this.currenttime,
      this.direction,
      this.timetable,
      this.location,
      this.locationAge);
    this.scheduleVarianceMin = this.scheduleVariance.delay;
    // decide correct schedule variance to use
    // fall back to kiwirail variance if no calculation could be done
    this.varianceFriendly = '';
    if (this.scheduleVarianceMin == '') {
      this.varianceFriendly = this.varianceKiwirail;
    } else {
      this.varianceFriendly = parseInt(this.scheduleVarianceMin);
      if (this.varianceFriendly == -0) {
        this.varianceFriendly = 0;
      };
    }
    this.crew = getCrewDetails(this.serviceId, current.rosterDuties);
    // Want to implement at a later date. wont work currently
    // Will need to restructure 'this.crew' to be an array of staff.
    // this.passengers = getCrewDetails('P' + this.serviceId, current.rosterDuties);
    let lastServiceId = getSequenceUnit(this.serviceId, this.blockId, 'prev');
    let nextServiceId = getSequenceUnit(this.serviceId, this.blockId, 'next');
    // check last service exists
    if (lastServiceId == '') {
      this.hasLastService = false;
    } else {
      this.hasLastService = true;
      this.lastService = getTimetableDetails(lastServiceId, current.timetable, false, '');
    }
    // check next service exists
    if (nextServiceId == '') {
      this.hasNextService = false;
    } else {
      this.hasNextService = true;
      this.nextTurnaround = getTurnaroundFrom2Times(this.arrives, this.nextService.departs);
      this.nextService = getTimetableDetails(this.lastServiceId, current.timetable, false, '');
    }
    // generate Status Messages
    // used to be own function, but needed too many variables
    let stopProcessing = false;
    let StatusMessage = '';
    let TempStatus;
    // this will be in the format of [0] = delays,
    //                               [1] = tracking,
    //                               [2] = stopped
    let StatusArray = ['', '', ''];

    // filter out the non metlinks
    if (this.kiwirail) {
      TempStatus = 'Non-Metlink Service';
      StatusArray[0] = TempStatus;
      StatusArray[1] = TempStatus;
      if (StatusMessage == '' && stopProcessing == false) {
        StatusMessage = TempStatus;
      };
      stopProcessing = true;
    };
    // filter out things found from timetable
    if (this.linkedUnit == '') {
      let busReplaced = false;
      for (let svc = 0; svc < currentBusReplacementList.length; svc++) {
        if (currentBusReplacementList[svc].serviceId == this.serviceId) {
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
      };
      stopProcessing = true;
    };
    // filter already arrived trains
    if (this.lastStation == this.destination) {
      TempStatus = 'Arriving';
      if (StatusMessage == '' && stopProcessing == false) {
        StatusMessage = TempStatus;
      };
      stopProcessing = true;
    }
    // check for duplicate shiftnames error
    if (this.crew.TM.shiftId !== '' && this.crew.LE.shiftId == this.crew.TM.shiftId) {
      TempStatus = 'VDS Error';
      StatusMessage = TempStatus;
      stopProcessing = true;
    };
    // the early/late status generation
    if (this.varianceFriendly < -1.5 && this.kiwirail == false) {
      TempStatus = 'Running Early';
      StatusArray[0] = TempStatus;
    } else if (this.varianceFriendly < 5 && this.kiwirail == false) {
      TempStatus = 'Running Ok';
      StatusArray[0] = TempStatus;
    } else if (this.varianceFriendly < 15 && this.kiwirail == false) {
      TempStatus = 'Running Late';
      StatusArray[0] = TempStatus;
    } else if (this.varianceFriendly >= 15 && this.kiwirail == false) {
      TempStatus = 'Running Very Late';
      StatusArray[0] = TempStatus;
    };
    if (StatusMessage == '' && !stopProcessing) {
      StatusMessage = TempStatus;
    };
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
      };
      if ((this.crew.LE.nextService.turnaround < this.schedule_variance_min)) {
        TempStatus = TempStatus + ' LE';
      };
      if ((this.crew.TM.nextService.turnaround < this.schedule_variance_min)) {
        TempStatus = TempStatus + ' TM';
      };
      // check for negative turnarounds and just give an error status
      if ((this.NextTurnaround < 0)
        || (this.crew.LE.nextService.turnaround < 0)
        || (this.crew.TM.nextService.turnaround < 0)) {
        TempStatus = 'Timetravel Error';
      };
      if (stopProcessing == false) {
        StatusMessage = TempStatus;
      };
      stopProcessing = true;
    };
    // look at linking issues
    if (this.locationAgeSeconds >= 180 && this.kiwirail == false) {
      // TempStatus = '';
      let tunnelExceptionsList = [
        {
          tunnelName: 'Rimutaka', line: 'WRL', statusMessage: 'In Rimutaka Tunnel',
          southStation: 'MAYM', northStation: 'FEAT', secondsTheshold: 900,
        },
        {
          tunnelName: 'Rimutaka', line: 'WRL', statusMessage: 'In Rimutaka Tunnel',
          southStation: 'UPPE', northStation: 'FEAT', secondsTheshold: 900,
        },
        // above entry needed to be in twice due to tracking issues
        {
          tunnelName: 'Tawa Tunnel', line: 'KPL', statusMessage: 'In Tawa Tunnel',
          southStation: 'KAIW', northStation: 'TAKA', secondsTheshold: 600,
        },
        {
          tunnelName: 'Tunnel 1', line: 'KPL', statusMessage: 'In Tawa Tunnel',
          southStation: 'KAIW', northStation: 'T2', secondsTheshold: 600,
        },
        {
          tunnelName: 'Tunnel 2', line: 'KPL', statusMessage: 'In Tawa Tunnel',
          southStation: 'T1', northStation: 'TAKA', secondsTheshold: 240,
        },
      ];
      // identify tunnel tracking issues
      if (this.direction == 'UP') {
        for (let tunnel of tunnelExceptionsList) {
          if (tunnel.southStation == this.lastStation
            && tunnel.secondsTheshold > this.locationAgeSeconds
            && tunnel.line == this.line) {
            TempStatus = tunnel.statusMessage;
            StatusArray[1] = TempStatus;
          };
        };
      } else if (this.direction == 'DOWN') {
        for (let tunnel of tunnelExceptionsList) {
          if (tunnel.northStation == this.lastStation
            && tunnel.secondsTheshold > this.locationAgeSeconds
            && tunnel.line == this.line) {
            TempStatus = tunnel.statusMessage;
            StatusArray[1] = TempStatus;
          };
        };
      };
      if (this.departed == false && TempStatus == '') {
        TempStatus = 'Awaiting Departure';
        StatusArray[0] = TempStatus;
        StatusArray[1] = TempStatus;
      } else if (this.secondUnit !== '' && TempStatus == '') {
        let first = {
          latitude: this.lat,
          longitude: this.lon,
        };
        let sec = {
          latitude: this.secondUnitLat,
          longitude: this.secondUnitLon,
        };
        if (distance(first, sec) > 2000) {
          console.log('distance between units exceeds 2km');
          TempStatus = 'GPS Fault';
          StatusArray[1] = TempStatus;
        } else {
          TempStatus = 'Check OMS Linking';
          StatusArray[1] = TempStatus;
        };
      } else if (TempStatus == '') {
        TempStatus = 'Check OMS Linking';
        StatusArray[1] = TempStatus;
      };
      if (stopProcessing == false) {
        StatusMessage = TempStatus;
      };
    };
    if (this.departed == false && this.kiwirail == false) {
      TempStatus = 'Awaiting Departure';
      StatusArray[0] = TempStatus;
      StatusArray[1] = TempStatus;
      StatusMessage = TempStatus;
      stopProcessing = true;
    };
    if (this.speed == 0 && this.lastStationCurrent == false) {
      if (this.lastStation == 'POMA' && this.origin == 'TAIT') {
        this.lastStation = 'TAIT';
        TempStatus = 'In Storage Road';
        StatusArray[2] = TempStatus;
      } else if (this.lastStation == 'TEHO' && this.origin == 'WAIK') {
        this.lastStation = 'WAIK';
        TempStatus = 'In Turn Back Road';
        StatusArray[2] = TempStatus;
      } else {
        TempStatus = 'Stopped between stations';
        StatusArray[2] = TempStatus;
      };
      if (StatusMessage == '' && !stopProcessing) {
        StatusMessage = TempStatus;
      };
      stopProcessing = true;
    };
    if (StatusMessage == 0 || StatusMessage == false || typeof StatusMessage == 'undefined') {
      StatusMessage = '';
    };
    this.statusMessage = StatusMessage;
    this.statusArray = StatusArray;
    this.web = function() {
      // generate slim version of service for transmition over web
      let servicelite = {
        serviceId: this.serviceId,
        location: this.location,
        timetable: this.timetable,
        blockId: this.blockId,
        line: this.line,
        kiwirailLineId: this.kiwirailLineId,
        kiwirail: this.kiwirail,
        direction: this.direction,
        linkedUnit: this.linkedUnit,
        cars: this.cars,
        speed: this.speed,
        locationAge: this.locationAge,
        locationAgeSeconds: this.locationAgeSeconds,
        varianceFriendly: this.varianceFriendly,
        scheduleVariance: this.scheduleVariance,
        varianceKiwirail: this.varianceKiwirail,
        departs: this.departsString,
        origin: this.origin,
        arrives: this.arrivesString,
        destination: this.destination,
        lastStation: this.lastStation,
        lastStationCurrent: this.lastStationCurrent,
        LastService: this.LastService,
        hasNextService: this.hasNextService,
        nextService: this.nextService,
        nextTime: this.NextTimeString,
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
        lat: this.lat,
        long: this.lon,
        meterage: this.meterage,
      };
      return servicelite;
    };
    /**
     * gets the line based on the serviceId
     * and/or the serviceDescription
     * @param {string} serviceId
     * @param {string} serviceDescription
     * @return {object} line object
     */
    function getLineDirection(serviceId, serviceDescription) {
      let numcharId = convertToNumChar(serviceId);
      let serviceIdSuffix = '';
      let line = {
        lineId: '',
        kiwirailLineId: '',
        kiwirailBoolean: false,
        direction: '',
      };
      let freightdetect = false;
      if (serviceDescription !== null && serviceDescription !== undefined) {
        if (serviceDescription.includes('FREIGHT')) {
          freightdetect = true;
        };
      };
      // list of passenger serviceId prefixes and the line they relate to.
      let passengerLineAssociations = {
        PNL: ['12'],
        WRL: ['16', 'MA'],
        HVL: ['26', '36', '38', '39', '46', '49', 'PT', 'TA', 'TN', 'UH', 'WA'],
        MEL: ['56', '59', 'ML'],
        KPL: ['60', '62', '63', '64', '69', '72', '79', '82', '89', 'PA', 'PM', 'PU', 'PL', 'TW', 'WK'],
        JVL: ['92', '93', '99', 'JV'],
      };
      // list of freight serviceId prefixes and the line they relate to.
      let freightLineAssociations = {
        WRL: ['6', 'F'],
        KPL: ['2', '3', '5', 'B', 'E'],
      };
      // list of network infrastructure serviceId prefixes
      let networkServicesAssociations = ['WT'];

      // look for service id's with a random letter on the end
      // treat as a 3 digit
      if (numcharId === 'NNNC') {
        serviceId = serviceId.substring(0, 3);
      }
      // if a 4 digit serviceId, run the following checks
      if (serviceId.length == 4) {
        let tempServiceSubstring = serviceId.substring(0, 2);
        if (passengerLineAssociations.PNL.includes(tempServiceSubstring)) {
          line.lineId = 'PNL';
        } else if (passengerLineAssociations.WRL.includes(tempServiceSubstring)) {
          line.lineId = 'WRL';
        } else if (passengerLineAssociations.HVL.includes(tempServiceSubstring)) {
          line.lineId = 'HVL';
        } else if (passengerLineAssociations.MEL.includes(tempServiceSubstring)) {
          line.lineId = 'MEL';
        } else if (passengerLineAssociations.KPL.includes(tempServiceSubstring)) {
          line.lineId = 'KPL';
        } else if (passengerLineAssociations.JVL.includes(tempServiceSubstring)) {
          line.lineId = 'JVL';
        } else if (networkServicesAssociations.includes(tempServiceSubstring)) {
          line.lineId = '';
          line.kiwirailBoolean = true;
        } else {
          line.lineId = '';
        };
        if (numcharId === 'NNNC') {
          serviceIdSuffix = serviceId.substring(0, 3);
        }
        if (numcharId === 'CCNN') {
          serviceIdSuffix = serviceId.substring(2, 4);
        }
        // if a 3 digit serviceId, run the following checks
      } else if (serviceId.length == 3) {
        let tempServiceSubstring = serviceId.substring(0, 1);
        if (freightLineAssociations.KPL.includes(tempServiceSubstring)) {
          if (tempServiceSubstring == 'B') {
            line.lineId = 'KPL';
            if (freightdetect) {
              line.kiwirailBoolean = true;
            } else {
              line.kiwirailBoolean = false;
            };
          } else {
            line.lineId = 'KPL';
            line.kiwirailBoolean = true;
          };
        } else if (freightLineAssociations.WRL.includes(tempServiceSubstring)) {
          if (freightdetect) {
            line.lineId = 'WRL';
            line.kiwirailBoolean = true;
          } else {
            line.lineId = 'WRL';
            line.kiwirailBoolean = false;
          };
        } else {
          line.lineId = '';
        }
        if (numcharId === 'CCN') {
          serviceIdSuffix = serviceId.substring(2, 3);
        }
        if (numcharId === 'CNN') {
          serviceIdSuffix = serviceId.substring(1, 3);
        }
      };
      if (serviceIdSuffix % 2 == 0) {
        line.direction = 'UP';
      } else {
        line.direction = 'DOWN';
      };
      line.kiwirailLineId = lineToKiwirailLine(line);
      return line;
      /**
       * converts service ID into a numchar format
       * each digit is C for char or N for number
       * @param {string} text
       * @return {string} numchar
       */
      function convertToNumChar(text) {
        let numchar = '';
        for (let p = 0; p < text.length; p++) {
          if (isNaN(text[p])) {
            numchar = numchar + 'C';
          } else {
            numchar = numchar + 'N';
          };
        };
        return numchar;
      }
      /**
       * Takes a line and coverts it to
       * the corresponding KiwiRail line
       * @param {string} line
       * @return {string} - KiwiRail Line
       */
      function lineToKiwirailLine(line) {
        let KRLine;
        switch (line.lineId) {
          case 'PNL':
          case 'KPL':
            KRLine = 'NIMT';
            break;
          case 'HVL':
          case 'WRL':
            KRLine = 'WRAPA';
            break;
          case 'MEL':
            KRLine = 'MLING';
            break;
          case 'JVL':
            KRLine = 'JVILL';
            break;
          default:
            KRLine = '';
        }
        return KRLine;
      };
    }
    /**
 * performs a look up of the current timetable
 * returns details about the service Timetable
 * @param {String} serviceId
 * @param {Array} timetable
 * @param {Boolean} kiwirailBoolean
 * @param {String} serviceDescription
 * @return {Object} Timetable details
 */
    function getTimetableDetails(serviceId, timetable, kiwirailBoolean, serviceDescription) {
      let timetableDetails = {
        serviceId: serviceId,
        consist: '',
        blockId: '',
        line: '',
        direction: '',
        timingPoints: [],
        origin: '',
        departs: '',
        destination: '',
        arrives: '',
      };
      if (timetable == []) {
        // exit condition
        return timetableDetails;
      }
      let timingPoints = timetable.filter((timetable) => timetable.serviceId == serviceId);
      timetableDetails.timingPoints = timingPoints;
      if (timingPoints.length !== 0) {
        timetableDetails.consist = timingPoints[0].consist;
        timetableDetails.blockId = timingPoints[0].blockId;
        timetableDetails.line = timingPoints[0].line;
        timetableDetails.direction = timingPoints[0].direction;
        timetableDetails.origin = timingPoints[0].origin;
        timetableDetails.departs = timingPoints[0].departs;
        timetableDetails.destination = timingPoints[timingPoints.length - 1].destination;
        timetableDetails.arrives = timingPoints[timingPoints.length - 1].arrives;
      };
      if (kiwirailBoolean) {
        let KiwiRailDetails = guessKiwiRailTimetableDetails(serviceDescription);
        timetableDetails.origin = KiwiRailDetails[0];
        timetableDetails.destination = KiwiRailDetails[1];
      }
      return timetableDetails;
      /**
       * Takes a wild stab at what the Kiwirail origin and destination stations are
       * @param {*} description
       * @return {array} with [origin, destination]
       */
      function guessKiwiRailTimetableDetails(description) {
        const locations = [
          ['AUCKLAND', 'AUCK'],
          ['WELLINGTON', 'WELL'],
          ['PALMERSTON NORTH', 'PALM'],
          ['MT MAUNGANUI', 'TAUR'],
          ['HAMILTON', 'HAMI'],
          ['MASTERTON', 'MAST'],
        ];
        const locationMap = new Map(locations);
        description = description.toUpperCase();
        // check for the '-' if it isnt there then done even try to guess
        if (description.search('-') == -1) {
          return ['', ''];
        } else {
          // split the description by '-', format is usually 'ORIGIN - DESTINATION'
          description = description.split('-');
          let origin = '';
          let destination = '';
          for (let location of locationMap.keys()) {
            if (description[0].includes(location)) {
              origin = locationMap.get(location);
            };
            if (description[1].includes(location)) {
              destination = locationMap.get(location);
            };
          };
          return [origin, destination];
        };
      };
    };
    /** looks at location on line and works out
     *  given the direction,
     *  what the previous station would be
     *  and if location is current Station
     * @param {Object} location - location object
     * @return {object} - last Station Details
     */
    function getlaststationDetails(location) {
      let lastStation = {
        stationId: '',
        stationCurrent: false,
      };
      // abort sequence for invalid meterages
      if (location.meterage === -1) {
        return lastStation;
      }
      // checks lat long for current stations first
      for (let j = 0; j < stationGeoboundaries.length; j++) {
        let withinBoundary = (
          location.long > stationGeoboundaries[j].west
          && location.long < stationGeoboundaries[j].east
          && location.lat < stationGeoboundaries[j].north
          && location.lat > stationGeoboundaries[j].south);
        if (withinBoundary) {
          lastStation.stationId = stationGeoboundaries[j].station_id;
          lastStation.stationCurrent = true;
          break;
        }
      };
      // works out last station based on line, direction and meterage
      if (!lastStation.stationCurrent) {
        // eslint-disable-next-line max-len
        let filteredStationMeterage = stationMeterage.filter((stationMeterage) => stationMeterage.kiwirailLineId == location.kiwirailLineId);
        if (location.direction == 'DOWN') {
          filteredStationMeterage.reverse();// flip order
        };
        for (let m = 0; m < filteredStationMeterage.length; m++) {
          let prevStn = filteredStationMeterage[m - 1];
          let station = filteredStationMeterage[m];
          // loop until past meterage then use last station
          if (prevStn !== undefined && station.meterage >= location.meterage) {
            lastStation.stationId = prevStn.stationId;
            break;
          }
        }
      };
    };
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
            let staffRosterItems = currentRosterDuties.filter((currentRosterDuties) =>
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
            let dutyIndex = staffRosterItems.findIndex(function (duty) {
              return duty.dutyName == serviceId;
            });
            for (let d = dutyIndex + 1; d < staffRosterItems.length; d++) {
              if (staffRosterItems[d].dutyType.substring(0, 4) == 'TRIP') {
                let nextServiceDepart = getTimetableDetails(staffRosterItems[d].dutyName, current.timetable, false, '').departs;
                let thisServiceArrives = getTimetableDetails(serviceId, current.timetable, false, '').arrives;
                this.nextService = {
                  serviceId: staffRosterItems[d].dutyName,
                  serviceDeparts: nextServiceDepart,
                  serviceDepartsString: moment(nextServiceDepart).format('HH:mm'),
                  turnaround: getTurnaroundFrom2Times(thisServiceArrives, nextServiceDepart),
                };
                break;
              };
              if (staffRosterItems[d].dutyType == 'SOF') {
                this.nextService = {
                  serviceId: staffRosterItems[d].dutyName,
                  serviceDeparts: '',
                  serviceDepartsString: '',
                  turnaround: '',
                };
                break;
              };
            }
          }
        }
      }

      let crewDetails = {
        LE: '',
        LEExists: false,
        TM: '',
        TMExists: false,
        PO: [],
        POExists: false,
      };
      let serviceRosterItems = currentRosterDuties.filter(
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
    };
    /**
     * returns the next or previous service for that unit roster block
     * @param {string} serviceId
     * @param {integer} blockId
     * @param {string} nextOrPrev 'next' or 'prev'
     * @return {string} the service number requested, either next or previous
     */
    function getSequenceUnit(serviceId, blockId, nextOrPrev) {
      if (serviceId == undefined || blockId == undefined || blockId == '') {
        return '';
      };
      let seqServiceId;
      for (let s = 0; s < currentTimetable.length; s++) {
        if (nextOrPrev == 'prev') {
          if (currentTimetable[s].blockId == blockId
            && currentTimetable[s].serviceId == serviceId
            && currentTimetable[s - 1] !== undefined
            && currentTimetable[s - 1].serviceId !== serviceId) {
            if (currentTimetable[s - 1] !== undefined && currentTimetable[s].blockId == currentTimetable[s - 1].blockId) {
              seqServiceId = currentTimetable[s - 1].serviceId;
            } else {
              seqServiceId = '';
            };
          };
        } else if (nextOrPrev == 'next') {
          if (currentTimetable[s + 1] !== undefined
            && currentTimetable[s].blockId == blockId
            && currentTimetable[s].serviceId == (serviceId)
            && currentTimetable[s + 1].serviceId !== serviceId) {
            if (currentTimetable[s + 1] !== undefined
              && currentTimetable[s].blockId == currentTimetable[s + 1].blockId) {
              seqServiceId = currentTimetable[s + 1].serviceId;
            } else {
              seqServiceId = '';
            };
          };
        };
      };
      return seqServiceId;
    };
    /**
     * Works out turnaround time between an end time and the next start time
     * @param {object} EndTime moment object
     * @param {object} StartTime moment object
     * @return {number} turnaround time
     */
    function getTurnaroundFrom2Times(EndTime, StartTime) {
      if (EndTime == '' || StartTime == '' || EndTime == undefined || StartTime == undefined) {
        return '';
      };
      let Turnaround = moment.duration(StartTime.diff(EndTime)) / 1000 / 60;

      if (Turnaround < 0) {
        console.log(Turnaround);
      }

      if (Turnaround == NaN) {
        Turnaround = '';
      };
      return Math.floor(Turnaround);
    };
  }
};
