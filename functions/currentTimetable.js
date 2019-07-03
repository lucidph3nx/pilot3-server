let compassAPI = require('../api/compassAPI');

module.exports = function() {
    return new Promise((resolve, reject) => {
        compassAPI.currentTimetable().then((response) => {
            if (response !== undefined) {
                currentTimetable = [];
                currentTimetable = response;
            }
            resolve(currentTimetable);
        });
    });
};
