/* eslint-env node */
let moment = require('moment-timezone');
moment().tz('Pacific/Auckland').format();

// ======supporting functions=======
let getCurrentServices = require('./functions/currentServices');
let getCurrentUnitList = require('./functions/currentUnitList');
let getCurrentTimetable = require('./functions/currentTimetable');
let getCurrentTripSheet = require('./functions/currentTripSheet');
// ======dummy data=======
let dummyCurrentServices = require('./data/dummyCurrentServices');

// =======express=======
let express = require('express');
let app = express();
// =======global variable=======
let current = {
  debug: false,
  services: [],
  unitList: [],
  carList: [],
  timetable: [],
  tripSheet: [],
  busReplacementList: [],
  rosterDuties: [],
  rosterDayStatus: [],
};
let geVisToken = [undefined, moment('1970-01-01')];
//  for live debugging, put the key here and update time to less than an hour
// let geVisToken = ['dSoKXAVRDuL4TdFYtCQXQSzS6qwyzbUe6c24wEtZJUE.', moment('2018-12-20 15:59:00')];
let geVisTokenRetrievalInProgress = false;

// =======API=======
require('./api/pilotAPI')(app, current);
let kiwirailAPI = require('./api/kiwirailAPI');
let vdsRosterAPI = require('./api/vdsRosterAPI');
let compassAPI = require('./api/compassAPI');
let PilotSQLLog = require('./api/pilotSQLLog');
let puppeteerOps = require('./api/puppeteerOps');

// =======time logs=======
let timetableLastUpdated;
let busReplacementsLastUpdated;
let rosterDutiesLastUpdated;
let rosterStatusLastUpdated;

// =======users system=======
// let cors = require('cors');
// let bodyParser = require('body-parser');
// let expressJwt = require('express-jwt');
// let config = require('config.json');
// app.use(cors());
// app.use(bodyParser.urlencoded({ extended: false }));
// app.use(bodyParser.json());

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
          PilotSQLLog.pilotSQLLog(current);
        }
        if (current.debug) {
          current.services = dummyCurrentServices;
        }
        unitsAndCars = getCurrentUnitList(geVisVehicles);
        current.unitList = unitsAndCars[0];
        current.carList = unitsAndCars[1];

        pilotLog('GeVis Vehicles loaded ok');
      }).catch((error) => {
        pilotLog(error);
        if (error == 'GeVis Token Invalid Or Expired' && !geVisTokenRetrievalInProgress) {
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
        }
      });
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
  let timetableDay = moment().hour(3).minute(0).second(0);
  // current timetable, updates daily at 3am
  if (timetableLastUpdated == undefined | timetableLastUpdated < timetableDay) {
    getCurrentTimetable().then((result) => {
      current.timetable = result;
      current.tripSheet = getCurrentTripSheet(result);
      timetableLastUpdated = moment();
      pilotLog('Compass timetable loaded ok');
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
