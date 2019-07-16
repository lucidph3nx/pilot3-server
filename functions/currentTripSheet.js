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
    for (let tp = 0; tp < timetable.length; tp++) {
      if (timetable[tp].serviceId !== tripLine.serviceId) {
        tripLine = {
          serviceId: timetable[tp].serviceId,
          line: timetable[tp].line,
          direction: timetable[tp].direction,
          blockId: timetable[tp].blockId,
        };
        currenttripSheet.push(tripLine);
      }
    }
    return currenttripSheet;
  }
};
