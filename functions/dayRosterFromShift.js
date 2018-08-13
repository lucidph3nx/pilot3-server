module.exports = function(shiftId, current) {
  // takes a shiftId and retuns all of the duties for the day
  let dayRoster = [];
  if (current.rosterDuties == undefined || current.rosterDuties.length == 0) {
    return dayRoster;
  };
  for (s = 0; s < current.rosterDuties.length; s++) {
    if (current.rosterDuties[s].shiftId == shiftId) {
      serviceRoster = {
        shiftId: current.rosterDuties[s].shiftId,
        shiftType: current.rosterDuties[s].shiftType,
        staffId: current.rosterDuties[s].staffId,
        staffName: current.rosterDuties[s].staffName,
        dutyName: current.rosterDuties[s].dutyName,
        dutyType: current.rosterDuties[s].dutyType,
        dutyStartTime: current.rosterDuties[s].dutyStartTime.format('HH:mm'),
        dutyEndTime: current.rosterDuties[s].dutyEndTime.format('HH:mm'),
      };
      dayRoster.push(serviceRoster);
    };
  };
  return dayRoster;
};
