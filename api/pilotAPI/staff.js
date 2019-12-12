
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
};
