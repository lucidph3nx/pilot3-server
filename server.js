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
  workingOffsiteMode: false, // run with GeVis but no Compass or VDS -- DOES NOT WORK YET
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
  token: 'TL4uNrnK7b2QIj_VL_ARvtSX1Q2WFywKwPMCkL-JzXw.',
  updateTime: moment('2019-07-17 14:00:00'),
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
  // if (!data.rosterDayStatusValid()) {
  //   data.updateRosterDayStatus();
  // }
  setTimeout(refreshData, 10 * 1000);
}

