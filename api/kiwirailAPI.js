const express = require('express');
const app = express();
const https = require('https');
const moment = require('moment-timezone');
moment().tz('Pacific/Auckland').format();

module.exports = {
  geVisVehicles: function(token) {
    return new Promise(function(resolve, reject) {
      const options = {
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
            reject(new Error('NEW GeVis returned service unavailable @ ' + moment().format('HH:mm:ss')));
          } else {
            const geVisVehicles = JSON.parse(body);
            if (geVisVehicles.features == []) {
              reject(new Error('GeVis Query responded empty'));
            }
            if (geVisVehicles.error !== undefined && geVisVehicles.error.code == 498) {
              reject(new Error('GeVis Token Invalid Or Expired'));
            }
            resolve(geVisVehicles);
          }
        });
      }).on('error', function(error) {
        reject(new Error('Got error: ' + error.message));
      });
    });
  },
  checkAPI: function(token) {
    let status = 'Connection OK';
    return new Promise(function(resolve, reject) {
      const options = {
        hostname: 'gis.kiwirail.co.nz',
        port: app.get('port'),
        // eslint-disable-next-line max-len
        path: 'https://gis.kiwirail.co.nz/arcgis/rest/services/Tracking/vehicleGevis/MapServer/4/query?token=' + token + '&f=json&returnGeometry=false&spatialRel=esriSpatialRelIntersects&geometry=%7B%22xmin%22%3A0.0%2C%22ymin%22%3A0.0%2C%22xmax%22%3A9999999.9%2C%22ymax%22%3A9999999.9%2C%22spatialReference%22%3A%7B%22wkid%22%3A2193%7D%7D&geometryType=esriGeometryEnvelope&outFields=TRNID,VEHID,EQUIPDESC,LAT,LON,VEHSPD,VEHDIR,TIMESTMPNZ,TIMESTMPGIS,DELAYTIME,TRNDESCRP',
        method: 'GET',
        json: true,
      };
      https.get(options, function(response) {
        let body = '';
        response.on('data', function(chunk) {
          body += chunk;
        });
        response.on('end', function() {
          if (body.substring(0, 1) == '<') {
            status = 'GeVis returned service unavailable';
          } else {
            const geVisVehicles = JSON.parse(body);
            if (geVisVehicles.features == []) {
              status = 'GeVis Query responded empty';
            }
            if (geVisVehicles.error !== undefined && geVisVehicles.error.code == 498) {
              status = 'GeVis Token Invalid Or Expired';
            }
            if (geVisVehicles.features !== [] && status == 'Connection OK') {
              let mostUpToDateTrain;
              let latestPing = 0;
              for (let i = 0; i < geVisVehicles.features.length; i++) {
                const thisTrain = geVisVehicles.features[i].attributes;
                if (thisTrain.TIMESTMPNZ > latestPing
                  && (thisTrain.EQUIPDESC == 'Matangi Power Car'
                  || thisTrain.EQUIPDESC == 'Matangi Trailer Car')) {
                  latestPing = thisTrain.TIMESTMPNZ;
                  mostUpToDateTrain = thisTrain;
                }
              }
              latestPing = mostUpToDateTrain.TIMESTMPNZ;
              const gisPing = mostUpToDateTrain.TIMESTMPGIS;
              const timeNow = moment.utc(gisPing);
              const latestPositionTime = moment.utc(latestPing);
              const differenceRAW = Number(timeNow.diff(latestPositionTime).valueOf() / 1000);
              if (differenceRAW > 20) {
                status = 'GeVis Vehicles not updating';
              }
            }
            resolve(status);
          }
        });
      });
    });
  },
};

