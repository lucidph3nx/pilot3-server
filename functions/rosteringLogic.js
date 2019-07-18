'use strict';
const moment = require('moment-timezone');
moment().tz('Pacific/Auckland').format();
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
          nextServiceId = rosterItems[s].dutyName;
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
