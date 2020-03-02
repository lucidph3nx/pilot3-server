const moment = require('moment-timezone');
moment().tz('Pacific/Auckland').format();
// ======Authentication credentials=======
const credentials = require('../credentials');
const knex = require('knex')({
  client: 'mssql',
  connection: {
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
      const temp = {
        timeStamp: moment().format('YYYY-MM-DD HH:mm:ss'),
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
      };
      knex.insert(temp).into('pilot.vehicleLog').then(function(result) {
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
    weatherObservation: function(weather) {
      const temp = {
        dateTime: moment(weather.dateTime).format('YYYY-MM-DD HH:mm:ss'),
        measurementLocation: weather.measurementLocation,
        closestStn: weather.closestStn,
        humidity: !isNaN(Number(weather.humidity)) ? Number(weather.humidity) : null,
        pressure: !isNaN(Number(weather.pressure)) ? Number(weather.pressure) : null,
        rainfall: !isNaN(Number(weather.rainfall)) ? Number(weather.rainfall) : null,
        temp: !isNaN(Number(weather.temp)) ? Number(weather.temp) : null,
        windDirection: weather.windDirection,
        windSpeed: !isNaN(Number(weather.windSpeed)) ? Number(weather.windSpeed) : null,
      };
      knex.insert(temp).into('pilot.weatherLog').then(function(result) {
        // console.log(result);
      }).catch((error) => {
        console.log(temp);
        console.log(error);
      });
    },
    notInService: function(workOrder) {
      return new Promise((resolve, reject) => {
        knex.select()
            .table('pilot.notInServiceLog')
            .where('WorkOrderId', workOrder.workOrderId)
            .then(function(response) {
              if (response.length !== 0) {
              // update
                knex.update({updatedDate: moment().format('YYYY-MM-DD HH:mm:ss')})
                    .table('pilot.notInServiceLog')
                    .where({workOrderId: workOrder.workOrderId});
              } else {
                const temp = {
                  workOrderId: workOrder.workOrderId,
                  unit: workOrder.unit,
                  matangi: workOrder.matangi ? 1 : 0,
                  NIS: workOrder.NIS ? 1 : 0,
                  plannedNIS: workOrder.plannedNIS ? 1 : 0,
                  unplannedNIS: workOrder.unplannedNIS ? 1 : 0,
                  restricted: workOrder.restricted ? 1 : 0,
                  detail: workOrder.detail,
                  description: workOrder.description,
                  reportedDate: moment(workOrder.reportedDate).format('YYYY-MM-DD HH:mm:ss'),
                  updatedDate: moment().format('YYYY-MM-DD HH:mm:ss'),
                };
                knex.insert(temp).into('pilot.notInServiceLog').then(function(result) {
                  resolve();
                });
              }
            });
      }).catch((error) => {
        console.log(error);
      });
    },
  },
  getStaffList: function() {
    return new Promise((resolve, reject) => {
      const currentStaffList = [];
      let staffMember = {};
      knex.select()
          .table('pilot.currentStaffList')
          .then(function(response) {
            for (let s = 0; s < response.length; s++) {
              staffMember = {
                staffId: response[s].staffId,
                name: response[s].name,
                position: response[s].position,
                ADId: response[s].ADId,
                managerName: response[s].managerName,
                managerPosition: response[s].managerPosition,
              };
              currentStaffList.push(staffMember);
            }
            resolve(currentStaffList);
          });
    });
  },
};
