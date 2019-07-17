
/**
 * produces array of all arrivals and departures for a given station
 * @param {string} stationId
 * @param {Object} current contains current information
 * @return {Array} all services arriving and departing that station
 */
module.exports = function(stationId, current) {
// Gets a arrivals and departures list for a particular station
  const runningSheet = [];
  let serviceEntry = {};
  for (let s = 0; s < current.timetable.length; s++) {
    if (current.timetable[s].station == stationId) {
      // convert direction to human format
      let runningSheetDirection;
      if (current.timetable[s].direction == 'U') {
        runningSheetDirection = 'UP';
      } else if (current.timetable[s].direction == 'D') {
        runningSheetDirection = 'DOWN';
      }
      // get rostered staff
      const currentRosterDuties = current.rosterDuties;
      const staff = currentRosterDuties.filter(
          (currentRosterDuties) => currentRosterDuties.dutyName == current.timetable[s].serviceId);
      let LE = '';
      let LEShift = '';
      let TM = '';
      let TMShift = '';
      const PO = [];
      for (let st = 0; st < staff.length; st++) {
        if (staff[st].dutyType == 'TRIP') {
          LE = staff[st].staffName + ' (' + staff[st].staffId + ')';
          LEShift = staff[st].shiftId;
        }
        if (staff[st].dutyType == 'TRIPT') {
          TM = staff[st].staffName + ' (' + staff[st].staffId + ')';
          TMShift = staff[st].shiftId;
        }
        if (staff[st].dutyType == 'TRIPP') {
          PO.push({name: staff[st].staffName + ' (' + staff[st].staffId + ')', shift: staff[st].shiftId});
        }
        // catch empty trips incorrectly added as 'SHUNT'
        if (staff[st].dutyType == 'SHUNT' || staff[st].dutyType == 'OTH') {
          if (staff[st].shiftType == 'LE' && LE == '') {
            LE = staff[st].staffName + ' (' + staff[st].staffId + ')';
            LEShift = staff[st].shiftId;
          }
          if (staff[st].shiftType == 'TM' && TM == '') {
            TM = staff[st].staffName + ' (' + staff[st].staffId + ')';
            TMShift = staff[st].shiftId;
          }
          if (staff[st].shiftType == 'PO' && !PO.includes(staff[st].staffName + ' (' + staff[st].staffId) + ')') {
            PO.push({name: staff[st].staffName + ' (' + staff[st].staffId + ')', shift: staff[st].shiftId});
          }
        }
      }
      // get delay from current.services
      let serviceVariance;
      let serviceStatusArray;
      for (let sv = 0; sv < current.services.length; sv++) {
        if (current.timetable[s].serviceId == current.services[sv].serviceId) {
          serviceVariance = current.services[sv].varianceFriendly;
          serviceStatusArray = current.services[sv].statusArray;
        }
      }
      serviceEntry = {
        serviceId: current.timetable[s].serviceId,
        units: current.timetable[s].units,
        direction: runningSheetDirection,
        arrives: current.timetable[s].arrives.format('HH:mm'),
        departs: current.timetable[s].departs.format('HH:mm'),
        variance: serviceVariance,
        statusArray: serviceStatusArray,
        LE: LE,
        LEShift: LEShift,
        TM: TM,
        TMShift: TMShift,
        PO: PO,
      };
      runningSheet.push(serviceEntry);
    }
  }
  return runningSheet;
};
