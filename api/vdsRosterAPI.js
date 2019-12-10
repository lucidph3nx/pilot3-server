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
  checkVDSDBConnection: function() {
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
  // returns current datetime and object with todays VDS roster per trip
  rosterDuties: function(date = moment()) {
    return new Promise((resolve, reject) => {
      const requestDate = date.format('YYYY-MM-DD');
      const currentRoster = [];
      let serviceRoster = {};
      knex.select()
          .table('WEBSN.actualDuties') // eventually Pilot.rosterDuties
          .where('date', requestDate)
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
              let shiftType;
              if (response[trp].shiftType.trim() == 'TXO') {
                shiftType = 'RCTXO';
              } else {
                shiftType = response[trp].shiftType.trim();
              }
              if (response[trp].dutyName !== null && response[trp].dutyType
              !== null && response[trp].dutyType !== 'REC') {
                const dutyStartTimeMoment = mpm2m(response[trp].minutesFrom);
                const dutyEndTimeMoment = mpm2m(response[trp].minutesTo);
                serviceRoster = {
                  shiftId: response[trp].shiftName.trim(),
                  shiftType: shiftType,
                  shiftLocation: response[trp].location.trim(),
                  staffId: staffId,
                  staffName: staffName,
                  dutyName: response[trp].dutyName.trim(),
                  dutyType: response[trp].dutyType.trim(),
                  dutyStartTime: dutyStartTimeMoment.tz('Pacific/Auckland').format(),
                  dutyStartTimeString: dutyStartTimeMoment.tz('Pacific/Auckland').format('HH:mm'),
                  dutyEndTime: dutyEndTimeMoment.tz('Pacific/Auckland').format(),
                  dutyEndTimeString: dutyEndTimeMoment.tz('Pacific/Auckland').format('HH:mm'),
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
  // returns all staff and their rostered shift or absence per day
  rosterDay: function(date = moment()) {
    return new Promise((resolve, reject) => {
      const requestDate = date.format('YYYY-MM-DD');
      const currentRoster = [];
      let dayRoster = {};
      knex.select()
          .table('Pilot.rosterDay')
          .where('date', requestDate)
          .orderBy('date')
          .orderBy('staffId')
          .orderBy('minutesFrom')
          .then(function(response) {
            for (let r = 0; r < response.length; r++) {
              dayRoster = {};
              const workType = response[r].workType.trim();

              if (workType !== 'T') {
                dayRoster = {
                  staffId: response[r].staffId.trim(),
                  work: false,
                  absence: true,
                  absenceCode: response[r].shiftName.trim(),
                };
              } else {
                dayRoster = {
                  staffId: response[r].staffId.trim(),
                  work: true,
                  absence: false,
                  shiftId: response[r].shiftName.trim(),
                  shiftType: response[r].shiftType.trim(),
                  shiftLocation: response[r].shiftLocation.trim(),
                  startTimeMin: response[r].minFrom,
                  endTimeMin: response[r].minTo,
                  totalMin: response[r].totalMin,
                  GEWP: response[r].GEWP,
                };
              }
              currentRoster.push(dayRoster);
            }
            resolve(currentRoster);
          });
    });
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
  // returns the rostered crew for a service on a date.
  rosteredCrew: function rosteredCrew(date, serviceId, staffList = []) {
    return new Promise((resolve, reject) => {
      const currentRoster = [];
      const searchdate = moment(date).format('YYYY-MM-DD');
      let serviceRoster = {};
      knex.select()
          .table('WEBSN.actualDuties')
          .where({'date': searchdate, 'dutyName': serviceId})
          .orderBy('date')
          .orderBy('staffId')
          .orderBy('minutesFrom')
          .then(function(response) {
            for (let trp = 0; trp < response.length; trp++) {
              serviceRoster = {};
              let staffId;
              let staffName;
              let shiftCovered;
              let staffListData = [];
              let photoURL = '';
              if (response[trp].uncovered !== 1) {
                staffId = response[trp].staffId.trim();
                if (staffList !== []) {
                  staffListData = staffList.filter((staff) => staff.staffId == staffId);
                }
                if (staffListData.length !== 0) {
                  staffName = staffListData[0].name;
                } else {
                  staffName = response[trp].firstName.trim() + ' ' + response[trp].lastName.trim();
                }
                photoURL = 'image?staffId='+staffId.padStart(3, '0');
                shiftCovered = true;
              } else {
                staffId = '';
                staffName = '';
                shiftCovered = false;
              }
              serviceRoster = {
                shiftId: response[trp].shiftName.trim(),
                shiftType: response[trp].shiftType.trim(),
                staffId: staffId,
                staffName: staffName,
                dutyName: response[trp].dutyName.trim(),
                dutyType: response[trp].dutyType.trim(),
                shiftCovered: shiftCovered,
                photoURL: photoURL,
              };
              currentRoster.push(serviceRoster);
            }
            // sort array by LE, TM then PO's
            const ordering = {};
            const sortOrder = ['LE', 'TM', 'PO'];
            for (let i=0; i<sortOrder.length; i++) {
              ordering[sortOrder[i]] = i;
            }
            currentRoster.sort( function(a, b) {
              return (ordering[a.shiftType] - ordering[b.shiftType]) || a.shiftId.localeCompare(b.shiftId);
            });
            resolve(currentRoster);
          });
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
  // returns uncovered shifts for day
  availableStaff: function availableStaff(date) {
    return new Promise((resolve, reject) => {
      const searchdate = moment(date).format('YYYY-MM-DD');
      const availableStaff = [];
      let staff = {};
      knex.select()
          .table('WEBSN.availableStaff')
          .where('date', searchdate)
          .then(function(response) {
            for (let st = 0; st < response.length; st++) {
              staff = {};
              staff = {
                rosterGrid: response[st].rosterGrid.trim(),
                staffType: response[st].staffType.trim(),
                location: response[st].location.trim(),
                availabilityType: response[st].availabilityType.trim(),
                staffId: response[st].staffId.trim(),
                staffName: response[st].firstName.trim() + ' ' + response[st].lastName.trim(),
              };
              availableStaff.push(staff);
            }
            resolve(availableStaff);
          }
          );
    });
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
  holisticYearData: function holisticYearData(staffId, startDate, endDate) {
    return new Promise((resolve, reject) => {
      const holisticYearData = [];
      let entry = {};
      knex.select()
          .table('WEBSN.holisticCalendarData')
          .where('staffId', '=', staffId)
          .whereBetween('date', [startDate, endDate])
          .orderBy('date')
          .then(function(response) {
            for (let i = 0; i < response.length; i++) {
              entry = {};
              const thisDate = moment.utc(response[i].date).format('YYYY-MM-DD');
              entry = {
                date: thisDate,
                staffId: response[i].staffId.trim(),
                workType: response[i].workType,
                dayCode: response[i].shift,
                shiftType: response[i].shiftType ? (response[i].shiftType).trim() : null,
                shiftLocation: response[i].shiftLocation ? (response[i].shiftLocation).trim() : null,
                hourFrom: response[i].minFrom ? moment(thisDate).add(response[i].minFrom, 'minute').format('HH:mm') : null,
                hourTo: response[i].minTo ? moment(thisDate).add(response[i].minTo, 'minute').format('HH:mm') : null,
                totalHours: response[i].totalMin ? moment(thisDate).add(response[i].totalMin, 'minute').format('HH:mm') : null,
                totalHoursNumber: response[i].totalMin ? response[i].totalMin / 60 : null,
                GEWP: (response[i].GEWP == 1),
              };
              holisticYearData.push(entry);
            }
            resolve(holisticYearData);
          }
          );
    });
  },
  // other exports here
};
