/* eslint-env node */
const moment = require('moment-timezone');
moment().tz('Pacific/Auckland').format();

// ======functions flags=======
const pilotSQLLogging = true; // log to local MSSQL DB

// ======supporting functions=======
const getCurrentServices = require('./functions/currentServices');
const getCurrentUnitList = require('./functions/currentUnitList');
const getCurrentTimetable = require('./functions/currentTimetable');
const getCurrentTripSheet = require('./functions/currentTripSheet');
// ======dummy data=======
const dummyCurrentServices = require('./data/dummyCurrentServices');

// =======express=======
const express = require('express');
const app = express();
// =======global variable=======
const current = {
  debug: false,
  services: [],
  servicesWeb: [],
  unitList: [],
  carList: [],
  timetable: [],
  tripSheet: [],
  busReplacementList: [],
  rosterDuties: [],
  rosterDayStatus: [],
};
// let geVisToken = [undefined, moment('1970-01-01')];
//  for live debugging, put the key here and update time to less than an hour
let geVisToken = ['slHGyJ8HV6872ciPNkhQDXlp6QrJ8XLJHZdpnPWK4vU.', moment('2019-07-10 15:00:00')];
let geVisTokenRetrievalInProgress = false;

// =======API=======
require('./api/pilotAPI')(app, current);
const kiwirailAPI = require('./api/kiwirailAPI');
const vdsRosterAPI = require('./api/vdsRosterAPI');
const compassAPI = require('./api/compassAPI');
const PilotSQLLog = require('./api/pilotSQLLog');
const puppeteerOps = require('./api/puppeteerOps');

// =======time logs=======
let timetableLastUpdated;
let busReplacementsLastUpdated;
let rosterDutiesLastUpdated;
let rosterStatusLastUpdated;

// begin server
refreshData();
/**
 * Function to maintain current data for all dependancies
 */
function refreshData() {
  if (!geVisTokenRetrievalInProgress) {
    if ((geVisToken == undefined || geVisToken[0] == undefined || geVisToken[1] < moment().subtract(60, 'minutes'))) {
      geVisTokenRetrievalInProgress = true;
      pilotLog('GeVis Auth Token Retrival Begun');
      puppeteerOps.getGeVisToken().then((result) => {
        geVisTokenRetrievalInProgress = false;
        geVisToken = result;
        pilotLog('GeVis Auth Token Retrieved Ok');
      }).catch((error) => {
        geVisTokenRetrievalInProgress = false;
        pilotLog('GeVis token retreval ' + error);
      });
    } else {
      let geVisVehicles;
      kiwirailAPI.geVisVehicles(geVisToken[0]).then((result) => {
        geVisVehicles = result;
        if (!current.debug && current.rosterDuties !== [] && current.timetable !== []
          && current.tripSheet !== [] && geVisVehicles.features !== undefined) {
          current.services = getCurrentServices(geVisVehicles, current);
          current.services.forEach((service) =>
            current.servicesWeb.push(service.webLegacy())
          );
        }
        if (current.debug) {
          current.services = dummyCurrentServices;
        }
        unitsAndCars = getCurrentUnitList(geVisVehicles);
        current.unitList = unitsAndCars[0];
        current.carList = unitsAndCars[1];
        if (!current.debug && current.rosterDuties !== [] && current.timetable !== []
          && current.tripSheet !== [] && geVisVehicles.features !== undefined) {
          if (pilotSQLLogging && !current.debug) {
            current.carList.forEach(function(vehicle) {
              PilotSQLLog.logSQL.vehicle(vehicle);
            });
            current.services.forEach(function(service) {
              PilotSQLLog.logSQL.service(service);
            });
            // PilotSQLLog.pilotSQLLog(current);
          }
        }

        pilotLog('GeVis Vehicles loaded ok');
      });
      // .catch((error) => {
      //   console.log(error);
      //   pilotLog(error);
      //   if (error == 'GeVis Token Invalid Or Expired' && !geVisTokenRetrievalInProgress) {
      //     geVisTokenRetrievalInProgress = true;
      //     pilotLog('GeVis Auth Token Retrival Begun');
      //     puppeteerOps.getGeVisToken().then((result) => {
      //       geVisTokenRetrievalInProgress = false;
      //       geVisToken = result;
      //       pilotLog('GeVis Auth Token Retrieved Ok');
      //     }).catch((error) => {
      //       geVisTokenRetrievalInProgress = false;
      //       pilotLog('GeVis token retreval ' + error);
      //     });
      //   }
      // });
    }
  };
  // roster duties list, updates every 10 minutes
  if (rosterDutiesLastUpdated == undefined | rosterDutiesLastUpdated < moment().subtract(10, 'minutes')) {
    vdsRosterAPI.rosterDuties().then((result) => {
      current.rosterDuties = result;
      rosterDutiesLastUpdated = moment();
      pilotLog('VDS Roster Duties loaded ok');
    }).catch((error) => {
      console.log(error);
    });
  }
  // roster day status, updates every 5 minutes
  if (rosterStatusLastUpdated == undefined | rosterStatusLastUpdated < moment().subtract(5, 'minutes')) {
    vdsRosterAPI.dayRosterStatus(moment()).then((result) => {
      current.rosterDayStatus = result;
      rosterStatusLastUpdated = moment();
      pilotLog('VDS Roster Day Status loaded ok');
    }).catch((error) => {
      console.log(error);
    });
  }
  // bus replacement list, updates every 5 minutes
  if (busReplacementsLastUpdated == undefined | busReplacementsLastUpdated < moment().subtract(5, 'minutes')) {
    compassAPI.busReplacements().then((result) => {
      current.busReplacementList = result;
      busReplacementsLastUpdated = moment();
      pilotLog('Compass bus replacement list loaded ok');
    }).catch((error) => {
      console.log(error);
    });
  }
  const timetableDay = moment().hour(3).minute(0).second(0);
  // current timetable, updates daily at 3am
  if (timetableLastUpdated == undefined | timetableLastUpdated < timetableDay) {
    getCurrentTimetable().then((result) => {
      current.timetable = result;
      current.tripSheet = getCurrentTripSheet(result);
      timetableLastUpdated = moment();
      pilotLog('Compass timetable loaded ok');
      // write to file
      // const fs = require('fs');
      // const jsonContent = JSON.stringify(current.timetable);
      // fs.writeFile('./timetable.json', jsonContent, 'utf8', function(err) {
      //   if (err) {
      //     return console.log(err);
      //   }
      // });
    }).catch((error) => {
      console.log(error);
    });
  }
  setTimeout(refreshData, 10 * 1000);
}
/**
 * a simple function to streamline console log code for this program
 * @param {string} status - the thing to report
 */
function pilotLog(status) {
  console.log(moment().format('HH:mm:ss') + ' ' + status);
}
