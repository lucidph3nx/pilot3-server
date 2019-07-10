const moment = require('moment-timezone');
moment().tz('Pacific/Auckland').format();
// ======Authentication credentials=======
const credentials = require('../credentials');
const knex = require('knex')({
  client: 'mssql',
  connection: {
    // driver: 'msnodesqlv8',
    user: credentials.PilotSQL.username,
    password: credentials.PilotSQL.password,
    server: credentials.PilotSQL.host,
    database: credentials.PilotSQL.database,
    options: {
      encrypt: true,
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  },
  useNullAsDefault: true,
});

module.exports = {
  logSQL: {
    vehicle: function(vehicle) {
      knex.insert({
        timeStamp: vehicle.loadTime.format('YYYY-MM-DD HH:mm:ss'),
        vehicleId: vehicle.vehicleId,
        secondVehicleId: vehicle.secondVehicleId(),
        lat: vehicle.location.lat,
        long: vehicle.location.long,
        speed: vehicle.location.speed,
        compass: vehicle.location.compass,
        locationAge: vehicle.locationAge,
        locationAgeSeconds: vehicle.locationAgeSeconds,
        linked: vehicle.linked,
        serviceId: vehicle.serviceId,
      }).into('pilot.vehicleLog').then(function(result) {
        // console.log(result);
      }).catch((error) => {
        console.log(temp);
        console.log(error);
      });
    },
    service: function(service) {
      const temp = {
        timeStamp: service.currenttime.format('YYYY-MM-DD HH:mm:ss'),
        serviceId: service.serviceId,
        line: service.line,
        kiwirailLineId: service.kiwirailLineId,
        linkedVehicle: service.linkedVehicleId,
        thirdParty: service.thirdParty ? 1 : 0,
        lat: service.location.lat,
        long: service.location.long,
        speed: service.location.speed,
        compass: service.location.compass,
        direction: service.location.direction,
        meterage: service.location.meterage,
        locationAge: service.locationAge,
        scheduleVarianceMin: service.scheduleVarianceMin,
        scheduleVariance: service.scheduleVariance ? service.scheduleVariance.delayFriendly : '',
        varianceKiwirail: service.varianceKiwirail,
        lastStation: service.lastStation,
        lastStationCurrent: service.lastStationCurrent ? 1 : 0,
        LEStaffId: service.crew.LE.staffId,
        TMStaffId: service.crew.TM.staffId,
        statusMessage: service.statusMessage,
        status1: service.statusArray[0],
        status2: service.statusArray[1],
        status3: service.statusArray[2],
      };
      knex.insert(temp).into('pilot.serviceLog').then(function(result) {
        // console.log(result);
      }).catch((error) => {
        console.log(temp);
        console.log(error);
      });
    },
  },
};
