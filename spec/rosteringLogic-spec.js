/* eslint max-len: 0 */
const moment = require('moment-timezone');
moment().tz('Pacific/Auckland').format();
const rosteringLogic = require('../functions/rosteringLogic');
// const testTripSheet = require('../data/testData/tripSheet');
// const testRosterDuties = require('../data/testData/rosterDuties');

const testDataOrganiser = require('../data/testData/testDataOrganiser');


describe('Find out turnaround time', function() {
  it('Works out turnaround time between an end time and the next start time', function() {
    const getTurnaround = rosteringLogic.common.getTurnaround;
    let time1 = moment('2019-07-08 12:35');
    let time2 = moment('2019-07-08 12:40');
    let turnaround = getTurnaround(time1, time2);
    expect(turnaround).toBe(5);

    time1 = moment('2019-07-08 13:05');
    time2 = moment('2019-07-08 14:10');
    turnaround = getTurnaround(time1, time2);
    expect(turnaround).toBe(65);

    time1 = moment('2019-07-08 13:25');
    time2 = moment('2019-07-08 13:20');
    expect(function() {
      getTurnaround(time1, time2);
    }).toThrow(new Error('Negative Turnaround time: -5'));
  });
});

describe('Find out next service for Train', function() {
  it('Works out the next service a train will do from the trip sheet/unit roster', function() {
    const timetableLogic = require('../functions/timetableLogic');
    const dummyData = testDataOrganiser('STOCK');
    const testTripSheet = timetableLogic.getTripSheet(dummyData.timetable);
    const getNextServiceTrainRoster = rosteringLogic.trainRoster.getNextServiceTrainRoster;
    let serviceId = '2601';
    let nextServiceId = getNextServiceTrainRoster(serviceId, testTripSheet);
    expect(nextServiceId).toBe('');

    serviceId = '6310';
    nextServiceId = getNextServiceTrainRoster(serviceId, testTripSheet);
    expect(nextServiceId).toBe('6311');

    serviceId = '3621';
    nextServiceId = getNextServiceTrainRoster(serviceId, testTripSheet);
    expect(nextServiceId).toBe('4620');
  });
});

describe('Find out previous (last) service for Train', function() {
  it('Works out the previous (last) service a train did from the trip sheet/unit roster', function() {
    const timetableLogic = require('../functions/timetableLogic');
    const dummyData = testDataOrganiser('STOCK');
    const testTripSheet = timetableLogic.getTripSheet(dummyData.timetable);
    const getPrevServiceTrainRoster = rosteringLogic.trainRoster.getPrevServiceTrainRoster;
    let serviceId = '2601';
    let prevServiceId = getPrevServiceTrainRoster(serviceId, testTripSheet);
    expect(prevServiceId).toBe('');

    serviceId = '6310';
    prevServiceId = getPrevServiceTrainRoster(serviceId, testTripSheet);
    expect(prevServiceId).toBe('6235');

    serviceId = '3621';
    prevServiceId = getPrevServiceTrainRoster(serviceId, testTripSheet);
    expect(prevServiceId).toBe('3620');
  });
});

describe('Find out next service for Crew Member', function() {
  it('Works out the next service a Crew Member will do from the roster', function() {
    const dummyData = testDataOrganiser('STOCK');
    const testRosterDuties = dummyData.testRosterDuties;

    const getNextServiceCrewRoster = rosteringLogic.crewRoster.getNextServiceCrewRoster;
    let serviceId = '6226';
    let shiftId = 'UTM603';
    let nextServiceId = getNextServiceCrewRoster(serviceId, shiftId, testRosterDuties);
    expect(nextServiceId).toBe('6227');

    serviceId = '9229';
    shiftId = 'WLE613';
    nextServiceId = getNextServiceCrewRoster(serviceId, shiftId, testRosterDuties);
    expect(nextServiceId).toBe('Sign-off');

    serviceId = '5634';
    shiftId = 'ULE610';
    nextServiceId = getNextServiceCrewRoster(serviceId, shiftId, testRosterDuties);
    expect(nextServiceId).toBe('5635');
  });
});

describe('Find out previous (last) service for Crew Member', function() {
  it('Works out the previous (last) service a Crew Member did from the roster', function() {
    const dummyData = testDataOrganiser('STOCK');
    const testRosterDuties = dummyData.testRosterDuties;
    const getPrevServiceCrewRoster = rosteringLogic.crewRoster.getPrevServiceCrewRoster;
    let serviceId = '9257';
    let shiftId = 'WLE640';
    let prevServiceId = getPrevServiceCrewRoster(serviceId, shiftId, testRosterDuties);
    expect(prevServiceId).toBe('9256');

    serviceId = '6207';
    shiftId = 'WPO602';
    prevServiceId = getPrevServiceCrewRoster(serviceId, shiftId, testRosterDuties);
    expect(prevServiceId).toBe('WK06');

    serviceId = '4607';
    shiftId = 'WLE622';
    prevServiceId = getPrevServiceCrewRoster(serviceId, shiftId, testRosterDuties);
    expect(prevServiceId).toBe('TA06');
  });
});

describe('get whole days rostered duties for a crew member from their shiftId', function() {
  it('filters the roster to only show duties relevant to that shift', function() {
    const dummyData = testDataOrganiser('STOCK');
    const testRosterDuties = dummyData.testRosterDuties;
    const getDayRosterFromShiftId = rosteringLogic.crewRoster.getDayRosterFromShiftId;
    let shiftId = 'WLE240';
    let rosterDuties = getDayRosterFromShiftId(shiftId, testRosterDuties);
    expect(rosterDuties.length).toBe(14);
    expect(rosterDuties[0].shiftId).toBe('WLE240');

    shiftId = 'WPO202';
    rosterDuties = getDayRosterFromShiftId(shiftId, testRosterDuties);
    expect(rosterDuties.length).toBe(8);
    expect(rosterDuties[0].shiftId).toBe('WPO202');

    shiftId = 'WLE222';
    rosterDuties = getDayRosterFromShiftId(shiftId, testRosterDuties);
    expect(rosterDuties.length).toBe(10);
    expect(rosterDuties[0].shiftId).toBe('WLE222');
  });
});

describe('get list of "as required" staff from roster', function() {
  it('Works out the previous (last) service a Crew Member did from the roster', function() {
    const dummyData = testDataOrganiser('STOCK');
    const testRosterDuties = dummyData.testRosterDuties;
    const getAsRequiredStaff = rosteringLogic.common.getAsRequiredStaff;
    const asRequiredStaff = getAsRequiredStaff(testRosterDuties);

    // should return 50 results
    expect(asRequiredStaff.length).toBe(50);

    expect(asRequiredStaff[0].staffId).toBe('038');
    expect(asRequiredStaff[0].shiftType).toBe('PO');
    expect(asRequiredStaff[0].startTime).toBe('12:35');
  });
});
