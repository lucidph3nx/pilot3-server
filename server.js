/* eslint-env node */
const moment = require('moment-timezone');
moment().tz('Pacific/Auckland').format();

// ======supporting functions=======
const CurrentData = require('./functions/currentData');
// =======express=======
const express = require('express');
const app = express();

// ======functions flags=======
const functionFlags = {
  pilotSQLLogging: false, // log to Pilot DB
  fullDebugMode: true, // full test data run
  debugDataToUse: '20190722091137',
  workingOffsiteMode: false, // run with GeVis but no Compass or VDS -- DOES NOT WORK YET
  snapshotMode: false,
};
const applicationSettings = {
  // lifespans for data in minutes
  tokenLifespan: 60,
  rosterDutiesLifespan: 10,
  rosterDayStatusLifespan: 5,
  busReplacementListLifespan: 5,
  // timetable changeover time
  timetableUpdateHour: 3,
};
const alternativeToken = {
  token: 'Mx_cnxjqhLHzSX3Vo3rWfzU0BULOkcFOEM6_HO-W3Ps.',
  updateTime: moment('2019-07-22 10:00:00'),
  pending: false,
};

const data = new CurrentData(functionFlags, applicationSettings, alternativeToken);
// =======API=======
require('./api/pilotAPI')(app, data);

// begin server
refreshData();
/**
 * Function to maintain current data for all dependancies
 */
function refreshData() {
  // Take test data snapshot
  if (functionFlags.snapshotMode) {
    if (data.tokenValid()
    && data.timetableValid()
    && data.busReplacementsListValid()
    && data.rosterDutiesValid()
    && data.rosterDayStatusValid()) {
      data.updateVehicles().then(() => {
        data.updateRunningServices();
        data.updateUnitLists();
        // take snapshot
        const snapshotStamp = moment().format('YYYYMMDDHHmmss');
        writeTestFile('geVisVehicles', data.geVisVehicles, snapshotStamp);
        writeTestFile('rosterDuties', data.rosterDuties, snapshotStamp);
        writeTestFile('timetable', data.timetable, snapshotStamp);
        writeTestFile('busReplacementList', data.busReplacementList, snapshotStamp);
        writeTestFile('rosterDayStatus', data.rosterDayStatus, snapshotStamp);
        // eslint-disable-next-line require-jsdoc
        function writeTestFile(dataName, data, timestamp) {
          const fs = require('fs');
          const jsonContent = JSON.stringify(data);
          const dir = './data/testData/' + timestamp;
          if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
          }
          fs.writeFile(dir + '/' + dataName + '.json', jsonContent, 'utf8', function(err) {
            if (err) {
              return console.log(err);
            }
          });
        }
      });
    }
  }
  // check the status of all services
  data.checkResourceStatus();
  // update geVis based data
  if (data.tokenValid()) {
    // update vehicles from GeVis
    data.updateVehicles().then(() => {
      data.updateRunningServices();
      data.updateUnitLists();
    });
  } else {
    data.updateToken();
  }
  // update Compass based data where appropriate
  if (!data.timetableValid()) {
    data.updateTimetable();
  }
  if (!data.busReplacementsListValid()) {
    data.updateBusReplacementsList();
  }
  // update VDS based data where appropriate
  if (!data.rosterDutiesValid()) {
    data.updateRosterDuties();
  }
  if (!data.rosterDayStatusValid()) {
    data.updateRosterDayStatus();
  }
  setTimeout(refreshData, 10 * 1000);
}

