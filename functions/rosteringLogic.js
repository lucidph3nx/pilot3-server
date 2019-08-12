'use strict';
const moment = require('moment-timezone');
moment().tz('Pacific/Auckland').format();
const timetableLogic = require('./timetableLogic');
const linearLogic = require('./linearLogic');
const nzRailConventions = require('./../data/nzRailConventions');

module.exports = {
  // to serve all roster related functions
  crewRoster: {
    /**
     * returns the next service for that shift
     * @param {string} serviceId
     * @param {string} shiftId
     * @param {array} roster
     * @return {string} the next serviceId
     */
    getNextServiceCrewRoster: function(serviceId, shiftId, roster) {
      if (roster == undefined || roster.length == 0) {
        return '';
      }
      if (serviceId == undefined || shiftId == '') {
        return '';
      }
      let nextServiceId = '';
      const rosterItems = roster.filter((roster) =>
        roster.shiftId == shiftId);
      // find current service
      const serviceIdIndex = rosterItems.findIndex((i) => i.dutyName == serviceId);
      // find next service
      for (let s = serviceIdIndex + 1; s < rosterItems.length; s++) {
        if (rosterItems[s].dutyType.substring(0, 4) == 'TRIP') {
          nextServiceId = rosterItems[s].dutyName;
          break;
        }
        // if sign off, next service is Sign-off
        if (rosterItems[s].dutyType == 'SOF') {
          nextServiceId = rosterItems[s].dutyType;
          break;
        }
      }
      return nextServiceId;
    },
    /**
     * returns the previous service for that shift
     * @param {string} serviceId
     * @param {string} shiftId
     * @param {array} roster
     * @return {string} the previous serviceId
     */
    getPrevServiceCrewRoster: function(serviceId, shiftId, roster) {
      if (roster == undefined || roster.length == 0) {
        return '';
      }
      if (serviceId == undefined || shiftId == '') {
        return '';
      }
      let prevServiceId = '';
      const rosterItems = roster.filter((roster) =>
        roster.shiftId == shiftId);
      // find current service
      const serviceIdIndex = rosterItems.findIndex((i) => i.dutyName == serviceId);
      // find previous service
      for (let s = serviceIdIndex - 1; s >= 0; s--) {
        if (rosterItems[s].dutyType.substring(0, 4) == 'TRIP') {
          prevServiceId = rosterItems[s].dutyName;
          break;
        }
      }
      return prevServiceId;
    },
    getDayRosterFromShiftId: function(shiftId, roster) {
      const dayRoster = [];
      if (roster == undefined || roster.length == 0) {
        return dayRoster;
      }
      for (let s = 0; s < roster.length; s++) {
        if (roster[s].shiftId == shiftId) {
          const serviceRoster = {
            shiftId: roster[s].shiftId,
            shiftType: roster[s].shiftType,
            staffId: roster[s].staffId,
            staffName: roster[s].staffName,
            dutyName: roster[s].dutyName,
            dutyType: roster[s].dutyType,
            dutyStartTime: moment(roster[s].dutyStartTime).format('HH:mm'),
            dutyEndTime: moment(roster[s].dutyEndTime).format('HH:mm'),
          };
          dayRoster.push(serviceRoster);
        }
      }
      return dayRoster;
    },
    formatRosterDuties: function(rosterDuties, filterStaffId, filterShiftId, includeColours) {
      let rosterArray = rosterDuties;
      const responseArray = [];
      if (filterStaffId) {
        rosterArray = rosterDuties.filter((duty) => duty.staffId == filterStaffId);
      }
      if (filterShiftId) {
        rosterArray = rosterDuties.filter((duty) => duty.shiftId == filterShiftId);
      }
      if (includeColours) {
        const dutyTypeCodes = nzRailConventions.dutyTypeCodes;
        const serviceIdlineAssociations = nzRailConventions.serviceIdlineAssociations;
        const getPrefixFromServiceId = linearLogic.getPrefixFromServiceId;
        for (let i = 0; i < rosterArray.length; i++) {
          let colourCode = '#ffffff';
          const dutyType = rosterArray[i].dutyType;
          const servicePrefix = getPrefixFromServiceId(rosterArray[i].dutyName);
          if (rosterArray[i].dutyType == 'TRIP'
          || rosterArray[i].dutyType == 'TRIPT'
          || rosterArray[i].dutyType == 'TRIPP') {
            if (serviceIdlineAssociations.has(servicePrefix)) {
              colourCode = serviceIdlineAssociations.get(servicePrefix).colour;
            }
          } else {
            if (dutyTypeCodes.has(dutyType)) {
              colourCode = dutyTypeCodes.get(dutyType);
            }
          }
          rosterArray[i].colourCode = colourCode;
        }
      }
      for (let i = 0; i < rosterArray.length; i++) {
        const shiftId = rosterArray[i].shiftId;
        const checkResponseArray = responseArray.filter((shift) => shift.shiftId == shiftId);
        if (checkResponseArray.length == 0) {
          const rawDutyArray = rosterArray.filter((shift) => shift.shiftId == shiftId);
          const dutyArray = [];
          rawDutyArray.forEach((duty) => {
            dutyArray.push({
              name: duty.dutyName,
              type: duty.dutyType,
              startTime: duty.dutyStartTime,
              startTimeString: duty.dutyStartTimeString,
              endTime: duty.dutyEndTime,
              endTimeString: duty.dutyEndTimeString,
              colourCode: duty.colourCode,
            });
          });
          responseArray.push({
            shiftId: rosterArray[i].shiftId,
            shiftType: rosterArray[i].shiftType,
            staffId: rosterArray[i].staffId,
            staffName: rosterArray[i].staffName,
            shiftCovered: rosterArray[i].shiftCovered,
            rosterDuties: dutyArray,
          });
        }
      }
      return responseArray;
    },
    /**
* Takes a service Id and the roster
* gives back a crew object
* @param {string} serviceId
* @param {array} roster
* @param {array} timetable
* @return {object} crew details object
*/
    getCrewDetailsForService: function(serviceId, roster, timetable) {
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
          const getNextServiceCrewRoster = module.exports.crewRoster.getNextServiceCrewRoster;
          const getTurnaround = module.exports.common.getTurnaround;
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
          this.nextIsSignOff = false;
          if (shiftId) {
            // filter rosters for just this shift
            const staffRosterItems = roster.filter((roster) => roster.shiftId == shiftId);
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
                timetable,
                false,
                '').arrives;
            let nextServiceId = getNextServiceCrewRoster(serviceId, shiftId, roster);
            if (nextServiceId == 'SOF') {
              nextServiceId = 'Sign-off';
              this.nextIsSignOff = true;
            }
            const nextServiceDeparts = timetableLogic.getTimetableDetails(nextServiceId,
                timetable,
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
      const serviceRosterItems = roster.filter((roster) => roster.dutyName == serviceId);
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
      // fill in blank staff if none exist
      if (crewDetails.LE.staffName == undefined) {
        crewDetails.LE = new CrewMember();
      }
      if (crewDetails.TM.staffName == undefined) {
        crewDetails.TM = new CrewMember();
      }
      return crewDetails;
    },
  },
  trainRoster: {
    /**
     * returns the next service for that train
     * @param {string} serviceId
     * @param {array} tripSheet
     * @return {string} the next serviceId
     */
    getNextServiceTrainRoster: function(serviceId, tripSheet) {
      if (tripSheet == undefined || tripSheet.length == 0) {
        return '';
      }
      if (serviceId == undefined) {
        return '';
      }
      let nextServiceId = '';
      // find current service
      const serviceIdIndex = tripSheet.findIndex((i) => i.serviceId == serviceId);
      if (serviceIdIndex !== -1) {
        const blockId = tripSheet[serviceIdIndex].blockId;
        if (tripSheet[serviceIdIndex + 1] !== undefined
          && tripSheet[serviceIdIndex + 1].blockId == blockId) {
          nextServiceId = tripSheet[serviceIdIndex + 1].serviceId;
        }
      }
      return nextServiceId;
    },
    /**
     * returns the previous service for that train
     * @param {string} serviceId
     * @param {array} tripSheet
     * @return {string} the previous serviceId
     */
    getPrevServiceTrainRoster: function(serviceId, tripSheet) {
      if (tripSheet == undefined || tripSheet.length == 0) {
        return '';
      }
      if (serviceId == undefined) {
        return '';
      }
      let prevServiceId = '';
      // find current service
      const serviceIdIndex = tripSheet.findIndex((i) => i.serviceId == serviceId);
      if (serviceIdIndex !== -1) {
        const blockId = tripSheet[serviceIdIndex].blockId;
        if (tripSheet[serviceIdIndex - 1] !== undefined
          && tripSheet[serviceIdIndex - 1].blockId == blockId) {
          prevServiceId = tripSheet[serviceIdIndex - 1].serviceId;
        }
      }
      return prevServiceId;
    },
  },
  common: {
    /**
     * Works out turnaround time between an end time and the next start time
     * @param {object} EndTime moment object
     * @param {object} StartTime moment object
     * @return {number} turnaround time
     */
    getTurnaround: function(EndTime, StartTime) {
      EndTime = moment(EndTime);
      StartTime = moment(StartTime);
      if (EndTime == undefined || StartTime == undefined) {
        return '';
      }
      if (EndTime == '' || StartTime == '') {
        return '';
      }
      let Turnaround = moment.duration(StartTime.diff(EndTime)) / 1000 / 60;
      if (Turnaround < 0) {
        throw new Error('Negative Turnaround time: ' + Turnaround);
      }
      if (isNaN(Turnaround)) {
        Turnaround = '';
      }
      return Math.floor(Turnaround);
    },
    getAsRequiredStaff: function(roster) {
      const asReqReport = [];
      if (roster == []) {
        return asReqReport;
      } else {
        for (let s = 0; s < roster.length; s++) {
          if (roster[s].dutyType == 'ASREQ'
            && roster[s].staffId !== '') {
            const asReqEntry = {
              staffId: roster[s].staffId,
              staffName: roster[s].staffName,
              shiftId: roster[s].shiftId,
              shiftType: roster[s].shiftType,
              startTime: roster[s].dutyStartTimeString,
              endTime: roster[s].dutyEndTimeString,
            };
            asReqReport.push(asReqEntry);
          }
        }
        return asReqReport;
      }
    },
  },
};
