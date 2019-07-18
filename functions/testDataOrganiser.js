const moment = require('moment-timezone');
moment().tz('Pacific/Auckland').format();
// ======dummy data=======
const geVisVehicles = require('../data/testData/geVisVehicles');
const timetable = require('../data/testData/timetable');
const rosterDuties = require('../data/testData/rosterDuties');
//const rosterDayStatus = require('../data/testData/rosterDayStatus');

module.exports = {
  time: moment('2019-07-17T23:32:01.000Z'), // UTC
  geVisVehicles: geVisVehicles,
  timetable: timetable,
  rosterDuties: rosterDuties,
  //rosterDayStatus: rosterDayStatus,
};
