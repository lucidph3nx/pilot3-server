const moment = require('moment-timezone');
moment().tz('Pacific/Auckland').format();

const stationMeterage = require('../data/stationMeterage');
const nzRailConventions = require('../data/nzRailConventions');
const linearLogic = require('../functions/linearLogic');
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
  checkCompassDBConnection: function() {
    return new Promise((resolve, reject) => {
      knex.raw('select 1 as dbIsUp')
          .then(function(response) {
            if (response[0].dbIsUp == 1) {
              resolve('Connection Ok');
            } else {
              resolve('Connection Error');
            }
          });
    });
  },
  // returns current timetable stop times from Compass DB
  currentTimetable: function(time) {
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
            for (let tp = 0; tp < response.length; tp++) {
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
                  stationSequence: (response[tp].stationSequence - 1),
                  dayType: response[tp].dayType,
                };
                currentTimetable.push(timingPoint);
              }
            }
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
    }
  },
  // returns timetable for date
  getTimetable: function(date) {
    return new Promise((resolve, reject) => {
      const requestedDay = date.format('YYYY-MM-DD');
      const timetable = [];
      let timingPoint = {};
      knex.select()
          .table('dbo.servicetimetable')
          .where(knex.raw('TT_ID = [COMPASS].[TDW_Calc_TTID_From_Date] (\''+requestedDay+'\')'))
          .orderBy('blockId')
          .orderBy('serviceDeparts')
          .orderBy('serviceId')
          .orderBy('stationSequence')
          .then(function(response) {
            for (let tp = 0; tp < response.length; tp++) {
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
                  stationSequence: (response[tp].stationSequence - 1),
                  dayType: response[tp].dayType,
                };
                timetable.push(timingPoint);
              }
            }
            resolve(timetable);
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
    }
  },
  busReplacements: function() {
    return new Promise((resolve, reject) => {
      const currentBusReplacedList = [];
      let replacementOccurance = {};
      knex.select()
          .table('dbo.todaysBusReplacements')
          .then(function(response) {
            for (let tp = 0; tp < response.length; tp++) {
              replacementOccurance = {};
              if (response[tp].serviceId !== null) {
                replacementOccurance = {
                  serviceId: response[tp].serviceId,
                  replacementType: response[tp].busReplaced,
                };
                currentBusReplacedList.push(replacementOccurance);
              }
            }
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
            for (let lp = 0; lp < response.length; lp++) {
              linePerformance = {};
              linePerformance = {
                date: response[lp].date,
                line: response[lp].Line,
                peak: response[lp].peak,
                reliabilityFailure: response[lp].reliabilityFailure,
                punctualityFailure: response[lp].punctualityFailure,
                totalServices: response[lp].totalServices,
                percentPunctualityFailure: parseFloat(response[lp].percentPunctualityFailure.toFixed(1)),
                percentReliabilityFailure: parseFloat(response[lp].percentReliabilityFailure.toFixed(1)),
              };
              currentPeakPerformance.push(linePerformance);
            }
            resolve(currentPeakPerformance);
          }
          );
    });
  },
  // returns reliability and punctuality stats for date
  trainPerformance: function(dateFrom, dateTo) {
    return new Promise((resolve, reject) => {
      const requestedDateFrom = dateFrom;
      const requestedDayTo = dateTo;
      const trainPerformance = [];
      let linePerformance = {};
      knex.select('Line')
          .sum('reliabilityFailure')
          .sum('punctualityFailure')
          .sum('totalServices')
          .table('dbo.trainPerformance')
          .where('date', '>=', requestedDateFrom)
          .where('date', '<=', requestedDayTo)
          .groupBy('Line')
          .then(function(response) {
            for (let lp = 0; lp < response.length; lp++) {
              linePerformance = {};
              linePerformance = {
                line: response[lp].Line,
                reliabilityFailure: response[lp][''][0],
                punctualityFailure: response[lp][''][1],
                totalServices: response[lp][''][2],
                percentPunctualityFailure: parseFloat((1 - response[lp][''][1] / response[lp][''][2])*100).toFixed(1),
                percentReliabilityFailure: parseFloat((1 - response[lp][''][0] / response[lp][''][2])*100).toFixed(1),
              };
              trainPerformance.push(linePerformance);
            }
            resolve(trainPerformance);
          }
          );
    });
  },
  serviceDetail: function(date, serviceId) {
    return new Promise((resolve, reject) => {
      const requestedDay = date.format('YYYY-MM-DD');
      knex.select()
          .table('dbo.serviceDetail')
          .where('date', requestedDay)
          .where('serviceId', serviceId)
          .then(function(response) {
            module.exports.serviceDetailTimingPoints(date, serviceId).then((timingPoints) => {
              module.exports.serviceDetailTSR(date, response[0].line, response[0].direction).then((TSRList) => {
                if (response[0] !== undefined) {
                  const keys = Object.keys(response[0]);
                  const consist = [];
                  keys.forEach((key) => {
                    if (key.substring(0, 7) == 'consist') {
                      if (response[0][key] !== null) {
                        consist.push(response[0][key]);
                      }
                    }
                  });
                  const serviceDetails = {
                    date: response[0].date,
                    serviceId: response[0].serviceId,
                    line: response[0].line,
                    peak: (response[0].peak !== 0),
                    direction: response[0].direction,
                    consist: consist,
                    punctualityFailure: (response[0].punctualityFailure !== 0),
                    reliabilityFailure: (response[0].reliabilityFailure !== 0),
                    busReplaced: (response[0].busReplaced !== 0),
                    departs: cps2m(response[0].date, response[0].departs),
                    origin: response[0].origin,
                    arrives: cps2m(response[0].date, response[0].arrives),
                    destination: response[0].destination,
                    delayOverall: response[0].impactSecOverall,
                    delayBreakdown: {
                      origin: response[0].impactSecOrigin,
                      TSR: response[0].impactSecTSR,
                      betweenStations: response[0].impactSecBetweenStations,
                      atStations: response[0].impactSecAtStations,
                    },
                    timingPoints: timingPoints,
                    crew: [],
                    TSRList: TSRList,
                  };
                  resolve(serviceDetails);
                } else {
                  resolve({});
                }
              });
            });
          }
          );
    });
    /**
         * Takes a time Compass format
         * Converts it into a moment object
         * @param {string} date
         * @param {string} compasstime
         * @return {object} - Moment object
         */
    function cps2m(date, compasstime) {
      const thisMoment = moment(date);
      thisMoment.set('hour', compasstime.substring(0, 2));
      thisMoment.set('minute', compasstime.substring(2, 4));
      thisMoment.set('second', compasstime.substring(4, 6));
      thisMoment.set('miliseconds', 0);
      return thisMoment;
    }
  },
  serviceDetailTimingPoints: function(date, serviceId) {
    return new Promise((resolve, reject) => {
      const requestedDay = date.format('YYYY-MM-DD');
      const timingPoints = [];
      let timingPoint;
      knex.select()
          .table('dbo.serviceDetailTimingPoints')
          .where('date', requestedDay)
          .where('serviceId', serviceId)
          .then(function(response) {
            for (let tp = 0; tp < response.length; tp++) {
              timingPoint = {};
              let activityType;
              switch (response[tp].activityType) {
                case 'O':
                  activityType = 'Origin';
                  break;
                case 'A':
                  activityType = 'Arrives';
                  break;
                case 'D':
                  activityType = 'Departs';
                  break;
                case 'T':
                  activityType = 'Terminates';
                  break;
              }
              const meterage = stationMeterage.filter((stationMeterage) =>
                stationMeterage.stationId == response[tp].location);

              timingPoint = {
                sequence: response[tp].sequence,
                location: response[tp].location,
                locationMeterage: meterage[0].meterage,
                activityType: activityType,
                plannedTime: moment.utc(response[tp].plannedTime).format('HH:mm:ss'),
                actualTime: moment.utc(response[tp].actualTime).format('HH:mm:ss'),
                secondsLate: response[tp].secondsLate,
                TSRDelaySec: response[tp].TSRDelaySec,
                delaySec: response[tp].delaySec,
                earlyDepart: (response[tp].earlyDepart !== 0),
                timingSource: response[tp].timingSource,
                punctualityFailure: (response[tp].punctualityFailure !== 0),
                impactSeconds: response[tp].impactSeconds,
                totalServices: response[tp].totalServices,
              };
              timingPoints.push(timingPoint);
            }
            resolve(timingPoints);
          }
          );
    });
  },
  serviceDetailTSR: function(date, metlinkLineId, direction) {
    return new Promise((resolve, reject) => {
      const requestedDay = date.format('YYYY-MM-DD');
      const TSRList = [];
      let speedband;
      if (metlinkLineId == 'WRL') {
        speedband = 3;
      } else {
        speedband = 1;
      }
      const kiwirailLineId = linearLogic.convertMetlinkLinetoKiwirailLine(metlinkLineId);
      knex.select()
          .table('dbo.TSRList')
          .where('dateFrom', '<=', requestedDay)
          .where('dateTo', '>=', requestedDay)
          .where('kiwirailLineId', kiwirailLineId)
          .where('direction', direction)
          .where('speedband', speedband)
          .then(function(response) {
            for (let sr = 0; sr < response.length; sr++) {
              let TSR = {};
              TSR = {
                TSRId: response[sr].TSRId,
                distanceFrom: Math.round(response[sr].distanceFrom*1000),
                distanceTo: Math.round(response[sr].distanceTo*1000),
                H40Area: response[sr].H40Area,
                ASSeconds: response[sr].ASSeconds,
                NSSeconds: response[sr].NSSeconds,
              };
              TSRList.push(TSR);
            }
            resolve(TSRList);
          }
          );
    });
  },
  trainFixes: function(date, line) {
    return new Promise((resolve, reject) => {
      const requestedDay = date.format('YYYY-MM-DD');
      const fixPoints = [];
      const serviceFixPoints = [];
      let fixPoint;
      const stationMap = nzRailConventions.kiwirailMetlinkStationCodes;
      const lineNamesMetlinkKiwirail = nzRailConventions.lineNamesMetlinkKiwirail;
      const metlinklines = [];
      for (const [key, value] of lineNamesMetlinkKiwirail.entries()) {
        if (value == line) {
          metlinklines.push(key);
        }
      }
      let line1;
      let line2;
      if (metlinklines.length == 2) {
        line1 = metlinklines[0];
        line2 = metlinklines[1];
      } else {
        line1 = metlinklines[0];
        line2 = 'UNDEFINED';
      }
      knex.select()
          .from('dbo.locationTrainFixes')
          .where('date', requestedDay)
          .andWhere(function() {
            // eslint-disable-next-line no-invalid-this
            this.where('line', line1).orWhere('line', line2);
          })
          .orderBy('serviceId')
          .orderBy('dateTime')
          .then(function(response) {
            for (let fix = 0; fix < response.length; fix++) {
              let stationCode;
              for (const [key, value] of stationMap.entries()) {
                if (key == response[fix].location) {
                  stationCode = value;
                }
              }
              fixPoint = {};
              const meterage = stationMeterage.filter((stationMeterage) =>
                stationMeterage.stationId == stationCode);

              fixPoint = {
                serviceId: response[fix].serviceId,
                line: response[fix].line,
                dateTime: moment(response[fix].dateTime),
                type: response[fix].type,
                location: stationCode,
                locationMeterage: meterage[0].meterage,
              };
              fixPoints.push(fixPoint);
            }
            // push first service:
            let currentServiceId = fixPoints[0].serviceId;
            let currentPoints = fixPoints.filter((service) =>
              service.serviceId == currentServiceId);
            serviceFixPoints.push({
              serviceId: currentServiceId,
              fixPoints: currentPoints,
            });
            for (let i = 0; i < fixPoints.length; i++) {
              if (currentServiceId !== fixPoints[i].serviceId) {
                currentServiceId = fixPoints[i].serviceId;
                currentPoints = fixPoints.filter((service) =>
                  service.serviceId == currentServiceId);
                serviceFixPoints.push({
                  serviceId: currentServiceId,
                  fixPoints: currentPoints,
                });
              }
            }
            resolve(serviceFixPoints);
          }
          );
    });
  },
  trainPlan: function(date, line) {
    return new Promise((resolve, reject) => {
      const requestedDay = date.format('YYYY-MM-DD');
      const planPoints = [];
      const servicePlanPoints = [];
      let fixPoint;
      const lineNamesMetlinkKiwirail = nzRailConventions.lineNamesMetlinkKiwirail;
      const metlinklines = [];
      for (const [key, value] of lineNamesMetlinkKiwirail.entries()) {
        if (value == line) {
          metlinklines.push(key);
        }
      }
      let line1;
      let line2;
      if (metlinklines.length == 2) {
        line1 = metlinklines[0];
        line2 = metlinklines[1];
      } else {
        line1 = metlinklines[0];
        line2 = 'UNDEFINED';
      }
      knex.select()
          .from('dbo.locationTrainPlan')
          .where('date', requestedDay)
          .andWhere(function() {
            // eslint-disable-next-line no-invalid-this
            this.where('line', line1).orWhere('line', line2);
          })
          .orderBy('serviceId')
          .orderBy('dateTime')
          .then(function(response) {
            for (let pt = 0; pt < response.length; pt++) {
              fixPoint = {};
              const meterage = stationMeterage.filter((stationMeterage) =>
                stationMeterage.stationId == response[pt].location);

              fixPoint = {
                serviceId: response[pt].serviceId,
                line: response[pt].line,
                dateTime: moment(response[pt].dateTime),
                type: response[pt].type,
                location: response[pt].location,
                locationMeterage: meterage[0].meterage,
              };
              planPoints.push(fixPoint);
            }
            // push first service:
            let currentServiceId = planPoints[0].serviceId;
            let currentPoints = planPoints.filter((service) =>
              service.serviceId == currentServiceId);
            servicePlanPoints.push({
              serviceId: currentServiceId,
              fixPoints: currentPoints,
            });
            for (let i = 0; i < planPoints.length; i++) {
              if (currentServiceId !== planPoints[i].serviceId) {
                currentServiceId = planPoints[i].serviceId;
                currentPoints = planPoints.filter((service) =>
                  service.serviceId == currentServiceId);
                servicePlanPoints.push({
                  serviceId: currentServiceId,
                  fixPoints: currentPoints,
                });
              }
            }
            resolve(servicePlanPoints);
          }
          );
    });
  },
  // other functions
};
