const moment = require('moment-timezone');
moment().tz('Pacific/Auckland').format();

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
  // app.get('/api/services/history', (request, response) => {
  //   const currentMoment = moment();
  //   const date = moment(request.query.date);
  //   const serviceId = request.query.serviceId;

  //   const apiResponse = {
  //     'time': currentMoment,
  //     'date': date,
  //     'serviceId': serviceId,
  //     'line': 'lineId',
  //     'consist': [],
  //     'punctualityFaulure': false,
  //     'reliabilityFaulure': false,
  //     'departs': 'departs',
  //     'origin': 'origin',
  //     'arrives': 'arrives',
  //     'destination': 'destination',
  //     'timingPoints': [],
  //     'crew': [],

  //   };
  //   response.writeHead(200, {'Content-Type': 'application/json'}, {cache: false});
  //   response.write(JSON.stringify(apiResponse));
  //   response.end();
  // });
};
