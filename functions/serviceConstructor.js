'use strict';
let moment = require('moment-timezone');
moment().tz('Pacific/Auckland').format();
// supporting data files
let StationGeoboundaries = require('../Data/StationGeoboundaries');
let StationMeterage = require('../Data/StationMeterage');
// let lineshapes = require('../Data/lineshapes');
let meterageCalculation = require('./meterageCalculation');

// service constructor Object, represents a single rail service
module.exports = function Service(CurrentMoment,
  serviceId,
  serviceDescription,
  linkedUnit,
  secondUnit,
  secondUnitLat, secondUnitLon,
  speed, compass,
  locationAge,
  locationAgeSeconds,
  varianceKiwirail,
  lat, lon,
  currentRosterDuties,
  currentTimetable,
  currentBusReplacementList) {
  this.currenttime = moment(CurrentMoment);
  this.serviceId = serviceId;
  this.serviceDescription = serviceDescription;
  this.line = getlinefromserviceid(this.serviceId)[0];
  if (this.line == undefined) {
    this.line = '';
  }
  this.kiwirail = getlinefromserviceid(this.serviceId, serviceDescription)[1];
  this.direction = getdirectionfromserviceid(this.serviceId);
  if (this.direction == undefined) {
    this.direction = '';
  }
  this.KRline = lineToKiwiRailLine(this.line);
  this.linkedUnit = linkedUnit;
  // if linked unit is track machine, this.kiwirail is true
  if (this.linkedUnit.substring(0, 3) == 'ETM') {
    this.kiwirail = true;
  };
  if (this.kiwirail == undefined) {
    this.kiwirail = true;
  }
  this.secondUnit = secondUnit;
  this.secondUnitLat = secondUnitLat;
  this.secondUnitLon = secondUnitLon;
  this.cars = getCarsCurrentTimetable(this.serviceId);
  if (this.cars == undefined) {
    this.cars = '';
  }
  this.blockId = getBlockIdCurrentTimetable(this.serviceId);
  this.speed = speed;
  this.compass = compass;
  this.moving = (speed >= 1);
  this.locationAge = locationAge;
  this.locationAgeSeconds = locationAgeSeconds;
  // parseInt(this.locationAge.toString().split(':')[0]*60) +
  // parseInt(this.locationAge.toString().split(':')[1]);
  this.varianceKiwirail = gevisvariancefix(varianceKiwirail);
  this.timetableDetails = getTimetableDetails(this.serviceId, this.serviceDescription, this.kiwirail);
  this.departs = this.timetableDetails.departs;
  this.departsString = this.timetableDetails.departsString;
  this.departed = getDepartedBoolean(this.currenttime, this.departs);
  this.arrives = this.timetableDetails.arrives;
  this.arrivesString = this.timetableDetails.arrivesString;
  this.origin = this.timetableDetails.origin;
  this.destination = this.timetableDetails.destination;
  this.lat = lat;
  this.lon = lon;
  this.meterage = meterageCalculation.getmeterage(this.lat, this.lon, this.KRline, this.compass)[0];
  this.estimatedDirection = meterageCalculation.getmeterage(this.lat, this.lon, this.KRline, this.compass)[1];
  if (this.meterage == '' || this.meterage == undefined) {
    // console.log(this.serviceId + 'meterage -1 due to meterage = ' + this.meterage);
    // console.log(this.lat + ' ' + this.lon + ' ' + this.KRline + ' ' + this.compass);
    this.meterage = -1;
  }
  let lastStationDetails = getlaststation(this.lat, this.lon,
    this.meterage,
    this.KRline, this.direction);
  this.lastStation = lastStationDetails[0];
  this.lastStationCurrent = lastStationDetails[1];
  // variables needed to calculate own delay
  let previousStationDetails = getSequenceStnDetails(this.meterage, this.direction, this.serviceId, 'prev');
  let nextStationDetails = getSequenceStnDetails(this.meterage, this.direction, this.serviceId, 'next');
  this.prevTimedStation = previousStationDetails[2];
  this.prevstntime = previousStationDetails[0];
  this.nextstntime = nextStationDetails[0];
  this.prevstnmeterage = previousStationDetails[1];
  this.nextstnmeterage = nextStationDetails[1];
  let scheduleVariance = getScheduleVariance(this.kiwirail,
    this.currenttime,
    this.meterage,
    this.prevstntime,
    this.nextstntime,
    this.prevstnmeterage,
    this.nextstnmeterage,
    this.locationAgeSeconds);
  this.scheduleVariance = scheduleVariance[1];
  this.scheduleVarianceMin = scheduleVariance[0];
  if (this.scheduleVarianceMin == '') {
    this.varianceFriendly = this.varianceKiwirail;
  } else {
    this.varianceFriendly = (this.scheduleVarianceMin).toFixed(0);
    if (this.varianceFriendly == -0) {
      this.varianceFriendly = 0;
    };
  }
  this.crewDetails = getCrewDetails(this.serviceId, currentRosterDuties);
  this.lastService = getSequenceUnit(this.serviceId, this.blockId, 'prev');
  this.nextService = getSequenceUnit(this.serviceId, this.blockId, 'next');
  if (this.nextService == '') {
    this.hasNextService = false;
  } else {
    this.hasNextService = true;
  }
  this.NextTime = getTimetableDetails(this.nextService, '', false).departs;
  if (this.NextTime == '') {
    this.NextTimeString = '';
  } else {
    this.NextTimeString = moment(this.NextTime).format('HH:mm');
  };
  this.NextTurnaround = getTurnaroundFrom2Times(this.arrives, this.NextTime);
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
  if (this.crewDetails.TM.shiftId !== '' && this.crewDetails.LE.shiftId == this.crewDetails.TM.shiftId) {
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
    || ((this.crewDetails.LE.nextService.turnaround != '')
      && (this.le_turnaround < this.schedule_variance_min))
    || ((this.crewDetails.TM.nextService.turnaround != '')
      && (this.crewDetails.TM.nextService.turnaround < this.schedule_variance_min))) {
    TempStatus = 'Delay Risk:';

    if ((this.NextTurnaround < this.schedule_variance_min)) {
      TempStatus = TempStatus + ' Train';
    };
    if ((this.crewDetails.LE.nextService.turnaround < this.schedule_variance_min)) {
      TempStatus = TempStatus + ' LE';
    };
    if ((this.crewDetails.TM.nextService.turnaround < this.schedule_variance_min)) {
      TempStatus = TempStatus + ' TM';
    };
    // check for negative turnarounds and just give an error status
    if ((this.NextTurnaround < 0)
      || (this.crewDetails.LE.nextService.turnaround < 0)
      || (this.crewDetails.TM.nextService.turnaround < 0)) {
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
      for (tunnel of tunnelExceptionsList) {
        if (tunnel.southStation == this.lastStation
          && tunnel.secondsTheshold > this.locationAgeSeconds
          && tunnel.line == this.line) {
          TempStatus = tunnel.statusMessage;
          StatusArray[1] = TempStatus;
        };
      };
    } else if (this.direction == 'DOWN') {
      for (tunnel of tunnelExceptionsList) {
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
      blockId: this.blockId,
      line: this.line,
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
      LE: this.crewDetails.LE.staffName,
      LEExists: this.crewDetails.LEExists,
      LEShift: this.crewDetails.LE.shiftId,
      LENextService: this.crewDetails.LE.nextService.serviceId,
      LENextServiceTime: this.crewDetails.LE.nextService.serviceDepartsString,
      TM: this.crewDetails.TM.staffName,
      TMExists: this.crewDetails.TMExists,
      TMShift: this.crewDetails.TM.shiftId,
      TMNextService: this.crewDetails.TM.nextService.serviceId,
      TMNextServiceTime: this.crewDetails.TM.nextService.serviceDepartsString,
      passengerOperatorList: this.crewDetails.PO,
      POExists: this.crewDetails.POExists,
      statusMessage: this.statusMessage,
      statusArray: this.statusArray,
      lat: this.lat,
      long: this.lon,
      meterage: this.meterage,
    };
    return servicelite;
  };
  /**
   *performs a look up of the current timetable to get the number of cars
   * @param {string} serviceId
   * @return {string} - number of cars
   */
  function getCarsCurrentTimetable(serviceId) {
    let cars;
    let servicePoints = currentTimetable.filter((currentTimetable) => currentTimetable.serviceId == serviceId);
    if (servicePoints.length !== 0) {
      cars = servicePoints[0].units;
    } else {
      cars = '';
    }
    return cars;
  };
  /**
   *performs a look up of the current timetable to get the block Id
   * @param {string} serviceId
   * @return {integer} - number of cars
   */
  function getBlockIdCurrentTimetable(serviceId) {
    let blockId;
    let servicePoints = currentTimetable.filter((currentTimetable) => currentTimetable.serviceId == serviceId);
    if (servicePoints.length !== 0) {
      blockId = servicePoints[0].blockId;
    } else {
      blockId = '';
    }
    return blockId;
  };
  /**
   * Gets Origin or Destination Timetable details
   * @param {string} serviceId
   * @param {string} description
   * @param {string} kiwirailBoolean
   * @return {object} {departs: XX, origin: XX, arrives: XX, destination: XX}
   */
  function getTimetableDetails(serviceId, description, kiwirailBoolean) {
    let departs = '';
    let departsString = '';
    let origin = '';
    let arrives = '';
    let arrivesString = '';
    let destination = '';
    let servicePoints = currentTimetable.filter((currentTimetable) => currentTimetable.serviceId == serviceId);
    if (servicePoints.length !== 0) {
      departs = servicePoints[0].departs;
      departsString = servicePoints[0].departs.format('HH:mm');
      origin = servicePoints[0].station;
      arrives = servicePoints[servicePoints.length - 1].arrives;
      arrivesString = servicePoints[servicePoints.length - 1].arrives.format('HH:mm');
      destination = servicePoints[servicePoints.length - 1].station;
    } else if (kiwirailBoolean) {
      let KiwiRailDetails = guessKiwiRailTimetableDetails(description);
      origin = KiwiRailDetails[0];
      destination = KiwiRailDetails[1];
    }
    let timetableDetails = {
      departs: departs,
      departsString: departsString,
      origin: origin,
      arrives: arrives,
      arrivesString: arrivesString,
      destination: destination,
    };
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
      if (description.search('-') == -1) {
        return ['', ''];
      } else {
      description = description.split('-');
      description[0] = description[0].trim();
      description[1] = description[1].trim();
      origin = '';
      destination = '';
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
  /**
   * finds out if service
   * has departed or not
   * @param {object} CurrentTime - moment Object
   * @param {object} departureTime - moment Object
   * @return {boolean}
   */
  function getDepartedBoolean(CurrentTime, departureTime) {
    if (CurrentTime > departureTime) {
      return true;
    } else if (CurrentTime < departureTime) {
      return false;
    }
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
          let dutyIndex = staffRosterItems.findIndex(function(duty) {
            return duty.dutyName == serviceId;
          });
          for (d = dutyIndex + 1; d < staffRosterItems.length; d++) {
            if (staffRosterItems[d].dutyType.substring(0, 4) == 'TRIP') {
              let nextServiceDepart = getTimetableDetails(staffRosterItems[d].dutyName, '', false).departs;
              let thisServiceArrives = getTimetableDetails(serviceId, '', false).arrives;
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
    for (c = 0; c < serviceRosterItems.length; c++) {
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
    for (c = 0; c < serviceRosterItems.length; c++) {
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
    for (s = 0; s < currentTimetable.length; s++) {
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
  /**
   * determines lineId from serviceId
   * @param {string} serviceId
   * @param {string} serviceDescription
   * @return {string} lineId
   */
  function getlinefromserviceid(serviceId, serviceDescription) {
    let numcharId = '';
    let line = [];
    let freightdetect;
    if (serviceDescription !== null && serviceDescription !== undefined) {
      if (serviceDescription.includes('FREIGHT')) {
        freightdetect = true;
      };
    };
    let passengerLineAssociations = {
      PNL: ['12'],
      WRL: ['16', 'MA'],
      HVL: ['26', '36', '38', '39', '46', '49', 'PT', 'TA', 'TN', 'UH', 'WA'],
      MEL: ['56', '59', 'ML'],
      KPL: ['60', '62', '63', '64', '69', '72', '79', '82', '89', 'PA', 'PM', 'PU', 'PL', 'TW', 'WK'],
      JVL: ['92', '93', '99', 'JV'],
    };
    let freightLineAssociations = {
      WRL: ['6', 'F'],
      KPL: ['2', '3', '5', 'B', 'E'],
    };
    let networkServicesAssociations = ['WT'];
    // looks for service id's with a random letter on the end
    // treat as a 3 digit
    for (p = 0; p < serviceId.length; p++) {
      if (isNaN(serviceId[p])) {
        numcharId = numcharId + 'C';
      } else {
        numcharId = numcharId + 'N';
      };
    };
    if (numcharId === 'NNNC') {
      serviceId = serviceId.substring(0, 3);
    }

    if (serviceId.length == 4) {
      let tempServiceSubstring = serviceId.substring(0, 2);
      if (passengerLineAssociations.PNL.includes(tempServiceSubstring)) {
        line = ['PNL', true];
      } else if (passengerLineAssociations.WRL.includes(tempServiceSubstring)) {
        line = ['WRL', false];
      } else if (passengerLineAssociations.HVL.includes(tempServiceSubstring)) {
        line = ['HVL', false];
      } else if (passengerLineAssociations.MEL.includes(tempServiceSubstring)) {
        line = ['MEL', false];
      } else if (passengerLineAssociations.KPL.includes(tempServiceSubstring)) {
        line = ['KPL', false];
      } else if (passengerLineAssociations.JVL.includes(tempServiceSubstring)) {
        line = ['JVL', false];
      } else if (networkServicesAssociations.includes(tempServiceSubstring)) {
        line = ['', true];
      } else {
        line = '';
      };
    } else if (serviceId.length == 3) {
      let tempServiceSubstring = serviceId.substring(0, 1);
      if (freightLineAssociations.KPL.includes(tempServiceSubstring)) {
        if (tempServiceSubstring == 'B') {
          if (freightdetect) {
            line = ['KPL', true];
          } else {
            line = ['KPL', false];
          };
        } else {
          line = ['KPL', true];
        };
      } else if (freightLineAssociations.WRL.includes(tempServiceSubstring)) {
        if (freightdetect) {
          line = ['WRL', true];
        } else {
          line = ['WRL', false];
        };
      } else {
        line = '';
      }
    };

    return line;
  };
  /**
   * Take a service Id and extrapolates
   * the direction UP/DOWN
   * @param {string} serviceId
   * @return {string} 'UP' or 'DOWN'
   */
  function getdirectionfromserviceid(serviceId) {
    let numcharId = '';
    // remove characters for odd even purposes
    for (p = 0; p < serviceId.length; p++) {
      if (isNaN(serviceId[p])) {
        numcharId = numcharId + 'C';
      } else {
        numcharId = numcharId + 'N';
      };
    };
    if (numcharId === 'NNNC') {
      serviceId = serviceId.substring(0, 3);
    }
    if (numcharId === 'CCNN') {
      serviceId = serviceId.substring(2, 4);
    }
    if (numcharId === 'CCN') {
      serviceId = serviceId.substring(2, 3);
    }
    if (numcharId === 'CNN') {
      serviceId = serviceId.substring(1, 3);
    }
    if (numcharId === 'CN') {
      serviceId = serviceId.substring(1, 2);
    }

    if (serviceId % 2 == 0) {
      return 'UP';
    } else if (serviceId % 2 == 1) {
      return 'DOWN';
    } else {
      return '';
    }
  };
  /**
   * Takes a line and coverts it to
   * the corresponding KiwiRail line
   * @param {string} line
   * @return {string} - KiwiRail Line
   */
  function lineToKiwiRailLine(line) {
    let KRLine;
    switch (line) {
      case 'PNL':
      case 'KPL':
        KRLine = 'NIMT';
        break;
      case 'HVL':
      case 'WRL':
        KRLine = 'WRL';
        break;
      case 'MEL':
        KRLine = 'MEL';
        break;
      case 'JVL':
        KRLine = 'JVL';
        break;
      default:
        KRLine = '';
    }
    return KRLine;
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
  // mathematical functions
  /**
  * gets distance in meters between 2 points
  * @param {object} position1 lat long pair
  * @param {object} position2 lat long pair
  * @return {number}  distance in meters between 2 points
  */
  function distance(position1, position2) {
    let lat1 = position1.latitude;
    let lat2 = position2.latitude;
    let lon1 = position1.longitude;
    let lon2 = position2.longitude;
    let R = 6371000; // radius of earth in metres
    let φ1 = lat1 * Math.PI / 180;
    let φ2 = lat2 * Math.PI / 180;
    let Δφ = (lat2 - lat1) * Math.PI / 180;
    let Δλ = (lon2 - lon1) * Math.PI / 180;
    let a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) *
      Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    let d = R * c;
    return d;
  };
  /** looks at location on line and works out
   *  given the direction,
   *  what the previous station would be
   * @param {number} lat - Lattitude
   * @param {number} lon - Longitude
   * @param {number} meterage - meters from origin
   * @param {string} KRLine - the KiwiRail line
   * @param {string} direction - 'UP' or 'DOWN'
   * @return {string} - 4 char station ID
   */
  function getlaststation(lat, lon, meterage, KRLine, direction) {
    // code to check and determine if at stations
    let thisId;
    let thisNorth;
    let thisWest;
    let thisSouth;
    let thisEast;
    let lastStation = ['', false];

    if (meterage === -1) {
      return lastStation;
    }

    // checks lat long for current stations first
    for (j = 0; j < StationGeoboundaries.length; j++) {
      thisId = StationGeoboundaries[j].station_id;
      thisNorth = StationGeoboundaries[j].north;
      thisWest = StationGeoboundaries[j].west;
      thisSouth = StationGeoboundaries[j].south;
      thisEast = StationGeoboundaries[j].east;

      if (lon > thisWest & lon < thisEast & lat < thisNorth & lat > thisSouth) {
        lastStation = [thisId, true];
        break;
      }
    };
    // works out last station based on line, direction and meterage
    if (!lastStation[1]) {
      for (m = 0; m < StationMeterage.length; m++) {
        if (StationMeterage[m].KRLine == KRLine) {
          if (direction == 'UP') {
            if (StationMeterage[m - 1] !== undefined && StationMeterage[m].meterage >= meterage) {
              lastStation = [StationMeterage[m - 1].station_id, false];
              break;
            }
          };
          if (direction == 'DOWN') {
            if (StationMeterage[m].meterage >= meterage) {
              lastStation = [StationMeterage[m].station_id, false];
              break;
            }
          };
        };
      }
    };
    return lastStation;
  };
  /**
   * finds the next or previous station details for a service
   * @param {number} trainMeterage meterage of currently running train
   * @param {string} direction 'UP' or 'DOWN'
   * @param {string} serviceId id representing the service
   * @param {string} nextOrPrev can be 'next' or 'prev'
   * @return {array} [time, stationMeterage, station]
   */
  function getSequenceStnDetails(trainMeterage, direction, serviceId, nextOrPrev) {
    let station;
    let time;
    let stationMeterage;
    let serviceTimetable = currentTimetable.filter((currentTimetable) => currentTimetable.serviceId == serviceId);
    if (direction == 'DOWN') {
      serviceTimetable.reverse();
    }
    if ((direction == 'UP' && nextOrPrev == 'next') || (direction == 'DOWN' && nextOrPrev == 'prev')) {
      for (st = 0; st < serviceTimetable.length; st++) {
        let thisStationMeterage = getMeterageOfStation(serviceTimetable[st].station);
        if (thisStationMeterage > trainMeterage) {
          station = serviceTimetable[st].station;
          time = serviceTimetable[st].departs;
          stationMeterage = thisStationMeterage;
          break;
        }
      }
    }
    if ((direction == 'DOWN' && nextOrPrev == 'next') || (direction == 'UP' && nextOrPrev == 'prev')) {
      for (st = 0; st < serviceTimetable.length; st++) {
        let thisStationMeterage = getMeterageOfStation(serviceTimetable[st].station);
        if (thisStationMeterage < trainMeterage) {
          station = serviceTimetable[st].station;
          time = serviceTimetable[st].departs;
          stationMeterage = thisStationMeterage;
        }
      }
    }
    return [time, stationMeterage, station];
  };
  /**
   * finds the meterage of a station
   * @param {string} stationId
   * @return {number} meterage of station
   */
  function getMeterageOfStation(stationId) {
    for (sm = 0; sm < StationMeterage.length; sm++) {
      if (stationId == StationMeterage[sm].station_id) {
        return StationMeterage[sm].meterage;
      }
    }
  };
  /**
   * Calculates current Lateness/Earliness of service
   * @param {boolean} kiwirailBoolean if KiwiRail service then true (knows to ignore)
   * @param {object} currentTime moment object
   * @param {number} meterage service current meterage
   * @param {object} prevStationTime moment object
   * @param {object} nextStationTime moment object
   * @param {number} prevStationMeterage meterage of the previous station
   * @param {number} nextStationMeterage meterage of the next station
   * @param {number} locationAgeSeconds how many seconds old is the data
   * @return {array} Current delay in format [{number} in minutes, {string} in 'mm:ss']
   */
  function getScheduleVariance(kiwirailBoolean,
    currentTime,
    meterage,
    prevStationTime,
    nextStationTime,
    prevStationMeterage,
    nextStationMeterage,
    locationAgeSeconds) {
    // the ignore criteria
    if (kiwirailBoolean == false
      && prevStationTime !== undefined
      && nextStationTime !== undefined
      && prevStationMeterage !== undefined
      && meterage !== -1) {
      // the time you would expect the service to be in its current position
      let ExpectedTime = moment(prevStationTime +
        (nextStationTime - prevStationTime) * ((meterage - prevStationMeterage)
                                  / (nextStationMeterage - prevStationMeterage)));
      // the difference between actual and expected tells you how late the service is
      let CurrentDelay = moment(currentTime.diff(ExpectedTime));
      CurrentDelay.subtract(locationAgeSeconds, 'seconds');
      // current delay in minutes
      CurrentDelay = (CurrentDelay / 60000);
      return [CurrentDelay, minTommss(CurrentDelay)];
    } else {
      return ['', ''];
    }
    /**
     * converts minutes into string with format 'mm:ss'
     * @param {number} minutes
     * @return {string} 'mm:ss'
     */
    function minTommss(minutes) {
      let sign = minutes < 0 ? '-' : '';
      let min = Math.floor(Math.abs(minutes));
      let sec = Math.floor((Math.abs(minutes) * 60) % 60);
      return sign + (min < 10 ? '0' : '') + min + ':' + (sec < 10 ? '0' : '') + sec;
    };
  };
};
