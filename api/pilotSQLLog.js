const Sequelize = require('sequelize');
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
});
const moment = require('moment-timezone');
moment().tz('Pacific/Auckland').format();
const sequelize = new Sequelize({
  database: 'PILOTSQL',
  username: 'PilotLoggingService',
  password: 'test',
  logging: false,
  host: 'D-3VZ5CD2',
  port: 1433,
  dialect: 'mssql',
  options: {
    encrypt: false,
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
});

module.exports = {
  // loggs all currentServices into SQL DB
  pilotSQLLog: function pilotSQLLog(current) {
    const currentServices = current.services;
    if (currentServices.length !== 0) {
      // console.log('SQL logging: ' + currentServices.length + ' services');
      // for (let s = 0; s < currentServices.length; s++) {
      //     sqlLogThisService(currentServices[s]);
      // }
      for (let s = 0; p = Promise.resolve(), s < currentServices.length; s++) {
        p = p.then(
            sqlLogThisService(currentServices[s])
        );
      }
    }
    const currentCars = current.carList;
    if (currentCars.length !== 0) {
      // console.log('SQL logging: ' + currentServices.length + ' services');
      // for (let s = 0; s < currentServices.length; s++) {
      //     sqlLogThisService(currentServices[s]);
      // }
      for (let c = 0; p = Promise.resolve(), c < currentCars.length; c++) {
        p = p.then(
            sqlLogThisCar(currentCars[c])
        );
      }
    }
    /**
         * loggs a car snapshot to sql db
         * @param {*} currentCar
         * @return {string} except it doesnt really
         */
    function sqlLogThisCar(currentCar) {
      const now = moment();
      return new Promise((resolve, reject) => {
        // code goes here
        const timeStamp = now.format('YYYY-MM-DD HH:mm:ss');
        const carId = currentCar.carId;
        let linked;
        if (currentCar.linked) {
          linked=1;
        } else {
          linked=0;
        }
        let linkedServiceId = currentCar.linkedServiceId;
        if (linkedServiceId == '') {
          linkedServiceId = '\'\'';
        };
        let speed = currentCar.speed;
        if (speed == '') {
          speed = '\'\'';
        };
        let compass = currentCar.compass;
        if (compass == '') {
          compass = '\'\'';
        };
        let lat = currentCar.lat;
        if (lat == '') {
          lat = '\'\'';
        };
        let lon = currentCar.lon;
        if (lon == '') {
          lon = '\'\'';
        };
        const positionAge = currentCar.positionAge;
        const positionAgeSeconds = currentCar.positionAgeSeconds;
        const rosterQueryString = `
                INSERT INTO [dbo].[carLog]
                    ([timeStamp]
                    ,[carID]
                    ,[lat]
                    ,[lon]
                    ,[positionAge]
                    ,[positionAgeSeconds]
                    ,[speed]
                    ,[compass]
                    ,[linked]
                    ,[linkedServiceId])
                VALUES
                    ('`+timeStamp+`'
                    ,'`+carId+`'
                    ,`+lat+`
                    ,`+lon+`
                    ,'`+positionAge+`'
                    ,`+positionAgeSeconds+`
                    ,`+speed+`
                    ,`+compass+`
                    ,`+linked+`
                    ,'`+linkedServiceId+`')
                `;
        sequelize.query(rosterQueryString)
            .then(function(response) {
              resolve(response[1]);
            }).catch((error) =>{
              console.log(error);
            });
      });
    };
    /**
         * loggs a service snapshot to sql db
         * @param {object} currentService
         * @return {string} except it doesnt really
         */
    function sqlLogThisService(currentService) {
      const now = moment();
      return new Promise((resolve, reject) => {
        const timeStamp = now.format('YYYY-MM-DD HH:mm:ss');
        const serviceId = currentService.serviceId;
        const blockId = currentService.blockId;
        let kiwirail;
        let lastStationCurrent;
        if (currentService.kiwirail) {
          kiwirail=1;
        } else {
          kiwirail=0;
        }
        if (currentService.lastStationCurrent) {
          lastStationCurrent=1;
        } else {
          lastStationCurrent=0;
        }
        let thisLE = currentService.LE;
        let thisTM = currentService.TM;
        let cars = currentService.cars;
        if (cars == '') {
          cars = '\'\'';
        };
        let speed = currentService.speed;
        if (speed == '') {
          speed = '\'\'';
        };
        thisLE= thisLE.replace(/'/g, '\'\'');
        thisTM = thisTM.replace(/'/g, '\'\'');
        let lat = currentService.lat;
        if (lat == '') {
          lat = '\'\'';
        };
        let long = currentService.long;
        if (long == '') {
          long = '\'\'';
        };
        const rosterQueryString = `
                INSERT INTO [dbo].[pilotLog]
                        ([timeStamp]
                        ,[serviceId]
                        ,[blockId]
                        ,[line]
                        ,[kiwirail]
                        ,[direction]
                        ,[linkedUnit]
                        ,[cars]
                        ,[speed]
                        ,[locationAgeSeconds]
                        ,[scheduleVariance]
                        ,[varianceFriendly]
                        ,[varianceKiwirail]
                        ,[departs]
                        ,[arrives]
                        ,[origin]
                        ,[destination]
                        ,[lastStation]
                        ,[lastStationCurrent]
                        ,[LE]
                        ,[LEShift]
                        ,[TM]
                        ,[TMShift]
                        ,[statusMessage]
                        ,[status1]
                        ,[status2]
                        ,[status3]
                        ,[lat]
                        ,[long]
                        ,[meterage])
                    VALUES (
                        '`+timeStamp+`'
                        ,'`+serviceId+`'
                        ,'`+blockId+`'
                        ,'`+currentService.line+`'
                        ,`+kiwirail+`
                        ,'`+currentService.direction+`'
                        ,'`+currentService.linkedUnit+`'
                        ,'`+currentService.cars+`'
                        ,`+speed+`
                        ,`+currentService.locationAgeSeconds+`
                        ,'`+currentService.scheduleVariance+`'
                        ,`+currentService.varianceFriendly+`
                        ,`+currentService.varianceKiwirail+`
                        ,'`+currentService.departs+`'
                        ,'`+currentService.arrives+`'
                        ,'`+currentService.origin+`'
                        ,'`+currentService.destination+`'
                        ,'`+currentService.lastStation+`'
                        ,`+lastStationCurrent+`
                        ,'`+thisLE+`'
                        ,'`+currentService.LEShift+`'
                        ,'`+thisTM+`'
                        ,'`+currentService.TMShift+`'
                        ,'`+currentService.statusMessage+`'
                        ,'`+currentService.statusArray[0]+`'
                        ,'`+currentService.statusArray[1]+`'
                        ,'`+currentService.statusArray[2]+`'
                        ,`+lat+`
                        ,`+long+`
                        ,`+currentService.meterage+`)
                        `;
        sequelize.query(rosterQueryString)
            .then(function(response) {
              resolve(response[1]);
            }).catch((error) =>{
              console.log(error);
            });
      });
    };
  },
};
