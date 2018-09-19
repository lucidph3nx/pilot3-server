let moment = require('moment-timezone');
moment().tz('Pacific/Auckland').format();
let asRequiredStaff = require('./../functions/asRequiredStaff');
let getDayRosterFromShift = require('./../functions/dayRosterFromShift');
let getRunningSheetForStation = require('./../functions/runningSheetForStation');

module.exports = function(app, current) {
    app.use(function(req, res, next) {
        let oneof = false;
        if (req.headers.origin) {
            res.header('Access-Control-Allow-Origin', req.headers.origin);
            oneof = true;
        }
        if (req.headers['access-control-request-method']) {
            res.header('Access-Control-Allow-Methods', req.headers['access-control-request-method']);
            oneof = true;
        }
        if (req.headers['access-control-request-headers']) {
            res.header('Access-Control-Allow-Headers', req.headers['access-control-request-headers']);
            oneof = true;
        }
        if (oneof) {
            res.header('Access-Control-Max-Age', 60 * 60 * 24 * 365);
        }
        // intercept OPTIONS method
        if (oneof && req.method == 'OPTIONS') {
            res.send(200);
        } else {
            next();
        }
    });

    app.get('/api/currentStatus', (request, response) => {
        let currentMoment = moment();
        let currentStatus = '';
        let Current = {'time': currentMoment, 'status': currentStatus};
        response.writeHead(200, {'Content-Type': 'application/json'}, {cache: false});
        response.write(JSON.stringify(Current));
        response.end();
      });
    // get list of all train servics that are active now
    app.get('/api/currentServices', (request, response, next) => {
        let currentServices = current.services;
        let apiResponse = {'Time': moment(), currentServices};
        response.writeHead(200, {'Content-Type': 'application/json'}, {cache: false});
        response.write(JSON.stringify(apiResponse));
        response.end();
    });
    // get the status for all Matangi Train Units
    app.get('/api/currentUnitList', (request, response) => {
        currentUnitList = current.unitList;
        let apiResponse = {'Time': moment(), currentUnitList};
        response.writeHead(200, {'Content-Type': 'application/json'}, {cache: false});
        response.write(JSON.stringify(apiResponse));
        response.end();
    });
    // get all roster duties today
    app.get('/api/currentRoster', (request, response) => {
        currentRosterDuties = current.rosterDuties;
        let apiResponse = {'Time': moment(), currentRosterDuties};
        response.writeHead(200, {'Content-Type': 'application/json'}, {cache: false});
        response.write(JSON.stringify(apiResponse));
        response.end();
    });
    // get roster Day Status
    app.get('/api/rosterDayStatus', (request, response) => {
        currentRosterDayStatus = current.rosterDayStatus;
        let apiResponse = {'Time': moment(), currentRosterDayStatus};
        response.writeHead(200, {'Content-Type': 'application/json'}, {cache: false});
        response.write(JSON.stringify(apiResponse));
        response.end();
    });
    // get all roster duties for a particular shift today
    app.get('/api/dayRoster', (request, response) => {
        let requestedShift = request.query.shiftId;
        let apiResponse = getDayRosterFromShift(requestedShift, current);
        response.writeHead(200, {'Content-Type': 'application/json'}, {cache: false});
        response.write(JSON.stringify(apiResponse));
        response.end();
    });
    // get list of staff who are "as Required" now
    app.get('/api/asRequiredStaff', (request, response) => {
        currentRosterDuties = current.rosterDuties;
        let apiResponse = asRequiredStaff(currentRosterDuties);
        response.writeHead(200, {'Content-Type': 'application/json'}, {cache: false});
        response.write(JSON.stringify(apiResponse));
        response.end();
    });
    // get a list of all services arriving and departing at a station
    app.get('/api/runningSheet', (request, response) => {
        let stationId = request.query.stationId;
        let runningSheetResponse = getRunningSheetForStation(stationId, current);
        response.writeHead(200, {'Content-Type': 'application/json'}, {cache: false});
        response.write(JSON.stringify(runningSheetResponse));
        response.end();
        });

    let port = 4000;
    app.listen(port, '0.0.0.0');
    console.log('Pilot API listening on ' + port);
};
