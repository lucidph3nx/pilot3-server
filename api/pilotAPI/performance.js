const moment = require('moment-timezone');
moment().tz('Pacific/Auckland').format();

// =======API=======
let compassAPI;
let vdsRosterAPI;
// only define the API modules if credentials file exists
const fs = require('fs');
const path = require('path');
const credentialPath = path.join(__dirname, '../..', 'credentials.js');
if (fs.existsSync(credentialPath)) {
  compassAPI = require('../compassAPI');
  vdsRosterAPI = require('../vdsRosterAPI');
}

module.exports = function(app, current, functionFlags) {
// get peak performance statistics by line
  app.get('/api/performance/currentPeak', (request, response) => {
    let currentPeakPerformance;
    compassAPI.currentPeakPerformance().then((result) => {
      currentPeakPerformance = result;
      response.writeHead(200, {'Content-Type': 'application/json'}, {cache: false});
      response.write(JSON.stringify(currentPeakPerformance));
      response.end();
    }).catch((error) => {
      console.log(error);
    });
  });
  // get train performance statistics by line
  app.get('/api/performance/day', (request, response) => {
    // default is today if not specified
    let requestedDayFrom = moment().format('YYYY-MM-DD');
    let requestedDayTo = moment().format('YYYY-MM-DD');
    if (request.query.dateFrom && request.query.dateTo) {
      requestedDayFrom = moment(request.query.dateFrom).format('YYYY-MM-DD');
      requestedDayTo = moment(request.query.dateTo).format('YYYY-MM-DD');
    }
    let trainPerformance;
    compassAPI.trainPerformance(requestedDayFrom, requestedDayTo).then((result) => {
      trainPerformance = result;
      const apiResponse = {'time': moment(), trainPerformance};
      response.writeHead(200, {'Content-Type': 'application/json'}, {cache: false});
      response.write(JSON.stringify(apiResponse));
      response.end();
    }).catch((error) => {
      console.log(error);
    });
  });
  // get headcount data for vis board
  app.get('/api/performance/visboardHeadcount', (request, response) => {
    vdsRosterAPI.visboardHeadcount().then((result) => {
      const headcountData = result;
      const apiResponse = {'Time': moment(), headcountData};
      response.writeHead(200, {'Content-Type': 'application/json'}, {cache: false});
      response.write(JSON.stringify(apiResponse));
      response.end();
    }).catch((error) => {
      console.log(error);
    });
  });
  // get Annual leave data for vis board
  app.get('/api/performance/visboardAnnualLeave', (request, response) => {
    vdsRosterAPI.visboardAnnualLeave().then((result) => {
      const annualLeaveData = result;
      const apiResponse = {'Time': moment(), annualLeaveData};
      response.writeHead(200, {'Content-Type': 'application/json'}, {cache: false});
      response.write(JSON.stringify(apiResponse));
      response.end();
    }).catch((error) => {
      console.log(error);
    });
  });
  // get sickness data for vis board
  app.get('/api/performance/visboardSickness', (request, response) => {
    vdsRosterAPI.visboardSickness().then((result) => {
      const sicknessData = result;
      const apiResponse = {'Time': moment(), sicknessData};
      response.writeHead(200, {'Content-Type': 'application/json'}, {cache: false});
      response.write(JSON.stringify(apiResponse));
      response.end();
    }).catch((error) => {
      console.log(error);
    });
  });
  // get sickness data for vis board
  app.get('/api/performance/visboardAltDuties', (request, response) => {
    vdsRosterAPI.visboardAltDuties().then((result) => {
      const altDutiesData = result;
      const apiResponse = {'Time': moment(), altDutiesData};
      response.writeHead(200, {'Content-Type': 'application/json'}, {cache: false});
      response.write(JSON.stringify(apiResponse));
      response.end();
    }).catch((error) => {
      console.log(error);
    });
  });
};
