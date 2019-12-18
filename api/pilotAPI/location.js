const moment = require('moment-timezone');
moment().tz('Pacific/Auckland').format();

// =======extras=======
const getRunningSheetForStation = require('./../functions/runningSheetForStation');

module.exports = function(app, current, functionFlags) {
  // get a list of all services arriving and departing at a station
  app.get('/api/station/runningSheet', (request, response) => {
    const stationId = request.query.stationId;
    const runningSheetResponse = getRunningSheetForStation(stationId, current);
    response.writeHead(200, {'Content-Type': 'application/json'}, {cache: false});
    response.write(JSON.stringify(runningSheetResponse));
    response.end();
  });
};
