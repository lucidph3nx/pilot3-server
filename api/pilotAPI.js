const moment = require('moment-timezone');
moment().tz('Pacific/Auckland').format();
const asRequiredStaff = require('./../functions/asRequiredStaff');
const getDayRosterFromShift = require('./../functions/dayRosterFromShift');
const getStaffPhotoFromId = require('./../functions/staffImage');
const getRunningSheetForStation = require('./../functions/runningSheetForStation');
const vdsRosterAPI = require('./vdsRosterAPI');
const compassAPI = require('./compassAPI');
const path = require('path');
// const fs = require('fs');
const express = require('express');

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
    const currentMoment = moment();
    const currentStatus = '';
    const Current = {'time': currentMoment, 'status': currentStatus};
    response.writeHead(200, {'Content-Type': 'application/json'}, {cache: false});
    response.write(JSON.stringify(Current));
    response.end();
  });
  // get list of all train servics that are active now
  app.get('/api/currentServices', (request, response, next) => {
    const currentServices = current.servicesWeb;
    const apiResponse = {'Time': moment(), currentServices};
    response.writeHead(200, {'Content-Type': 'application/json'}, {cache: false});
    response.write(JSON.stringify(apiResponse));
    response.end();
  });
  // get the status for all Matangi Train Units
  app.get('/api/currentUnitList', (request, response) => {
    currentUnitList = current.unitList;
    const apiResponse = {'Time': moment(), currentUnitList};
    response.writeHead(200, {'Content-Type': 'application/json'}, {cache: false});
    response.write(JSON.stringify(apiResponse));
    response.end();
  });
  // get the status for all Matangi Cars
  app.get('/api/currentCarList', (request, response) => {
    currentCarList = current.carList;
    const apiResponse = {'Time': moment(), currentCarList};
    response.writeHead(200, {'Content-Type': 'application/json'}, {cache: false});
    response.write(JSON.stringify(apiResponse));
    response.end();
  });
  // get all roster duties today
  app.get('/api/test', (request, response) => {
    vdsRosterAPI.testfunction().then((result) => {
      currentRosterDuties = response;
      const apiResponse = {'Time': moment(), currentRosterDuties};
      response.writeHead(200, {'Content-Type': 'application/json'}, {cache: false});
      response.write(JSON.stringify(apiResponse));
      response.end();
    });
  });
  // get all roster duties today
  app.get('/api/currentRoster', (request, response) => {
    currentRosterDuties = current.rosterDuties;
    const apiResponse = {'Time': moment(), currentRosterDuties};
    response.writeHead(200, {'Content-Type': 'application/json'}, {cache: false});
    response.write(JSON.stringify(apiResponse));
    response.end();
  });
  // get roster Day Status
  app.get('/api/rosterDayStatus', (request, response) => {
    currentRosterDayStatus = current.rosterDayStatus;
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
    const requestedDay = moment(request.query.date);
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
    const requestedShift = request.query.shiftId;
    const apiResponse = getDayRosterFromShift(requestedShift, current.rosterDuties);
    response.writeHead(200, {'Content-Type': 'application/json'}, {cache: false});
    response.write(JSON.stringify(apiResponse));
    response.end();
  });
  // get staff image from staffId
  app.get('/api/staffImage', (request, response) => {
    const requestedStaffId = request.query.staffId;
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
    const apiResponse = asRequiredStaff(currentRosterDuties);
    response.writeHead(200, {'Content-Type': 'application/json'}, {cache: false});
    response.write(JSON.stringify(apiResponse));
    response.end();
  });
  // get a list of all services arriving and departing at a station
  app.get('/api/runningSheet', (request, response) => {
    const stationId = request.query.stationId;
    const runningSheetResponse = getRunningSheetForStation(stationId, current);
    response.writeHead(200, {'Content-Type': 'application/json'}, {cache: false});
    response.write(JSON.stringify(runningSheetResponse));
    response.end();
  });
  // get peak performance statistics by line
  app.get('/api/currentPeakPerformance', (request, response) => {
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
  const port = 4000;
  app.listen(port, '0.0.0.0');
  console.log('Pilot API listening on ' + port);
};
