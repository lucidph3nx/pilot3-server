const moment = require('moment-timezone');
moment().tz('Pacific/Auckland').format();
// =======API=======
let vdsRosterAPI;
let compassAPI;
// only define the API modules if credentials file exists
const fs = require('fs');
const path = require('path');
const credentialPath = path.join(__dirname, '../..', 'credentials.js');
if (fs.existsSync(credentialPath)) {
  vdsRosterAPI = require('../vdsRosterAPI');
  compassAPI = require('../compassAPI');
}

module.exports = function(app, current, functionFlags) {
  app.get('/api/services/current', (request, response) => {
    const servicesWeb = [];
    const currentMoment = moment();
    // if full = true
    const fullResponse = (request.query.full);
    let currentServices = servicesWeb;
    if (fullResponse) {
      currentServices = current.runningServices;
    } else {
      current.runningServices.forEach((service) =>
        servicesWeb.push(service.webLegacy())
      );
      currentServices = servicesWeb;
    }
    const apiResponse = {
      'time': currentMoment,
      'currentServices': currentServices,
    };
    response.writeHead(200, {'Content-Type': 'application/json'}, {cache: false});
    response.write(JSON.stringify(apiResponse));
    response.end();
  });
  app.get('/api/services/detail', (request, response) => {
    const currentMoment = moment();
    const date = moment(request.query.date);
    const serviceId = request.query.serviceId;
    let serviceDetail;
    compassAPI.serviceDetail(date, serviceId).then((result) => {
      vdsRosterAPI.rosteredCrew(date, serviceId, current.staffList).then((crewResult) => {
        serviceDetail = result;
        serviceDetail.crew = crewResult;
        const apiResponse = {
          'time': currentMoment,
          'serviceDetail': serviceDetail,
        };
        response.writeHead(200, {'Content-Type': 'application/json'}, {cache: false});
        response.write(JSON.stringify(apiResponse));
        response.end();
      });
    }).catch((error) => {
      console.log(error);
    });
  });
  app.get('/api/services/timeDistance', (request, response) => {
    const currentMoment = moment();
    const date = moment(request.query.date);
    const line = request.query.line;
    let timeDistancePoints;
    compassAPI.trainFixes(date, line).then((result) => {
      timeDistancePoints = result;
      const apiResponse = {
        'time': currentMoment,
        'timeDistance': {
          'date': date,
          'line': line,
          'timeDistancePoints': timeDistancePoints,
        }
      };
      response.writeHead(200, {'Content-Type': 'application/json'}, {cache: false});
      response.write(JSON.stringify(apiResponse));
      response.end();

    }).catch((error) => {
      console.log(error);
    });
  });
};
