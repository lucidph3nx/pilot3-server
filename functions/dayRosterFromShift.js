
/**
 * takes a shiftId and retuns all of the duties for the day
 * @param {String} shiftId
 * @param {Array} rosterDuties
 * @return {Array} Day Roster Array
 */
module.exports = function(shiftId, rosterDuties) {
  const dayRoster = [];
  if (rosterDuties == undefined || rosterDuties.length == 0) {
    return dayRoster;
  }
  for (let s = 0; s < rosterDuties.length; s++) {
    if (rosterDuties[s].shiftId == shiftId) {
      const serviceRoster = {
        shiftId: rosterDuties[s].shiftId,
        shiftType: rosterDuties[s].shiftType,
        staffId: rosterDuties[s].staffId,
        staffName: rosterDuties[s].staffName,
        dutyName: rosterDuties[s].dutyName,
        dutyType: rosterDuties[s].dutyType,
        dutyStartTime: rosterDuties[s].dutyStartTime.format('HH:mm'),
        dutyEndTime: rosterDuties[s].dutyEndTime.format('HH:mm'),
      };
      dayRoster.push(serviceRoster);
    }
  }
  return dayRoster;
};
