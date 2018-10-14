
module.exports = {
    // loggs all currentServices into SQL DB
    pilotSQLLog: function pilotSQLLog(current) {
        const Sequelize = require('sequelize');
        let moment = require('moment-timezone');
        moment().tz('Pacific/Auckland').format();
        let now = moment();
        let currentServices = current.services;
        if (currentServices.length !== 0) {
            for (let s = 0; s < currentServices.length; s++) {
            return new Promise((resolve, reject) => {
let rosterQueryString = `
USE [Test]
GO
INSERT INTO [dbo].[pilotLog]
            ([timeStamp]
            ,[serviceId]
            /*,[blockId]
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
            ,[lastService]
            ,[hasNextService]
            ,[nextService]
            ,[nextServiceTime]
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
            ,[meterage]*/)
        VALUES
            '`+now+`'
            ,'`+currentServices[s].serviceId+`'
            /*,<blockId, varchar(4),>
            ,<line, varchar(3),>
            ,<kiwirail, bit,>
            ,<direction, varchar(4),>
            ,<linkedUnit, varchar(6),>
            ,<cars, varchar(5),>
            ,<speed, real,>
            ,<locationAgeSeconds, bigint,>
            ,<scheduleVariance, datetime,>
            ,<varianceFriendly, int,>
            ,<varianceKiwirail, int,>
            ,<departs, datetime,>
            ,<arrives, datetime,>
            ,<origin, varchar(4),>
            ,<destination, varchar(4),>
            ,<lastStation, varchar(4),>
            ,<lastStationCurrent, bit,>
            ,<lastService, varchar(4),>
            ,<hasNextService, bit,>
            ,<nextService, varchar(4),>
            ,<nextServiceTime, datetime,>
            ,<LE, varchar(50),>
            ,<LEShift, varchar(50),>
            ,<TM, varchar(50),>
            ,<TMShift, varchar(50),>
            ,<statusMessage, varchar(50),>
            ,<status1, varchar(50),>
            ,<status2, varchar(50),>
            ,<status3, varchar(50),>
            ,<lat, float,>
            ,<long, float,>
            ,<meterage, float,>*/)
GO
`;
            let sequelize = new Sequelize('TEST', 'PilotSQL', 'test', {
                logging: false,
                host: '(localdb)\\MyInstance',
                dialect: 'mssql',
                dialectOptions: {
                instanceName: 'LOCALDB#B2E5B83E',
                options: {
                    encrypt: false,
                },
                },
            });
            sequelize.query(rosterQueryString)
                .then(function(response) {
                }
            );
            });
            }
        }
    },
};
