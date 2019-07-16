const moment = require('moment-timezone');
moment().tz('Pacific/Auckland').format();
module.exports = function(currentRosterDuties) {
  const asReqReport = [];
  const currentMoment = moment();
  if (currentRosterDuties == []) {
    return asReqReport;
  } else {
    for (let s = 0; s < currentRosterDuties.length; s++) {
      if (currentRosterDuties[s].dutyName.substring(0, 6) == 'As Req'
       && currentRosterDuties[s].dutyEndTime >= currentMoment) {
        const asReqEntry = {
          staffId: currentRosterDuties[s].staffId,
          staffName: currentRosterDuties[s].staffName,
          shiftId: currentRosterDuties[s].shiftId,
          shiftType: currentRosterDuties[s].shiftType,
          startTime: currentRosterDuties[s].dutyStartTime.format('HH:mm'),
          endTime: currentRosterDuties[s].dutyEndTime.format('HH:mm'),
        };
        asReqReport.push(asReqEntry);
      }
    }
    return asReqReport;
  }
};
