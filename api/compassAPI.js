
// returns current timetable stop times from Compass DB
module.exports = {
    currentTimetable: function() {
        const Sequelize = require('sequelize');
        let moment = require('moment-timezone');
        moment().tz('Pacific/Auckland').format();

        return new Promise((resolve, reject) => {
            let timetableQueryString = 'SELECT * FROM [Compass].[dbo].[todaysTimetable]';
            timetableQueryString += 'ORDER BY [blockId], [serviceDeparts], [serviceId], [stationSequence]';
            let sequelize = new Sequelize('Compass', 'TDW-Compass', 'wx38tt2018',
                        {logging: false, host: 'APNZWPCPSQL01', dialect: 'mssql'});

            let currentTimetable = [];
            let timingPoint = {};

            sequelize.query(timetableQueryString)
            .then(function(response) {
            for (tp = 0; tp < response[0].length; tp++) {
                timingPoint = {};
                if (response[0][tp].serviceId !== null) {
                timingPoint = {
                        serviceId: response[0][tp].serviceId,
                        line: response[0][tp].line,
                        direction: response[0][tp].direction,
                        blockId: response[0][tp].blockId,
                        units: response[0][tp].units,
                        arrives: cps2m(response[0][tp].arrives),
                        departs: cps2m(response[0][tp].departs),
                        station: response[0][tp].station,
                        stationSequence: (response[0][tp].stationSequence -1),
                        dayType: response[0][tp].dayType,
                    };
                    currentTimetable.push(timingPoint);
                    };
            };
            resolve(currentTimetable);
            }
        );
        });
        /**
         * Takes a time Compass format
         * Converts it into a moment object
         * @param {string} compasstime
         * @return {object} - Moment object
         */
        function cps2m(compasstime) {
            let thisMoment = moment();
            thisMoment.set('hour', compasstime.substring(0, 2));
            thisMoment.set('minute', compasstime.substring(2, 4));
            thisMoment.set('second', compasstime.substring(4, 6));
            thisMoment.set('miliseconds', 0);
            return thisMoment;
        };
    },
    busReplacements: function() {
        const Sequelize = require('sequelize');
        let moment = require('moment-timezone');
        moment().tz('Pacific/Auckland').format();

        return new Promise((resolve, reject) => {
            // let today = moment().format('YYYY-MM-DD');
            let busReplacementQueryString = 'SELECT * FROM dbo.[todaysBusReplacements]';
            // let busReplacementQueryString = `
            // DECLARE @todaydate datetime;
            // SET @todaydate = '`+today+`'
            // SELECT [TT_TDN] As 'serviceId'
            //       ,[BusReplacement] AS 'busReplaced'
            // FROM [Compass].[COMPASS].[TDW_Daily_Services]
            // WHERE [BusReplacement] != 0
            // AND [OPERATING_DATE] = @todaydate
            // `;
            let sequelize = new Sequelize('Compass', 'TDW-Compass', 'wx38tt2018', {
              logging: false,
              host: 'APNZWPCPSQL01',
              dialect: 'mssql',
            });

            let currentBusReplacedList = [];
            let replacementOccurance = {};

            sequelize.query(busReplacementQueryString)
            .then(function(response) {
              for (tp = 0; tp < response[0].length; tp++) {
                replacementOccurance = {};
                if (response[0][tp].serviceId !== null) {
                  replacementOccurance = {
                        serviceId: response[0][tp].serviceId,
                        replacementType: response[0][tp].busReplaced,
                      };
                      currentBusReplacedList.push(replacementOccurance);
                    };
              };
              resolve(currentBusReplacedList);
            }
          );
        });
    },
    // other functions
};
