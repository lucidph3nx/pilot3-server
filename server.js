/* eslint-env node */
let moment = require('moment-timezone');
moment().tz('Pacific/Auckland').format();
const puppeteer = require('puppeteer');

// ======Authentication credentials=======
let credentials = require('./credentials');
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
  timetable: [],
  tripSheet: [],
  busReplacementList: [],
  rosterDuties: [],
  rosterDayStatus: [],
};
// let geVisToken = [undefined, moment('1970-01-01')];
//  for live debugging, put the key here and update time to less than an hour
let geVisToken = ['Or7GGHShFz-kgOXGvQwrZexehTsgSPLp58ChP35fBj8.', moment('2018-12-04 15:56:00')];

// =======API=======
require('./api/pilotAPI')(app, current);
let kiwirailAPI = require('./api/kiwirailAPI');
let vdsRosterAPI = require('./api/vdsRosterAPI');
let compassAPI = require('./api/compassAPI');
// let PilotSQLLog = require('./api/pilotSQLLog');

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

/**
 * uses pupperteer to log into mobile GeVis and retrieve an authentication token
 */
async function getGeVisToken() {
  (async () => {
    let token;
    // let t0 = Date.now();
    const args = ['--enable-features=NetworkService'];
    const options = {
      args,
      headless: false,
      ignoreHTTPSErrors: false,
    };
    const browser = await puppeteer.launch(options);
    const page = await browser.newPage();
    // await page.waitFor(5000)
    await page.setCacheEnabled(false);
    await page.goto('https://gis.kiwirail.co.nz/maps/?viewer=gevis', {waitUntil: 'networkidle0'});
    await page.click('[value="External Identity"]'),
    await page.waitForSelector('#UserName');
    await page.type('#UserName', credentials.GeVis.username),
    await page.type('#Password', credentials.GeVis.password),
    await page.click('[value="Sign In"]'),
    await page.waitForNavigation();
    await page.setRequestInterception(true);
    // await page.waitFor(20000);
    page.on('request', (interceptedRequest) => {
      // eslint-disable-next-line max-len
      if (interceptedRequest.url().startsWith('https://gis.kiwirail.co.nz/arcgis/rest/services/External/gevisOpData/MapServer/export')) {
        let url = interceptedRequest.url();
        let stringarray = url.split('&');
        token = stringarray[0].split('=')[1];
        // let t1 = Date.now();
        // console.log(token);
        // console.log('Call to doSomething took ' + (t1 - t0) + ' milliseconds.');
        geVisToken = [token, moment()];
        pilotLog('GeVis Auth Token Retrieved Ok');
      } else {
        interceptedRequest.continue();
      }
    });
    await page.waitFor(60000);
    await browser.close();
  })();
};

// getGeVisToken.getGeVisToken()
// .then((result) => {
//   geVisToken = result;
// })
// .catch(console.error);

// begin server
refreshData();
getGeVisToken();
/**
 * Function to maintain current data for all dependancies
 */
function refreshData() {
  // console.log(geVisToken[0]);
  // console.log(geVisToken[1]);
  if (geVisToken !== undefined && geVisToken[0] !== undefined) {
    if (geVisToken[1] < moment().subtract(60, 'minutes')) {
      getGeVisToken();
    }
    let geVisVehicles;
    kiwirailAPI.geVisVehicles(geVisToken[0]).then((result) => {
      geVisVehicles = result;
      if (!current.debug && current.rosterDuties !== [] && current.timetable !== []
           && current.tripSheet !== [] && geVisVehicles.features !== undefined) {
        current.services = getCurrentServices(geVisVehicles, current);
        // PilotSQLLog.pilotSQLLog(current);
      }
      if (current.debug) {
        current.services = dummyCurrentServices;
      }
      current.unitList = getCurrentUnitList(geVisVehicles);

      pilotLog('GeVis Vehicles loaded ok');
    }).catch((error) => {
      console.log(error);
    });
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
