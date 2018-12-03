let express = require('express');
let app = express();
let https = require('https');
let moment = require('moment-timezone');
moment().tz('Pacific/Auckland').format();


module.exports = {
    // geVisVehicles: function() {
    //     return new Promise(function(resolve, reject) {
    //         let options = {
    //             hostname: 'gis.kiwirail.co.nz',
    //             port: app.get('port'),
    //             path: 'https://gis.kiwirail.co.nz/tracker/vehicles?f=jesri',
    //             method: 'GET',
    //             json: true,
    //         };
    //         https.get(options, function(response) {
    //             // console.log("Got response: " + response.statusCode);
    //         let body = '';
    //         response.on('data', function(chunk) {
    //             body += chunk;
    //         });
    //         response.on('end', function() {
    //             if (body.substring(0, 1) == '<') {
    //                 console.log('GeVis returned service unavailable @ ' + moment().format('HH:mm:ss'));
    //             } else {
    //                 let geVisVehicles = JSON.parse(body);
    //                 if (body == {'metadata': {'outputSpatialReference': 0}, 'features': []}) {
    //                 console.log('GeVis Vehicles responded empty @' + moment().format('HH:mm:ss'));
    //                 };
    //                 resolve(geVisVehicles);
    //             };
    //             });
    //         }).on('error', function(error) {
    //             console.log('Got error: ' + error.message);
    //         });
    //     });
    // },
    // taking a crack at the new API
    geVisVehicles: function(token) {
        return new Promise(function(resolve, reject) {
            let options = {
                hostname: 'gis.kiwirail.co.nz',
                port: app.get('port'),
                // eslint-disable-next-line max-len
                path: 'https://gis.kiwirail.co.nz/arcgis/rest/services/Tracking/vehicleGevis/MapServer/4/query?token=' + token + '&f=json&returnGeometry=false&spatialRel=esriSpatialRelIntersects&geometry=%7B%22xmin%22%3A0.0%2C%22ymin%22%3A0.0%2C%22xmax%22%3A9999999.9%2C%22ymax%22%3A9999999.9%2C%22spatialReference%22%3A%7B%22wkid%22%3A2193%7D%7D&geometryType=esriGeometryEnvelope&outFields=TRNID,VEHID,EQUIPDESC,LAT,LON,VEHSPD,VEHDIR,TIMESTMPNZ,TIMESTMPGIS,DELAYTIME,TRNDESCRP',
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
                    console.log('NEW GeVis returned service unavailable @ ' + moment().format('HH:mm:ss'));
                } else {
                    let geVisVehicles = JSON.parse(body);
                    if (body == {'metadata': {'outputSpatialReference': 0}, 'features': []}) {
                    console.log('NEW GeVis Vehicles responded empty @' + moment().format('HH:mm:ss'));
                    };
                    if (body == {'error': {'code': 498, 'message': 'Invalid Token', 'details': []}}) {
                        console.log(moment().format('HH:mm:ss') + 'GEVIS TOKEN INVALID');
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

