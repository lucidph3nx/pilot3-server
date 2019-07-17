const compassAPI = require('../api/compassAPI');
const moment = require('moment-timezone');
moment().tz('Pacific/Auckland').format();

module.exports = {
  getCurrentTimetable: function () {
    return new Promise((resolve, reject) => {
      compassAPI.currentTimetable().then((response) => {
        let currentTimetable;
        if (response !== undefined) {
          currentTimetable = response;
        }
        resolve(currentTimetable);
      });
    });
  },
  /**
   * Takes a Timetable with all timing points
   * and produces a one line per service 'trip sheet'
   * @param {Array} timetable a timetable array
   * @return {Array} currenttripSheet
   */
  getTripSheet: function (timetable) {
    if (timetable !== undefined && timetable !== []) {
      const currenttripSheet = [];
      let tripLine = {};
      for (let tp = 0; tp < timetable.length; tp++) {
        if (timetable[tp].serviceId !== tripLine.serviceId) {
          tripLine = {
            serviceId: timetable[tp].serviceId,
            line: timetable[tp].line,
            direction: timetable[tp].direction,
            blockId: timetable[tp].blockId,
          };
          currenttripSheet.push(tripLine);
        }
      }
      return currenttripSheet;
    }
  },
  /**
* performs a look up of the current timetable
* returns details about the service Timetable
* @param {String} serviceId
* @param {Array} timetable
* @param {Boolean} kiwirailBoolean
* @param {String} serviceDescription
* @return {Object} Timetable details
*/
  getTimetableDetails: function (serviceId, timetable, kiwirailBoolean, serviceDescription) {
    const timetableDetails = {
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
    const timingPoints = timetable.filter((timetable) => timetable.serviceId == serviceId);
    timetableDetails.timingPoints = timingPoints;
    if (timingPoints.length !== 0) {
      timetableDetails.consist = timingPoints[0].consist;
      timetableDetails.blockId = timingPoints[0].blockId;
      timetableDetails.line = timingPoints[0].line;
      timetableDetails.direction = timingPoints[0].direction;
      timetableDetails.origin = timingPoints[0].station;
      timetableDetails.departs = timingPoints[0].departs;
      timetableDetails.destination = timingPoints[timingPoints.length - 1].station;
      timetableDetails.arrives = timingPoints[timingPoints.length - 1].arrives;
    }
    if (kiwirailBoolean) {
      const KiwiRailDetails = module.exports.guessKiwiRailTimetableDetails(serviceDescription);
      timetableDetails.origin = KiwiRailDetails[0];
      timetableDetails.destination = KiwiRailDetails[1];
    }
    return timetableDetails;
  },
  /**
   * Takes a wild stab at what the Kiwirail origin and destination stations are
   * @param {string} description
   * @return {array} with [origin, destination]
   */
  guessKiwiRailTimetableDetails: function (description) {
    const locationMap = new Map([
      ['AUCKLAND', 'AUCK'],
      ['WELLINGTON', 'WELL'],
      ['PALMERSTON NORTH', 'PALM'],
      ['MT MAUNGANUI', 'TAUR'],
      ['HAMILTON', 'HAMI'],
      ['MASTERTON', 'MAST'],
    ]);
    description = description.toUpperCase();
    // check for the '-' if it isnt there then done even try to guess
    if (description.search('-') == -1) {
      return ['', ''];
    } else {
      // split the description by '-', format is usually 'ORIGIN - DESTINATION'
      description = description.split('-');
      let origin = '';
      let destination = '';
      for (const location of locationMap.keys()) {
        if (description[0].includes(location)) {
          origin = locationMap.get(location);
        }
        if (description[1].includes(location)) {
          destination = locationMap.get(location);
        }
      }
      return [origin, destination];
    }
  },
  getValidServicesAtTime: function(timetable, queryTime) {
    const tripSheet = module.exports.getTripSheet(timetable);

    let validServices = [];
    for (let s = 0; s < tripSheet.length; s++) {
      const timetabledService = module.exports.getTimetableDetails(tripSheet[s].serviceId, timetable, false, '');

      if (moment(timetabledService.departs) < moment(queryTime).subtract(1, 'minutes') &&
      moment(timetabledService.arrives) > moment(queryTime).add(5, 'minutes')) {
        validServices.push(timetabledService.serviceId);
      }
    }
    return validServices;
  },
}