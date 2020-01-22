const moment = require('moment-timezone');
moment().tz('Pacific/Auckland').format();
const https = require('https');

module.exports = function(app) {
  // get the status for all Matangi Train Units
  return new Promise(function(resolve, reject) {
    const options = {
      hostname: 'sheets.googleapis.com',
      port: app.get('port'),
      // eslint-disable-next-line max-len
      path: 'https://sheets.googleapis.com/v4/spreadsheets/12kyxBUTvs8V2-kWculIjscB8PpaTNY2Y3POVrnSus3w?ranges=A1&fields=sheets(data.rowData.values)&key=AIzaSyCaVrygESDPqly9YFsUbEHBQ8W-2jqG0lo',
      method: 'GET',
      json: true,
    };
    https.get(options, function(response) {
      // console.log("Got response: " + response.statusCode);
      let body = '';
      response.on('data', function(chunk) {
        body += chunk;
      });
      response.on('end', function() {
        const response = JSON.parse(body);
        if (response.sheets[0] == []) {
          reject(new Error('Error'));
        }
        const dmckDate = response.sheets[0].data[0].rowData[0].values[0].formattedValue;
        if (dmckDate !== undefined) {
          if (moment(dmckDate) > moment()) {
            resolve(true);
          } else {
            resolve(false);
          }
        }
      });
    }).on('error', function(error) {
      reject(new Error('Got error: ' + error.message));
    });
  });
};
