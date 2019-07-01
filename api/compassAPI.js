const Sequelize = require('sequelize');
const moment = require('moment-timezone');
moment().tz('Pacific/Auckland').format();
// ======Authentication credentials=======
const credentials = require('../credentials');

module.exports = {
  // returns current timetable stop times from Compass DB
  currentTimetable: function() {
    return new Promise((resolve, reject) => {
      let timetableQueryString = 'SELECT * FROM [Compass].[dbo].[todaysTimetable]';
      timetableQueryString += 'ORDER BY [blockId], [serviceDeparts], [serviceId], [stationSequence]';
      const sequelize = new Sequelize(
          credentials.CompassSQL.database,
          credentials.CompassSQL.username,
          credentials.CompassSQL.password,
          {
            logging: false,
            host: credentials.CompassSQL.host,
            dialect: 'mssql',
            options: {
              encrypt: false,
            },
          });
      const currentTimetable = [];
      let timingPoint = {};
      sequelize.query(timetableQueryString)
          .then(function(response) {
            for (tp = 0; tp < response[0].length; tp++) {
              timingPoint = {};
              if (response[0][tp].serviceId !== null) {
                timingPoint = {
                  serviceId: response[0][tp].serviceId,
                  line: response[0][tp].line,
                  direction: response[0][tp].direction,
                  blockId: response[0][tp].blockId,
                  consist: response[0][tp].units,
                  arrives: cps2m(response[0][tp].arrives),
                  departs: cps2m(response[0][tp].departs),
                  station: response[0][tp].station,
                  stationSequence: (response[0][tp].stationSequence -1),
                  dayType: response[0][tp].dayType,
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
    const Sequelize = require('sequelize');
    const moment = require('moment-timezone');
    moment().tz('Pacific/Auckland').format();

    return new Promise((resolve, reject) => {
      const busReplacementQueryString = 'SELECT * FROM dbo.[todaysBusReplacements]';
      const sequelize = new Sequelize(
          credentials.CompassSQL.database,
          credentials.CompassSQL.username,
          credentials.CompassSQL.password,
          {
            logging: false,
            host: credentials.CompassSQL.host,
            dialect: 'mssql',
            options: {
              encrypt: false,
            },
          });

      const currentBusReplacedList = [];
      let replacementOccurance = {};

      sequelize.query(busReplacementQueryString)
          .then(function(response) {
            for (tp = 0; tp < response[0].length; tp++) {
              replacementOccurance = {};
              if (response[0][tp].serviceId !== null) {
                replacementOccurance = {
                  serviceId: response[0][tp].serviceId,
                  replacementType: response[0][tp].busReplaced,
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
    const Sequelize = require('sequelize');
    const moment = require('moment-timezone');
    moment().tz('Pacific/Auckland').format();
    return new Promise((resolve, reject) => {
      const currentPeakPerformanceQueryString = 'SELECT * FROM [Compass].[dbo].[currentPeakOverall]';
      const sequelize = new Sequelize(
          credentials.CompassSQL.database,
          credentials.CompassSQL.username,
          credentials.CompassSQL.password,
          {
            logging: false,
            host: credentials.CompassSQL.host,
            dialect: 'mssql',
            options: {
              encrypt: false,
            },
          });
      const currentPeakPerformance = [];
      let linePerformance = {};
      sequelize.query(currentPeakPerformanceQueryString)
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
