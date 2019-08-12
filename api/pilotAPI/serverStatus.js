const moment = require('moment-timezone');
moment().tz('Pacific/Auckland').format();

module.exports = function(app, current, functionFlags) {
  // retrieved detailed server status report
  app.get('/api/serverStatus/current', (request, response) => {
    let currentMoment;
    let currentStatus;
    if (functionFlags.fullDebugMode) {
      currentMoment = moment(functionFlags.debugDataToUse, 'YYYYMMDDHHmmss');
      currentStatus = 'TEST DATA ONLY';
    } else {
      currentMoment = moment();
      currentStatus = '';
    }
    const apiResponse = {
      'time': currentMoment,
      'status': currentStatus,
      'integrations': current.status,
    };
    response.writeHead(200, {'Content-Type': 'application/json'}, {cache: false});
    response.write(JSON.stringify(apiResponse));
    response.end();
  });
};
