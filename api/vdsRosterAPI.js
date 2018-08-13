
module.exports = {
    // returns current datetime and object with todays VDS roster per trip
    rosterDuties: function rosterDuties() {
        const Sequelize = require('sequelize');
        let moment = require('moment-timezone');
        moment().tz('Pacific/Auckland').format();

        return new Promise((resolve, reject) => {
        let today = moment().format('YYYY-MM-DD');
        let rosterQueryString = `
            DECLARE @ThisDate datetime;
            SET @ThisDate = '`+today+`'
            SELECT * FROM [VDS_TDW].[WEBSN].[actualDuties]
            WHERE [date] = @ThisDate
            ORDER BY [date], [staffId], [minutesFrom]
        `;

        let sequelize = new Sequelize('VDS_TDW', 'WEBSN', 'Welcome1', {
            logging: false,
            host: 'APAUPVDSSQL01',
            dialect: 'mssql',
            dialectOptions: {
            instanceName: 'TDW',
            },
        });

        let currentRoster = [];
        let serviceRoster = {};

        sequelize.query(rosterQueryString)
            .then(function(response) {
            for (trp = 0; trp < response[0].length; trp++) {
                serviceRoster = {};
                if (response[0][trp].dutyName !== null && response[0][trp].dutyType !== null && response[0][trp].dutyType !== 'REC') {
                    serviceRoster = {
                        shiftId: response[0][trp].shiftName.trim(),
                        shiftType: response[0][trp].shiftType.trim(),
                        staffId: response[0][trp].staffId.trim(),
                        staffName: response[0][trp].firstName.trim() +
                        ' ' + response[0][trp].lastName.trim(),
                        dutyName: response[0][trp].dutyName.trim(),
                        dutyType: response[0][trp].dutyType.trim(),
                        dutyStartTime: mpm2m(response[0][trp].minutesFrom),
                        dutyStartTimeString: mpm2m(response[0][trp].minutesFrom).format('HH:mm'),
                        dutyEndTime: mpm2m(response[0][trp].minutesTo),
                        dutyEndTimeString: mpm2m(response[0][trp].minutesTo).format('HH:mm'),
                    };
                    currentRoster.push(serviceRoster);
                    };
            };
            resolve(currentRoster);
            }
        );
        });

        /**
         * Takes a time in min past midnight
         * Converts it into a moment object
         * @param {string} minutesPastMidnight 
         * @return {object} - Moment object
         */
        function mpm2m(minutesPastMidnight) {
            let thisMoment = moment();
            thisMoment.set('hour', 0);
            thisMoment.set('minute', 0);
            thisMoment.set('seconds', 0);
            thisMoment.set('miliseconds', 0);
            thisMoment.add(minutesPastMidnight, 'minutes');
            return thisMoment;
        };
    },
    //other exports here
    };