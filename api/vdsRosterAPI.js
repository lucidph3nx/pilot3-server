// ======Authentication credentials=======
const credentials = require('../credentials');
const knex = require('knex')({
  client: 'mssql',
  connection: {
    user: credentials.VDSSQL.username,
    password: credentials.VDSSQL.password,
    server: credentials.VDSSQL.host,
    database: credentials.VDSSQL.database,
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

const moment = require('moment-timezone');
moment().tz('Pacific/Auckland').format();

module.exports = {
  // returns current datetime and object with todays VDS roster per trip
  rosterDuties: function() {
    return new Promise((resolve, reject) => {
      const today = moment().format('YYYY-MM-DD');
      const currentRoster = [];
      let serviceRoster = {};
      knex.select()
          .table('WEBSN.actualDuties')
          .where('date', today)
          .orderBy('date')
          .orderBy('staffId')
          .orderBy('minutesFrom')
          .then(function(response) {
            for (let trp = 0; trp < response.length; trp++) {
              serviceRoster = {};
              let staffId;
              let staffName;
              let shiftCovered;
              if (response[trp].uncovered !== 1) {
                staffId = response[trp].staffId.trim();
                staffName = response[trp].firstName.trim() + ' ' + response[trp].lastName.trim();
                shiftCovered = true;
              } else {
                staffId = '';
                staffName = '';
                shiftCovered = false;
              }
              if (response[trp].dutyName !== null && response[trp].dutyType
                    !== null && response[trp].dutyType !== 'REC') {
                serviceRoster = {
                  shiftId: response[trp].shiftName.trim(),
                  shiftType: response[trp].shiftType.trim(),
                  staffId: staffId,
                  staffName: staffName,
                  dutyName: response[trp].dutyName.trim(),
                  dutyType: response[trp].dutyType.trim(),
                  dutyStartTime: mpm2m(response[trp].minutesFrom),
                  dutyStartTimeString: mpm2m(response[trp].minutesFrom).format('HH:mm'),
                  dutyEndTime: mpm2m(response[trp].minutesTo),
                  dutyEndTimeString: mpm2m(response[trp].minutesTo).format('HH:mm'),
                  shiftCovered: shiftCovered,
                };
                currentRoster.push(serviceRoster);
              }
            }
            resolve(currentRoster);
          });
    });

    /**
         * Takes a time in min past midnight
         * Converts it into a moment object
         * @param {string} minutesPastMidnight
         * @return {object} - Moment object
         */
    function mpm2m(minutesPastMidnight) {
      const thisMoment = moment();
      thisMoment.set('hour', 0);
      thisMoment.set('minute', 0);
      thisMoment.set('seconds', 0);
      thisMoment.set('miliseconds', 0);
      thisMoment.add(minutesPastMidnight, 'minutes');
      return thisMoment;
    }
  },
  // returns current counters for each location and position - days roster status
  dayRosterStatus: function dayStatus(date) {
    return new Promise((resolve, reject) => {
      const searchdate = moment(date).format('YYYY-MM-DD');
      const dayStatus = [];
      let rosterStatus = {};
      knex.select()
          .table('WEBSN.dayStatus')
          .where('date', searchdate)
          .then(function(response) {
            for (let st = 0; st < response.length; st++) {
              rosterStatus = {};
              rosterStatus = {
                staffType: response[st].staffType.trim(),
                location: response[st].location.trim(),
                counterType: response[st].counterType.trim(),
                count: response[st].count,
              };
              dayStatus.push(rosterStatus);
            }
            resolve(dayStatus);
          }
          );
    });
  },
  // returns uncovered shifts for day
  uncoveredShifts: function uncoveredShifts(date) {
    return new Promise((resolve, reject) => {
      const searchdate = moment(date).format('YYYY-MM-DD');
      const uncoveredShifts = [];
      let shift = {};
      knex.select()
          .table('WEBSN.uncoveredShifts')
          .where('date', searchdate)
          .then(function(response) {
            for (let st = 0; st < response.length; st++) {
              shift = {};
              shift = {
                shiftName: response[st].shiftName.trim(),
                staffType: response[st].staffType.trim(),
                startTime: mpm2m(response[st].minutesStart).format('HH:mm'),
                endTime: mpm2m(response[st].minutesEnd).format('HH:mm'),
                location: response[st].location.trim(),
              };
              uncoveredShifts.push(shift);
            }
            resolve(uncoveredShifts);
          }
          );
    });
    /**
         * Takes a time in min past midnight
         * Converts it into a moment object
         * @param {string} minutesPastMidnight
         * @return {object} - Moment object
         */
    function mpm2m(minutesPastMidnight) {
      const thisMoment = moment();
      thisMoment.set('hour', 0);
      thisMoment.set('minute', 0);
      thisMoment.set('seconds', 0);
      thisMoment.set('miliseconds', 0);
      thisMoment.add(minutesPastMidnight, 'minutes');
      return thisMoment;
    }
  },
  visboardHeadcount: function visboardHeadcount() {
    return new Promise((resolve, reject) => {
      const headcounts = [];
      let entry = {};
      knex.select()
          .table('WEBSN.visBoardHeadcount')
          .orderBy('begining')
          .orderBy('position')
          .orderBy('location')
          .then(function(response) {
            for (let st = 0; st < response.length; st++) {
              entry = {};
              entry = {
                year: response[st].year,
                fortnight: response[st].fortnight,
                begining: response[st].begining,
                count: response[st].count,
                position: response[st].position,
                location: response[st].location,
              };
              headcounts.push(entry);
            }
            resolve(headcounts);
          }
          );
    });
  },
  visboardAnnualLeave: function visboardAnnualLeave() {
    return new Promise((resolve, reject) => {
      const annualLeave = [];
      let entry = {};
      knex.select()
          .table('WEBSN.visBoardAnnualLeave')
          .orderBy('begining')
          .orderBy('position')
          .orderBy('location')
          .then(function(response) {
            for (let st = 0; st < response.length; st++) {
              entry = {};
              entry = {
                year: response[st].year,
                fortnight: response[st].fortnight,
                begining: response[st].begining,
                count: response[st].count,
                position: response[st].position,
                location: response[st].location,
              };
              annualLeave.push(entry);
            }
            resolve(annualLeave);
          }
          );
    });
  },
  visboardSickness: function visboardSickness() {
    return new Promise((resolve, reject) => {
      const sickness = [];
      let entry = {};
      knex.select()
          .table('WEBSN.visBoardSickness')
          .orderBy('begining')
          .orderBy('position')
          .orderBy('location')
          .then(function(response) {
            for (let st = 0; st < response.length; st++) {
              entry = {};
              entry = {
                year: response[st].year,
                fortnight: response[st].fortnight,
                begining: response[st].begining,
                count: response[st].count,
                position: response[st].position,
                location: response[st].location,
              };
              sickness.push(entry);
            }
            resolve(sickness);
          }
          );
    });
  },
  visboardAltDuties: function visboardAltDuties() {
    return new Promise((resolve, reject) => {
      const altDuties = [];
      let entry = {};
      knex.select()
          .table('WEBSN.visBoardAltDuties')
          .orderBy('begining')
          .orderBy('position')
          .orderBy('location')
          .then(function(response) {
            for (let st = 0; st < response.length; st++) {
              entry = {};
              entry = {
                year: response[st].year,
                fortnight: response[st].fortnight,
                begining: response[st].begining,
                count: response[st].count,
                position: response[st].position,
                location: response[st].location,
              };
              altDuties.push(entry);
            }
            resolve(altDuties);
          }
          );
    });
  },
  // other exports here
};
