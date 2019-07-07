'use strict';
const moment = require('moment-timezone');
moment().tz('Pacific/Auckland').format();
module.exports = {
// to serve all roster related functions
  crewRoster: {
    getNextServiceCrewRoster: function(serviceId, shiftId) {

    },
    getPrevServiceCrewRoster: function(serviceId, shiftId) {

    },
  },
  trainRoster: {
    getNextServiceTrainRoster: function(serviceId, blockId) {

    },
    getPrevServiceTrainRoster: function(serviceId, blockId) {

    },
  },
  common: {
    /**
     * Works out turnaround time between an end time and the next start time
     * @param {object} EndTime moment object
     * @param {object} StartTime moment object
     * @return {number} turnaround time
     */
    getTurnaroundFrom2Times: function(EndTime, StartTime) {
      if (EndTime == undefined || StartTime == undefined) {
        return '';
      };
      let Turnaround = moment.duration(StartTime.diff(EndTime)) / 1000 / 60;
      if (Turnaround < 0) {
        throw error('Negative Turnaround time: '+Turnaround);
      };
      if (Turnaround == NaN) {
        Turnaround = '';
      };
      return Math.floor(Turnaround);
    },
  },
};
