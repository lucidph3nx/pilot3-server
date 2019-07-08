/**
 * Takes a Timetable with all timing points
 * and produces a one line per service 'trip sheet'
 * @param {Array} timetable a timetable array
 * @return {Array} currenttripSheet
 */
module.exports = function(timetable) {
  // converst timetable into trip sheet format
  if (timetable !== undefined && timetable !== []) {
    const currenttripSheet = [];
    let tripLine = {};
    for (tp = 0; tp < currentTimetable.length; tp++) {
      if (currentTimetable[tp].serviceId !== tripLine.serviceId) {
        tripLine = {
          serviceId: currentTimetable[tp].serviceId,
          line: currentTimetable[tp].line,
          direction: currentTimetable[tp].direction,
          blockId: currentTimetable[tp].blockId,
        };
        currenttripSheet.push(tripLine);
      }
    }
    return currenttripSheet;
  }
};
