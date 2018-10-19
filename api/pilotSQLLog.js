
module.exports = {
    // loggs all currentServices into SQL DB
    pilotSQLLog: function pilotSQLLog(current) {
        const Sequelize = require('sequelize');
        let moment = require('moment-timezone');
        moment().tz('Pacific/Auckland').format();
        let currentServices = current.services;
        if (currentServices.length !== 0) {
            console.log('SQL logging: ' + currentServices.length + ' services');
            for (let s = 0; s < currentServices.length; s++) {
                sqlLogThisService(currentServices[s]);
            }
        }
        /**
         * loggs a service snapshot to sql db
         * @param {object} currentService
         * @return {string} except it doesnt really
         */
        function sqlLogThisService(currentService) {
            let now = moment();
            return new Promise((resolve, reject) => {
                let timeStamp = now.format('YYYY-MM-DD HH:mm:ss');
                let serviceId = currentService.serviceId;
                let blockId = currentService.blockId;
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
                let rosterQueryString = `
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
                        let sequelize = new Sequelize({
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
                        });
                        // console.log(rosterQueryString);
                        sequelize.query(rosterQueryString)
                            .then(function(response) {
                            }
                        );
                        });
        };
    },
};
