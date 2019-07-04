'use strict';
const moment = require('moment-timezone');
moment().tz('Pacific/Auckland').format();
// supporting data files
const stationMeterage = require('../Data/StationMeterage');

module.exports = {
  /**
* Calculates current Lateness/Earliness of service
* @param {boolean} kiwirailBoolean if KiwiRail service then true (knows to ignore)
* @param {object} currentTime moment object
* @param {string} direction "UP" or "DOWN"
* @param {object} timetableDetails object with timetable details
* @param {object} location location object
* @param {object} locationAge how old is the data
* @return {object} Current delay in various formats
*/
  getScheduleVariance: function getScheduleVariance(kiwirailBoolean,
      currentTime,
      direction,
      timetableDetails,
      location,
      locationAge) {
    const scheduleVariance = {
      delay: '',
      delayFriendly: '',
    };
    // the ignore criteria
    if (kiwirailBoolean == false && location.meterage !== -1 && timetableDetails.timingPoints.length !== 0) {
      const previousStationDetails = getSequenceStnDetails(location.meterage, direction, timetableDetails, 'prev');
      const prevStationTime = previousStationDetails.time;
      const prevStationMeterage = previousStationDetails.meterage;
      const nextStationDetails = getSequenceStnDetails(location.meterage, direction, timetableDetails, 'next');
      const nextStationTime = nextStationDetails.time;
      const nextStationMeterage = nextStationDetails.meterage;
      // the time you would expect the service to be in its current position
      const percentProgress = ((location.meterage - prevStationMeterage) / (nextStationMeterage - prevStationMeterage));
      const timeDifference = nextStationTime.diff(prevStationTime);
      const ExpectedTime = moment(Math.floor(prevStationTime + timeDifference * percentProgress));
      // the difference between actual and expected tells you how late the service is
      let CurrentDelay = moment.duration(currentTime.diff(ExpectedTime));
      CurrentDelay.subtract(locationAge, 'seconds');
      // current delay in minutes
      CurrentDelay = (CurrentDelay / 60000);
      scheduleVariance.delayFriendly = minTommss(CurrentDelay);
      scheduleVariance.delay = CurrentDelay.toFixed(0);
    }
    return scheduleVariance;
    /**
         * converts minutes into string with format 'mm:ss'
         * @param {number} minutes
         * @return {string} 'mm:ss'
         */
    function minTommss(minutes) {
      const sign = minutes < 0 ? '-' : '';
      const min = Math.floor(Math.abs(minutes));
      const sec = Math.floor((Math.abs(minutes) * 60) % 60);
      return sign + (min < 10 ? '0' : '') + min + ':' + (sec < 10 ? '0' : '') + sec;
    };
    /**
     * finds the next or previous station details for a service
     * @param {number} trainMeterage meterage of currently running train
     * @param {string} direction 'UP' or 'DOWN'
     * @param {object} timetableDetails id representing the service
     * @param {string} nextOrPrev can be 'next' or 'prev'
     * @return {object} object including time, meterage, stationId
     */
    function getSequenceStnDetails(trainMeterage, direction, timetableDetails, nextOrPrev) {
      const stationDetails = {
        time: '',
        meterage: -1,
        stationId: '',
      };
      const serviceTimetable = timetableDetails.timingPoints;

      if ((direction == 'UP' && nextOrPrev == 'next') || (direction == 'DOWN' && nextOrPrev == 'prev')) {
        for (let st = 0; st < serviceTimetable.length; st++) {
          // loop through stations in the timing points
          // once loop finds first match the loop terminates with break
          const thisStationMeterage = getMeterageOfStation(serviceTimetable[st].station);
          if (thisStationMeterage > trainMeterage) {
            stationDetails.stationId = serviceTimetable[st].station;
            stationDetails.time = moment(serviceTimetable[st].departs);
            stationDetails.meterage = thisStationMeterage;
            break;
          }
        }
      }
      if ((direction == 'DOWN' && nextOrPrev == 'next') || (direction == 'UP' && nextOrPrev == 'prev')) {
        // loop through stations in the timing points
        // once loop passes the expected station it can continue since station is not reassigned
        for (let st = 0; st < serviceTimetable.length; st++) {
          const thisStationMeterage = getMeterageOfStation(serviceTimetable[st].station);
          if (thisStationMeterage < trainMeterage) {
            stationDetails.stationId = serviceTimetable[st].station;
            stationDetails.time = moment(serviceTimetable[st].departs);
            stationDetails.meterage = thisStationMeterage;
          }
        }
      }
      return stationDetails;
      /**
           * finds the meterage of a station
           * @param {string} stationId
           * @return {number} meterage of station
           */
      function getMeterageOfStation(stationId) {
        for (let sm = 0; sm < stationMeterage.length; sm++) {
          if (stationId == stationMeterage[sm].stationId) {
            return stationMeterage[sm].meterage;
          }
        }
      };
    };
  },
};
