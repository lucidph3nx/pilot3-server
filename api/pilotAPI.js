let moment = require('moment-timezone');
moment().tz('Pacific/Auckland').format();
let asRequiredStaff = require('./../functions/asRequiredStaff');
let getDayRosterFromShift = require('./../functions/dayRosterFromShift');
let getRunningSheetForStation = require('./../functions/runningSheetForStation');

module.exports = function(app,current){
    //get list of all train servics that are active now
    app.get('/currentServices', (request, response) => {
        let currentServices = current.services
        let apiResponse = {'Time': moment(), currentServices};
        response.writeHead(200, {'Content-Type': 'application/json'}, {cache: false});
        response.write(JSON.stringify(apiResponse));
        response.end();
    });
    //get the status for all Matangi Train Units
    app.get('/currentUnitList', (request, response) => {
        currentUnitList = current.unitList
        let apiResponse = {'Time': moment(), currentUnitList};
        response.writeHead(200, {'Content-Type': 'application/json'}, {cache: false});
        response.write(JSON.stringify(apiResponse));
        response.end();
    });
    //get all roster duties today
    app.get('/currentRoster', (request, response) => {
        currentRosterDuties = current.rosterDuties
        let apiResponse = {'Time': moment(), currentRosterDuties};
        response.writeHead(200, {'Content-Type': 'application/json'}, {cache: false});
        response.write(JSON.stringify(apiResponse));
        response.end();
    });
    //get all roster duties for a particular shift today
    app.get('/dayRoster', (request, response) => {
        let requestedShift = request.query.shiftId;
        let apiResponse = getDayRosterFromShift(requestedShift,current);
        response.writeHead(200, {'Content-Type': 'application/json'}, {cache: false});
        response.write(JSON.stringify(apiResponse));
        response.end();
    });
    //get list of staff who are "as Required" now
    app.get('/asRequiredStaff', (request, response) => {
        currentRosterDuties = current.rosterDuties
        let apiResponse = asRequiredStaff(currentRosterDuties);
        response.writeHead(200, {'Content-Type': 'application/json'}, {cache: false});
        response.write(JSON.stringify(apiResponse));
        response.end();
    });
    //get a list of all services arriving and departing at a station
    app.get('/runningSheet', (request, response) => {
        let stationId = request.query.stationId;
        let runningSheetResponse = getRunningSheetForStation(stationId,current);
        response.writeHead(200, {'Content-Type': 'application/json'}, {cache: false});
        response.write(JSON.stringify(runningSheetResponse));
        response.end();
        });

    let port = 4000;
    app.listen(port);
    console.log('Pilot API listening on ' + port);
}