let express = require('express');
let app = express();
let https = require('https');
let moment = require('moment-timezone');
moment().tz('Pacific/Auckland').format();


module.exports = {
    geVisVehicles: function() {
        return new Promise(function(resolve, reject) {
            let options = {
                hostname: 'gis.kiwirail.co.nz',
                port: app.get('port'),
                path: 'https://gis.kiwirail.co.nz/tracker/vehicles?f=jesri',
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
                if (body.substring(0, 1) == '<') {
                    console.log('GeVis returned service unavailable @ ' + moment().format('HH:mm:ss'));
                } else {
                    let geVisVehicles = JSON.parse(body);
                    if (body == {'metadata': {'outputSpatialReference': 0}, 'features': []}) {
                    console.log('GeVis Vehicles responded empty @' + moment().format('HH:mm:ss'));
                    };
                    resolve(geVisVehicles);
                };
                });
            }).on('error', function(error) {
                console.log('Got error: ' + error.message);
            });
        });
    },
    // other functions
};

