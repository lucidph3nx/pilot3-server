module.exports = function(timetable) {
    // converst timetable into trip sheet format
    if (timetable !== undefined && timetable !== []) {
        let currenttripSheet = [];
        let tripLine = {};
        for (tp = 0; tp < currentTimetable.length; tp++) {
            if (currentTimetable[tp].serviceId !== tripLine.serviceId) {

                tripLine = {
                    serviceId: currentTimetable[tp].serviceId,
                    line: currentTimetable[tp].line,
                    direction: currentTimetable[tp].direction,
                };
                currenttripSheet.push(tripLine);
            }
        }
        return currenttripSheet;
    }
};
