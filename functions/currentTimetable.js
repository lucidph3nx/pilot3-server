<<<<<<< HEAD
const compassAPI = require('./../api/compassAPI');
=======
const compassAPI = require('../api/compassAPI');
>>>>>>> 080ba4c31e9f2b238795b860c520394481ed6b29

module.exports = function() {
  return new Promise((resolve, reject) => {
    compassAPI.currentTimetable().then((response) => {
      if (response !== undefined) {
        currentTimetable = [];
<<<<<<< HEAD
        currenttripSheet = [];
        currentTimetable = response;
        /* get current trip sheet (list of services)*/
        if (currentTimetable == []) {
          currenttripSheet = [];
        } else {
          for (tp = 0; tp < currentTimetable.length; tp++) {
            if (currentTimetable[tp].serviceId !== tripLine.serviceId) {
              const tripline = {
                serviceId: currentTimetable[tp].serviceId,
                line: currentTimetable[tp].line,
                direction: currentTimetable[tp].direction,
              };
              currenttripSheet.push(tripline);
            }
          }
        }
=======
        currentTimetable = response;
>>>>>>> 080ba4c31e9f2b238795b860c520394481ed6b29
      }
      resolve(currentTimetable);
    });
  });
};
