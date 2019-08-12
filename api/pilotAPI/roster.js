const moment = require('moment-timezone');
moment().tz('Pacific/Auckland').format();

// =======API=======
let vdsRosterAPI;
// only define the API modules if credentials file exists
const fs = require('fs');
const path = require('path');
const credentialPath = path.join(__dirname, '../..', 'credentials.js');
if (fs.existsSync(credentialPath)) {
  vdsRosterAPI = require('../vdsRosterAPI');
}
// =======extras=======
const rosteringLogic = require('../../functions/rosteringLogic');

module.exports = function(app, current, functionFlags) {
  app.get('/api/roster/rosterDuties', (request, response) => {
    const currentMoment = moment();
    const includeColours = request.query.colours;
    let requestDate;
    if (request.query.date) {
      requestDate = moment(request.query.date);
    } else {
      requestDate = moment()
    }
    const requestStaffId = request.query.staffId;
    const requestShiftId = request.query.shiftId;

    vdsRosterAPI.rosterDuties(requestDate).then((data) => {
      let roster = data;
      roster = rosteringLogic.crewRoster.formatRosterDuties(roster, requestStaffId, requestShiftId, includeColours);
      const apiResponse = {
        'time': currentMoment,
        'roster': roster,
      };
      response.writeHead(200, {'Content-Type': 'application/json'}, {cache: false});
      response.write(JSON.stringify(apiResponse));
      response.end();
    });
  });
};
