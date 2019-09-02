const https = require('https');
const moment = require('moment-timezone');
moment().tz('Pacific/Auckland').format();

module.exports = {
  getWeatherObservations: function() {
    const weatherLocations = [
      {
        path: 'https://www.metservice.com/publicData/localObs_upper-hutt',
        nearestStation: 'TREN',
      },
      {
        path: 'https://www.metservice.com/publicData/localObs_lower-hutt',
        nearestStation: 'WATE',
      },
      {
        path: 'https://www.metservice.com/publicData/localObs_wellington-city',
        nearestStation: 'WELL',
      },
      {
        path: 'https://www.metservice.com/publicData/localObs_porirua',
        nearestStation: 'PORI',
      },
      {
        path: 'https://www.metservice.com/publicData/localObs_kapiti',
        nearestStation: 'PARA',
      },
    ];
    const weatherPromises = [];
    for (let i = 0; i < weatherLocations.length; i++) {
      weatherPromises.push(
          new Promise(function(resolve, reject) {
            const options = {
              hostname: 'www.metservice.com',
              path: weatherLocations[i].path,
              method: 'GET',
              json: true,
            };
            https.get(options, function(response) {
              let body = '';
              response.on('data', function(chunk) {
                body += chunk;
              });
              response.on('end', function() {
                const tempWeather = JSON.parse(body);
                if (tempWeather.threeHour !== undefined) {
                  const weatherMeasurement = {
                    measurementLocation: tempWeather.location,
                    closestStn: weatherLocations[i].nearestStation,
                    dateTime: tempWeather.threeHour.dateTimeISO,
                    humidity: tempWeather.threeHour.humidity,
                    pressure: tempWeather.threeHour.pressure,
                    rainfall: tempWeather.threeHour.rainfall,
                    temp: tempWeather.threeHour.temp,
                    windDirection: tempWeather.threeHour.windDirection,
                    windSpeed: tempWeather.threeHour.windSpeed,
                  };
                  resolve(weatherMeasurement);
                } else {
                  resolve(undefined);
                }
              });
            }).on('error', function(error) {
              reject(new Error('Got error: ' + error.message));
            });
          })
      );
    }
    return Promise.all(weatherPromises);
  },
  checkAPI: function() {
    return new Promise(function(resolve, reject) {
      const options = {
        hostname: 'www.metservice.com',
        path: 'https://www.metservice.com/publicData/localObs_wellington-city',
        method: 'GET',
        json: true,
      };
      https.get(options, function(response) {
        let body = '';
        response.on('data', function(chunk) {
          body += chunk;
        });
        response.on('end', function() {
          const tempWeather = JSON.parse(body);
          if (tempWeather.location !== undefined) {
            resolve('Connection Ok');
          } else {
            resolve('Connection Error');
          }
        });
      }).on('error', function(error) {
        resolve('Connection Error');
      });
    });
  },
};
