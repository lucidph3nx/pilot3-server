const moment = require('moment-timezone');
moment().tz('Pacific/Auckland').format();
// ======Authentication credentials=======
const credentials = require('../credentials');
const knex = require('knex')({
  client: 'mssql',
  connection: {
    user: credentials.CompassSQL.username,
    password: credentials.CompassSQL.password,
    server: credentials.CompassSQL.host,
    database: credentials.CompassSQL.database,
    options: {
      encrypt: true,
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  },
});
module.exports = {
  // returns current timetable stop times from Compass DB
  currentTimetable: function() {
    return new Promise((resolve, reject) => {
      const currentTimetable = [];
      let timingPoint = {};
      knex.select()
          .table('dbo.todaysTimetable')
          .orderBy('blockId')
          .orderBy('serviceDeparts')
          .orderBy('serviceId')
          .orderBy('stationSequence')
          .then(function(response) {
            for (tp = 0; tp < response.length; tp++) {
              timingPoint = {};
              if (response[tp].serviceId !== null) {
                timingPoint = {
                  serviceId: response[tp].serviceId,
                  line: response[tp].line,
                  direction: response[tp].direction,
                  blockId: response[tp].blockId,
                  consist: response[tp].units,
                  arrives: cps2m(response[tp].arrives),
                  departs: cps2m(response[tp].departs),
                  station: response[tp].station,
                  stationSequence: (response[tp].stationSequence -1),
                  dayType: response[tp].dayType,
                };
                currentTimetable.push(timingPoint);
              };
            };
            resolve(currentTimetable);
          }
          );
    });
    /**
         * Takes a time Compass format
         * Converts it into a moment object
         * @param {string} compasstime
         * @return {object} - Moment object
         */
    function cps2m(compasstime) {
      const thisMoment = moment();
      thisMoment.set('hour', compasstime.substring(0, 2));
      thisMoment.set('minute', compasstime.substring(2, 4));
      thisMoment.set('second', compasstime.substring(4, 6));
      thisMoment.set('miliseconds', 0);
      return thisMoment;
    };
  },
  busReplacements: function() {
    return new Promise((resolve, reject) => {
      const currentBusReplacedList = [];
      let replacementOccurance = {};
      knex.select()
          .table('dbo.todaysBusReplacements')
          .then(function(response) {
            for (tp = 0; tp < response.length; tp++) {
              replacementOccurance = {};
              if (response[tp].serviceId !== null) {
                replacementOccurance = {
                  serviceId: response[tp].serviceId,
                  replacementType: response[tp].busReplaced,
                };
                currentBusReplacedList.push(replacementOccurance);
              };
            };
            resolve(currentBusReplacedList);
          }
          );
    });
  },
  // returns current peak reliability and punctuality stats
  currentPeakPerformance: function() {
    return new Promise((resolve, reject) => {
      const currentPeakPerformance = [];
      let linePerformance = {};
      knex.select()
          .table('dbo.currentPeakOverall')
          .then(function(response) {
            for (lp = 0; lp < response[0].length; lp++) {
              linePerformance = {};
              linePerformance = {
                date: response[0][lp].date,
                line: response[0][lp].Line,
                peak: response[0][lp].peak,
                reliabilityFailure: response[0][lp].reliabilityFailure,
                punctualityFailure: response[0][lp].punctualityFailure,
                totalServices: response[0][lp].totalServices,
                percentPunctualityFailure: parseFloat(response[0][lp].percentPunctualityFailure.toFixed(1)),
                percentReliabilityFailure: parseFloat(response[0][lp].percentReliabilityFailure.toFixed(1)),
              };
              currentPeakPerformance.push(linePerformance);
            };
            resolve(currentPeakPerformance);
          }
          );
    });
  },
  // other functions
};
