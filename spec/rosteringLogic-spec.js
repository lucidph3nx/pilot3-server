/* eslint-disable no-undef */
const moment = require('moment-timezone');
moment().tz('Pacific/Auckland').format();
const rosteringLogic = require('../functions/rosteringLogic');
const testTripSheet = require('../data/testData/tripSheet');
const testRosterDuties = require('../data/testData/rosterDuties');

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
    const getNextServiceCrewRoster = rosteringLogic.crewRoster.getNextServiceCrewRoster;
    let serviceId = '6226';
    let shiftId = 'UTM203';
    let nextServiceId = getNextServiceCrewRoster(serviceId, shiftId, testRosterDuties);
    expect(nextServiceId).toBe('6227');

    serviceId = '9229';
    shiftId = 'WLE213';
    nextServiceId = getNextServiceCrewRoster(serviceId, shiftId, testRosterDuties);
    expect(nextServiceId).toBe('Sign-off');

    serviceId = '5634';
    shiftId = 'ULE210';
    nextServiceId = getNextServiceCrewRoster(serviceId, shiftId, testRosterDuties);
    expect(nextServiceId).toBe('5635');
  });
});

describe('Find out previous (last) service for Crew Member', function() {
  it('Works out the previous (last) service a Crew Member did from the roster', function() {
    const getPrevServiceCrewRoster = rosteringLogic.crewRoster.getPrevServiceCrewRoster;
    let serviceId = '9257';
    let shiftId = 'WLE240';
    let prevServiceId = getPrevServiceCrewRoster(serviceId, shiftId, testRosterDuties);
    expect(prevServiceId).toBe('9256');

    serviceId = '6207';
    shiftId = 'WPO202';
    prevServiceId = getPrevServiceCrewRoster(serviceId, shiftId, testRosterDuties);
    expect(prevServiceId).toBe('WK06');

    serviceId = '4607';
    shiftId = 'WLE222';
    prevServiceId = getPrevServiceCrewRoster(serviceId, shiftId, testRosterDuties);
    expect(prevServiceId).toBe('TA06');
  });
});

describe('get list of "as required" staff from roster', function() {
  it('Works out the previous (last) service a Crew Member did from the roster', function() {
    const getAsRequiredStaff = rosteringLogic.common.getAsRequiredStaff;
    const asRequiredStaff = getAsRequiredStaff(testRosterDuties);

    // should return 50 results
    expect(asRequiredStaff.length).toBe(50);

    expect(asRequiredStaff[0].staffId).toBe('038');
    expect(asRequiredStaff[0].shiftType).toBe('PO');
    expect(asRequiredStaff[0].startTime).toBe('12:35');
  });
});