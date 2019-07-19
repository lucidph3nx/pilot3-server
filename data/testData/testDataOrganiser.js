const moment = require('moment-timezone');
moment().tz('Pacific/Auckland').format(); 
// ======dummy data=======
// const geVisVehicles = require('../data/testData/geVisVehicles');
// const timetable = require('../data/testData/timetable');
// const rosterDuties = require('../data/testData/rosterDuties');
// const rosterDayStatus = require('../data/testData/rosterDayStatus');

module.exports = function(testDataTimestamp) {
  let thisTestData;
  let time;
  if (!testDataTimestamp) {
    thisTestData = 'STOCK';
    time = moment('20190719140719', 'YYYYMMDDHHmmss');
  } else {
    thisTestData = testDataTimestamp;
    time = moment(testDataTimestamp, 'YYYYMMDDHHmmss');
  }
  const geVisVehicles = readTestfile(thisTestData, 'geVisVehicles');
  const timetable = readTestfile(thisTestData, 'timetable');
  const busReplacementList = readTestfile(thisTestData, 'busReplacementList');
  const rosterDuties = readTestfile(thisTestData, 'rosterDuties');
  const rosterDayStatus = readTestfile(thisTestData, 'rosterDayStatus');

  const testData = {
    time: time,
    geVisVehicles: geVisVehicles,
    timetable: timetable,
    busReplacementList: busReplacementList,
    rosterDuties: rosterDuties,
    rosterDayStatus: rosterDayStatus,
  };
  return testData;
  /**
 * reads requested test data file
 * @param {string} folderName
 * @param {string} fileName
 * @return {object} parsed response
 */
  function readTestfile(folderName, fileName) {
    const fs = require('fs');
    const jsonString = fs.readFileSync('./data/testData/' + folderName + '/' + fileName + '.json');
    return JSON.parse(jsonString);
  }
};
