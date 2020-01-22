/* eslint-env node */
const moment = require('moment-timezone');
moment().tz('Pacific/Auckland').format();

// ======supporting functions=======
const CurrentData = require('./functions/currentData');

// =======express=======
const express = require('express');
const app = express();
const dmck = require('./api/dmck')(app);

// =======environment=======
const os = require('os');
const env = os.hostname();
let productionFlag = false;
// automatic production flag based on host
if (env == 'APNZPTDWAPP01') {
  productionFlag = true;
}
// ======functions flags=======
const functionFlags = {
  pilotSQLLogging: false, // log to Pilot DB
  fullDebugMode: false, // full test data run
  debugDataToUse: '20190723082606', // '20190722091137',
  workingOffsiteMode: false, // run with GeVis but no Compass or VDS -- DOES NOT WORK YET
  snapshotMode: false,
  authorised: false,
};
if (productionFlag) {
  // production defaults, regardless of settings
  functionFlags.pilotSQLLogging = true;
  functionFlags.fullDebugMode = false;
  functionFlags.workingOffsiteMode = false;
  functionFlags.snapshotMode = false;
}
const applicationSettings = {
  // lifespans for data in minutes
  tokenLifespan: 60,
  rosterDutiesLifespan: 10,
  rosterDayStatusLifespan: 5,
  busReplacementListLifespan: 5,
  weatherLifespan: 5,
  // timetable changeover time
  timetableUpdateHour: 3,
};
const alternativeToken = {
  token: 'YakuExe9fLRPMc3d7IFbZfn61PcPQw5Yi6FtoH04oNg.',
  updateTime: moment('2019-11-01 16:00:00'),
  pending: false,
};

const data = new CurrentData(functionFlags, applicationSettings, alternativeToken);
// =======API=======
require('./api/pilotAPI')(app, data, functionFlags);
dmck.then((response) => {
  functionFlags.authorised = response;
});

// begin server
refreshData();
/**
 * Function to maintain current data for all dependancies
 */
function refreshData() {
  dmck.then((response) => {
    functionFlags.authorised = response;
  });
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
  // also update staff List from Pilot DB 9same time)
  if (!data.timetableValid()) {
    data.updateTimetable();
    data.updateStaffList();
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
  if (!data.weatherValid()) {
    data.updateWeather();
  }
  setTimeout(refreshData, 10 * 1000);
}

