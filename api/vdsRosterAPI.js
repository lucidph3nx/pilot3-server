
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

        let sequelize = new Sequelize('VDS_TDW', 'BEN_SHERMAN_RO', 'Ben2018S', {
            logging: false,
            host: 'APAUPVDSSQL01',
            dialect: 'mssql',
            options: {
                encrypt: false,
            },
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
                let staffId;
                let staffName;
                let shiftCovered;
                if (response[0][trp].uncovered !== 1) {
                    staffId = response[0][trp].staffId.trim();
                    staffName = response[0][trp].firstName.trim() + ' ' + response[0][trp].lastName.trim();
                    shiftCovered = true;
                } else {
                    staffId = '';
                    staffName = '';
                    shiftCovered = false;
                }
                if (response[0][trp].dutyName !== null && response[0][trp].dutyType
                    !== null && response[0][trp].dutyType !== 'REC') {
                    serviceRoster = {
                        shiftId: response[0][trp].shiftName.trim(),
                        shiftType: response[0][trp].shiftType.trim(),
                        staffId: staffId,
                        staffName: staffName,
                        dutyName: response[0][trp].dutyName.trim(),
                        dutyType: response[0][trp].dutyType.trim(),
                        dutyStartTime: mpm2m(response[0][trp].minutesFrom),
                        dutyStartTimeString: mpm2m(response[0][trp].minutesFrom).format('HH:mm'),
                        dutyEndTime: mpm2m(response[0][trp].minutesTo),
                        dutyEndTimeString: mpm2m(response[0][trp].minutesTo).format('HH:mm'),
                        shiftCovered: shiftCovered,
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
    // returns current counters for each location and position - days roster status
    dayRosterStatus: function dayStatus(date) {
        const Sequelize = require('sequelize');
        let moment = require('moment-timezone');
        moment().tz('Pacific/Auckland').format();

        return new Promise((resolve, reject) => {
        let searchdate = moment(date).format('YYYY-MM-DD');
        let rosterQueryString = `
            SELECT * FROM [VDS_TDW].[WEBSN].[dayStatus] WHERE [date] = '`+searchdate+`'
        `;

        let sequelize = new Sequelize('VDS_TDW', 'BEN_SHERMAN_RO', 'Ben2018S', {
            logging: false,
            host: 'APAUPVDSSQL01',
            dialect: 'mssql',
            options: {
                encrypt: false,
            },
            dialectOptions: {
            instanceName: 'TDW',
            },
        });

        let dayStatus = [];
        let rosterStatus = {};

        sequelize.query(rosterQueryString)
            .then(function(response) {
            for (st = 0; st < response[0].length; st++) {
                rosterStatus = {};
                rosterStatus = {
                    staffType: response[0][st].staffType.trim(),
                    location: response[0][st].location.trim(),
                    counterType: response[0][st].counterType.trim(),
                    count: response[0][st].count,
                };
                dayStatus.push(rosterStatus);
            };
            resolve(dayStatus);
            }
        );
        });
        },
    // returns uncovered shifts for day
    uncoveredShifts: function uncoveredShifts(date) {
        const Sequelize = require('sequelize');
        let moment = require('moment-timezone');
        moment().tz('Pacific/Auckland').format();

        return new Promise((resolve, reject) => {
        let searchdate = moment(date).format('YYYY-MM-DD');
        let rosterQueryString = `
            SELECT * FROM [VDS_TDW].[WEBSN].[uncoveredShifts] WHERE [date] = '`+searchdate+`'
        `;

        let sequelize = new Sequelize('VDS_TDW', 'BEN_SHERMAN_RO', 'Ben2018S', {
            logging: false,
            host: 'APAUPVDSSQL01',
            dialect: 'mssql',
            options: {
                encrypt: false,
            },
            dialectOptions: {
                instanceName: 'TDW',
            },
        });

        let uncoveredShifts = [];
        let shift = {};

        sequelize.query(rosterQueryString)
            .then(function(response) {
            for (st = 0; st < response[0].length; st++) {
                shift = {};
                shift = {
                    shiftName: response[0][st].shiftName.trim(),
                    staffType: response[0][st].staffType.trim(),
                    location: response[0][st].location.trim(),
                };
                uncoveredShifts.push(shift);
            };
            resolve(uncoveredShifts);
            }
        );
        });
        },
    visboardHeadcount: function visboardHeadcount() {
        const Sequelize = require('sequelize');
        let moment = require('moment-timezone');
        moment().tz('Pacific/Auckland').format();

        return new Promise((resolve, reject) => {
        let rosterQueryString = 'SELECT * FROM [VDS_TDW].[WEBSN].[visBoardHeadcount] ORDER BY 3,5,6';

        let sequelize = new Sequelize('VDS_TDW', 'BEN_SHERMAN_RO', 'Ben2018S', {
            logging: false,
            host: 'APAUPVDSSQL01',
            dialect: 'mssql',
            options: {
                encrypt: false,
            },
            dialectOptions: {
            instanceName: 'TDW',
            },
        });

        let headcounts = [];
        let entry = {};

        sequelize.query(rosterQueryString)
            .then(function(response) {
            for (st = 0; st < response[0].length; st++) {
                entry = {};
                entry = {
                    year: response[0][st].year,
                    fortnight: response[0][st].fortnight,
                    begining: response[0][st].begining,
                    count: response[0][st].count,
                    position: response[0][st].position,
                    location: response[0][st].location,
                };
                headcounts.push(entry);
            };
            resolve(headcounts);
            }
        );
        });
        },

        // other exports here
    };
