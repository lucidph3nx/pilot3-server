let compassAPI = require('./../api/compassAPI');

module.exports = function() {
    return new Promise((resolve, reject) => {
        compassAPI.currentTimetable().then((response) => {
            if (response !== undefined) {
            currentTimetable = [];
            currenttripSheet = [];
            currentTimetable = response;
            /* get current trip sheet (list of services)*/
            let tripLine = [];
            if (currentTimetable == []) {
                currenttripSheet = [];
            } else {
                for (tp = 0; tp < currentTimetable.length; tp++) {
                if (currentTimetable[tp].serviceId !== tripLine.serviceId) {
                tripline = {
                    serviceId: currentTimetable[tp].serviceId,
                    line: currentTimetable[tp].line,
                    direction: currentTimetable[tp].direction,
                };
                currenttripSheet.push(tripline);
                }
                }
            }
            }
            resolve(currentTimetable);
        });
    });
};
