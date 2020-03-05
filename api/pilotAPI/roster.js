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
      requestDate = moment();
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
  app.get('/api/roster/staffRoster', (request, response) => {
    const currentMoment = moment();
    const includeColours = request.query.colours;
    const requestDateFrom = moment(request.query.dateFrom);
    const requestDateTo = moment(request.query.dateTo);
    const requestStaffId = request.query.staffId;
    vdsRosterAPI.staffRoster(requestDateFrom, requestDateTo, requestStaffId, includeColours).then((data) => {
      const roster = data;
      const apiResponse = {
        'time': currentMoment,
        'roster': roster,
      };
      response.writeHead(200, {'Content-Type': 'application/json'}, {cache: false});
      response.write(JSON.stringify(apiResponse));
      response.end();
    });
  });
  app.get('/api/roster/uncoveredShifts', (request, response) => {
    const requestedDay = moment(request.query.date);
    let apiResponse;
    vdsRosterAPI.uncoveredShifts(requestedDay).then((result) => {
      const uncoveredShifts = result;
      apiResponse = {'Time': moment(), uncoveredShifts};
      response.writeHead(200, {'Content-Type': 'application/json'}, {cache: false});
      response.write(JSON.stringify(apiResponse));
      response.end();
    }).catch((error) => {
      console.log(error);
    });
  });
  app.get('/api/roster/availableStaff', (request, response) => {
    const requestedDay = moment(request.query.date);
    let apiResponse;
    vdsRosterAPI.availableStaff(requestedDay).then((result) => {
      const availableStaff = result;
      apiResponse = {'Time': moment(), availableStaff};
      response.writeHead(200, {'Content-Type': 'application/json'}, {cache: false});
      response.write(JSON.stringify(apiResponse));
      response.end();
    }).catch((error) => {
      console.log(error);
    });
  });
  app.get('/api/roster/crew', (request, response) => {
    const requestedDay = moment(request.query.date);
    const requestedServiceId = request.query.serviceId;
    let apiResponse;
    vdsRosterAPI.rosteredCrew(requestedDay, requestedServiceId).then((result) => {
      const rosteredCrew = result;
      apiResponse = {'Time': moment(), rosteredCrew};
      response.writeHead(200, {'Content-Type': 'application/json'}, {cache: false});
      response.write(JSON.stringify(apiResponse));
      response.end();
    }).catch((error) => {
      console.log(error);
    });
  });
  // get roster Day Status
  app.get('/api/roster/dayStatus', (request, response) => {
    let currentRosterDayStatus = current.rosterDayStatus;
    const requestedDay = moment(request.query.date);
    let apiResponse;
    // if today provide prefetched data, else fetch fresh from the vds kitchen
    if (requestedDay.isSame(moment(), 'day')) {
      apiResponse = {'Time': moment(), currentRosterDayStatus};
      response.writeHead(200, {'Content-Type': 'application/json'}, {cache: false});
      response.write(JSON.stringify(apiResponse));
      response.end();
    } else {
      vdsRosterAPI.dayRosterStatus(requestedDay).then((result) => {
        currentRosterDayStatus = result;
        apiResponse = {'Time': moment(), currentRosterDayStatus};
        response.writeHead(200, {'Content-Type': 'application/json'}, {cache: false});
        response.write(JSON.stringify(apiResponse));
        response.end();
      }).catch((error) => {
        console.log(error);
      });
    }
  });
  // get all roster duties for a particular shift today
  app.get('/api/roster/shiftDuties', (request, response) => {
    const getDayRosterFromShiftId = rosteringLogic.crewRoster.getDayRosterFromShiftId;
    const requestedShift = request.query.shiftId;
    const apiResponse = getDayRosterFromShiftId(requestedShift, current.rosterDuties);
    response.writeHead(200, {'Content-Type': 'application/json'}, {cache: false});
    response.write(JSON.stringify(apiResponse));
    response.end();
  });
  // get list of staff who are 'as Required' now
  app.get('/api/roster/asRequiredStaff', (request, response) => {
    const apiResponse = rosteringLogic.common.getAsRequiredStaff(current.rosterDuties);
    response.writeHead(200, {'Content-Type': 'application/json'}, {cache: false});
    response.write(JSON.stringify(apiResponse));
    response.end();
  });
  // get a list of available leave dates
  app.get('/api/roster/availableLeave', (request, response) => {
    const dateFrom = request.query.dateFrom;
    const dateTo = request.query.dateTo;
    const staffType = request.query.staffType;
    const location = request.query.location;
    vdsRosterAPI.getAvailableLeave(dateFrom, dateTo, staffType, location).then((availableLeave) => {
      const apiResponse = {'Time': moment(), availableLeave};
      response.writeHead(200, {'Content-Type': 'application/json'}, {cache: false});
      response.write(JSON.stringify(apiResponse));
      response.end();
    });
  });
};
