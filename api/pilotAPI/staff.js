
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
const getStaffPhotoFromId = require('./../../functions/staffImage');
const sharp = require('sharp');
const nzRailConventions = require('./../../data/nzRailConventions');

module.exports = function(app, current, functionFlags) {
  app.get('/api/staff/details', (request, response) => {
    const requestedStaffId = request.query.staffId;
    let apiResponse;
    vdsRosterAPI.staffDetails(requestedStaffId).then((result) => {
      const staffDetails = result;
      apiResponse = {'Time': moment(), staffDetails};
      response.writeHead(200, {'Content-Type': 'application/json'}, {cache: false});
      response.write(JSON.stringify(apiResponse));
      response.end();
    }).catch((error) => {
      console.log(error);
    });
  });
  // get staff image from staffId
  app.get('/api/staff/image', (request, response) => {
    const requestedStaffId = request.query.staffId;
    const widthString = request.query.width;
    const heightString = request.query.height;
    const format = request.query.format;
    let width;
    let height;
    if (widthString) {
      width = parseInt(widthString);
    }
    if (heightString) {
      height = parseInt(heightString);
    }
    response.type(`image/${format || 'png'}`);

    const photoRelativePath = getStaffPhotoFromId(requestedStaffId);
    // if file exists
    if (photoRelativePath !== '') {
      const responsePath = path.resolve(photoRelativePath);
      resize(responsePath, format, width, height).pipe(response);
    }
    /**
 * resizes image a returns file stream
 * @param {string} path
 * @param {string} format
 * @param {integer} width
 * @param {integer} height
 * @return {stream} file stream resized image
 */
    function resize(path, format, width, height) {
      const readStream = fs.createReadStream(path);
      let transform = sharp();
      if (format) {
        transform = transform.toFormat(format);
      }
      if (width || height) {
        transform = transform.resize(width, height);
      }
      return readStream.pipe(transform);
    }
  });
  // get holistic year report for staff member
  app.get('/api/staff/holisticYear', (request, response) => {
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
};
