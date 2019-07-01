module.exports = function(timetable) {
  // converst timetable into trip sheet format
  if (timetable !== undefined && timetable !== []) {
    let currenttripSheet = [];
    for (tp = 0; tp < currentTimetable.length; tp++) {
      if (currentTimetable[tp].serviceId !== tripLine.serviceId) {
        const tripLine = {
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
