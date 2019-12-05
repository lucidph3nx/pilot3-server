const moment = require('moment-timezone');
moment().tz('Pacific/Auckland').format();
const rosteringLogic = require('./../functions/rosteringLogic');
const nzRailConventions = require('./../data/nzRailConventions');
const getRunningSheetForStation = require('./../functions/runningSheetForStation');
// =======API=======
let vdsRosterAPI;
let compassAPI;

// only define the API modules if credentials file exists
const fs = require('fs');
const path = require('path');
const credentialPath = path.join(__dirname, '..', 'credentials.js');
if (fs.existsSync(credentialPath)) {
  vdsRosterAPI = require('./vdsRosterAPI');
  compassAPI = require('./compassAPI');
}
const express = require('express');

module.exports = function(app, current, functionFlags) {
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

  // =======PilotAPIModules========
  require('./pilotAPI/serverStatus')(app, current, functionFlags);
  require('./pilotAPI/services')(app, current, functionFlags);
  require('./pilotAPI/roster')(app, current, functionFlags);
  require('./pilotAPI/staff')(app, current, functionFlags);

  app.use('/staff', express.static(path.resolve('./data/img/staff')));

  // get the status for all Matangi Train Units
  app.get('/api/currentUnitList', (request, response) => {
    const currentUnitList = [];
    current.unitList.forEach((unit) =>
      currentUnitList.push(unit.webLegacy())
    );
    const apiResponse = {'Time': moment(), currentUnitList};
    response.writeHead(200, {'Content-Type': 'application/json'}, {cache: false});
    response.write(JSON.stringify(apiResponse));
    response.end();
  });
  // get the status for all Matangi Cars
  app.get('/api/currentCarList', (request, response) => {
    const currentCarList = [];
    current.carList.forEach((car) =>
      currentCarList.push(car.webLegacy())
    );
    const apiResponse = {'Time': moment(), currentCarList};
    response.writeHead(200, {'Content-Type': 'application/json'}, {cache: false});
    response.write(JSON.stringify(apiResponse));
    response.end();
  });
  // get all roster duties today
  app.get('/api/currentRoster', (request, response) => {
    const currentRosterDuties = current.rosterDuties;
    const apiResponse = {'Time': moment(), currentRosterDuties};
    response.writeHead(200, {'Content-Type': 'application/json'}, {cache: false});
    response.write(JSON.stringify(apiResponse));
    response.end();
  });
  // get roster Day Status
  app.get('/api/rosterDayStatus', (request, response) => {
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
  // get roster Day Status
  app.get('/api/rosteredCrew', (request, response) => {
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
  // get headcount data for vis board
  app.get('/api/visboardHeadcount', (request, response) => {
    vdsRosterAPI.visboardHeadcount().then((result) => {
      const headcountData = result;
      const apiResponse = {'Time': moment(), headcountData};
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
      const annualLeaveData = result;
      const apiResponse = {'Time': moment(), annualLeaveData};
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
      const sicknessData = result;
      const apiResponse = {'Time': moment(), sicknessData};
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
      const altDutiesData = result;
      const apiResponse = {'Time': moment(), altDutiesData};
      response.writeHead(200, {'Content-Type': 'application/json'}, {cache: false});
      response.write(JSON.stringify(apiResponse));
      response.end();
    }).catch((error) => {
      console.log(error);
    });
  });
  // get uncovered shifts
  app.get('/api/uncoveredShifts', (request, response) => {
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
  // get all roster duties for a particular shift today
  app.get('/api/dayRoster', (request, response) => {
    const getDayRosterFromShiftId = rosteringLogic.crewRoster.getDayRosterFromShiftId;
    const requestedShift = request.query.shiftId;
    const apiResponse = getDayRosterFromShiftId(requestedShift, current.rosterDuties);
    response.writeHead(200, {'Content-Type': 'application/json'}, {cache: false});
    response.write(JSON.stringify(apiResponse));
    response.end();
  });
  // get list of staff who are 'as Required' now
  app.get('/api/asRequiredStaff', (request, response) => {
    const apiResponse = rosteringLogic.common.getAsRequiredStaff(current.rosterDuties);
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
  // get train performance statistics by line
  app.get('/api/trainPerformance', (request, response) => {
    // default is today if not specified
    let requestedDay = moment().format('YYYY-MM-DD');
    if (request.query.date) {
      requestedDay = moment(request.query.date).format('YYYY-MM-DD');
    }
    let trainPerformance;
    compassAPI.trainPerformance(requestedDay).then((result) => {
      trainPerformance = result;
      const apiResponse = {'time': moment(), trainPerformance};
      response.writeHead(200, {'Content-Type': 'application/json'}, {cache: false});
      response.write(JSON.stringify(apiResponse));
      response.end();
    }).catch((error) => {
      console.log(error);
    });
  });

  // get holistic year report for staff member
  app.get('/api/holisticYear', (request, response) => {
    // nzRailConventions
    const staffId = request.query.staffId;
    const startDate = moment(request.query.year+'-01-01').format('YYYY-MM-DD');
    const endDate = moment(request.query.year+'-01-01')
        .add(1, 'year')
        .subtract(1, 'day').format('YYYY-MM-DD');
    // const fs = require('fs');
    // const jsonString = fs.readFileSync('./data/testData/testHolistic16283.json');
    // const testresponse = JSON.parse(jsonString);
    const holisticYear = [];
    vdsRosterAPI.holisticYearData(staffId, startDate, endDate).then((data) => {
      for (let i = 0; i < data.length; i++) {
        let dayType = '';
        for (const [key, value] of nzRailConventions.holisticReportCounterMap.entries()) {
          if (key == data[i].dayCode) {
            dayType = value;
          }
        }
        if (dayType == '') {
          dayType = 'WORK';
        }
        if (data[i].GEWP == 1) {
          dayType = 'GEWP';
        }
        let totalHoursNumber;
        if (data[i].totalHoursNumber !== null) {
          totalHoursNumber = Number((data[i].totalHoursNumber).toFixed(2));
        } else {
          totalHoursNumber = 0;
        }
        const entry = {
          'date': data[i].date,
          'dayType': dayType,
          'GEWP': data[i].GEWP,
          'dayCode': data[i].dayCode,
          'location': data[i].shiftLocation,
          'workType': data[i].shiftType,
          'hourFrom': data[i].hourFrom,
          'hourTo': data[i].hourTo,
          'totalHours': data[i].totalHours,
          'totalHoursNumber': totalHoursNumber,
        };
        holisticYear.push(entry);
      }
      let leaveTotal = 0;
      let sickTotal = 0;
      for (let i = 0; i < holisticYear.length; i++) {
        if (holisticYear[i].dayType == 'LEAVE') {
          leaveTotal++;
        } else if (holisticYear[i].dayType == 'SICK') {
          sickTotal++;
        }
      }
      const sickToLeaveRatio = sickTotal / leaveTotal;
      const apiResponse = {
        'reportTime': moment(),
        'staffId': data[0].staffId,
        'year': moment(data[0].date).format('YYYY'),
        'sickToLeaveRatio': sickToLeaveRatio,
        'holisticYearData': holisticYear,
        'dayCodes': nzRailConventions.holisticReportCodes,
      };
      response.writeHead(200, {'Content-Type': 'application/json'}, {cache: false});
      response.write(JSON.stringify(apiResponse));
      response.end();
    }).catch((error) => {
      console.log(error);
    });
  });

  const port = 4000;
  app.listen(port, '0.0.0.0');
  console.log('Pilot API listening on ' + port);
};
