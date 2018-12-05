let moment = require('moment-timezone');
moment().tz('Pacific/Auckland').format();
let asRequiredStaff = require('./../functions/asRequiredStaff');
let getDayRosterFromShift = require('./../functions/dayRosterFromShift');
let getStaffPhotoFromId = require('./../functions/staffImage');
let getRunningSheetForStation = require('./../functions/runningSheetForStation');
let vdsRosterAPI = require('./vdsRosterAPI');
const path = require('path');
// const fs = require('fs');
let express = require('express');

module.exports = function(app, current) {
    app.use('/staff', express.static(path.resolve('./data/img/staff')));
    // cross origin requests
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
    app.get('/api/test', (request, response) => {
        vdsRosterAPI.testfunction().then((result) => {
            currentRosterDuties = response;
            let apiResponse = {'Time': moment(), currentRosterDuties};
            response.writeHead(200, {'Content-Type': 'application/json'}, {cache: false});
            response.write(JSON.stringify(apiResponse));
            response.end();
        });
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
        let requestedDay = moment(request.query.date);
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
    // get headcount data for vis board
    app.get('/api/visboardHeadcount', (request, response) => {
        vdsRosterAPI.visboardHeadcount().then((result) => {
            headcountData = result;
            apiResponse = {'Time': moment(), headcountData};
            response.writeHead(200, {'Content-Type': 'application/json'}, {cache: false});
            response.write(JSON.stringify(apiResponse));
            response.end();
          }).catch((error) => {
            console.log(error);
          });
    });
    // get Annual leave data for vis board
    app.get('/api/visboardAnnualLeave', (request, response) => {
        vdsRosterAPI.visboardAnnualLeave().then((result) => {
            annualLeaveData = result;
            apiResponse = {'Time': moment(), annualLeaveData};
            response.writeHead(200, {'Content-Type': 'application/json'}, {cache: false});
            response.write(JSON.stringify(apiResponse));
            response.end();
          }).catch((error) => {
            console.log(error);
          });
    });
    // get sickness data for vis board
    app.get('/api/visboardSickness', (request, response) => {
        vdsRosterAPI.visboardSickness().then((result) => {
            sicknessData = result;
            apiResponse = {'Time': moment(), sicknessData};
            response.writeHead(200, {'Content-Type': 'application/json'}, {cache: false});
            response.write(JSON.stringify(apiResponse));
            response.end();
          }).catch((error) => {
            console.log(error);
          });
    });
    // get sickness data for vis board
    app.get('/api/visboardAltDuties', (request, response) => {
        vdsRosterAPI.visboardAltDuties().then((result) => {
            altDutiesData = result;
            apiResponse = {'Time': moment(), altDutiesData};
            response.writeHead(200, {'Content-Type': 'application/json'}, {cache: false});
            response.write(JSON.stringify(apiResponse));
            response.end();
          }).catch((error) => {
            console.log(error);
          });
    });
    // get uncovered shifts
    app.get('/api/uncoveredShifts', (request, response) => {
        currentRosterDayStatus = current.rosterDayStatus;
        let requestedDay = moment(request.query.date);
        let apiResponse;
        vdsRosterAPI.uncoveredShifts(requestedDay).then((result) => {
            uncoveredShifts = result;
            apiResponse = {'Time': moment(), uncoveredShifts};
            response.writeHead(200, {'Content-Type': 'application/json'}, {cache: false});
            response.write(JSON.stringify(apiResponse));
            response.end();
            }).catch((error) => {
            console.log(error);
            });
    });
    // get all roster duties for a particular shift today
    app.get('/api/dayRoster', (request, response) => {
        let requestedShift = request.query.shiftId;
        let apiResponse = getDayRosterFromShift(requestedShift, current);
        response.writeHead(200, {'Content-Type': 'application/json'}, {cache: false});
        response.write(JSON.stringify(apiResponse));
        response.end();
    });
    // get staff image from staffId
    app.get('/api/staffImage', (request, response) => {
        let requestedStaffId = request.query.staffId;
        let responsePath;
        if (getStaffPhotoFromId(requestedStaffId) !== '') {
            responsePath = path.resolve(getStaffPhotoFromId(requestedStaffId));
            response.sendFile(responsePath);
        } else {
            response.writeHead(404);
            response.end();
        }
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
