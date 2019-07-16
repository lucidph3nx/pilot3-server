const compassAPI = require('../api/compassAPI');

module.exports = function() {
  return new Promise((resolve, reject) => {
    compassAPI.currentTimetable().then((response) => {
      let currentTimetable;
      if (response !== undefined) {
        currentTimetable = response;
      }
      resolve(currentTimetable);
    });
  });
};
