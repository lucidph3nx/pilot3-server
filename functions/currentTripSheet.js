/**
 * Takes a Timetable with all timing points
 * and produces a one line per service 'trip sheet'
 * @param {Array} timetable a timetable array
 * @return {Array} currenttripSheet
 */
module.exports = function(timetable) {
  // converst timetable into trip sheet format
  if (timetable !== undefined && timetable !== []) {
<<<<<<< HEAD
    let currenttripSheet = [];
    for (tp = 0; tp < currentTimetable.length; tp++) {
      if (currentTimetable[tp].serviceId !== tripLine.serviceId) {
        const tripLine = {
=======
    const currenttripSheet = [];
    let tripLine = {};
    for (tp = 0; tp < currentTimetable.length; tp++) {
      if (currentTimetable[tp].serviceId !== tripLine.serviceId) {
        tripLine = {
>>>>>>> 080ba4c31e9f2b238795b860c520394481ed6b29
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
