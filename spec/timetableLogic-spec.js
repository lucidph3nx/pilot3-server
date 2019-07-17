const moment = require('moment-timezone');
moment().tz('Pacific/Auckland').format();
const timetableLogic = require('../functions/timetableLogic');
const testTimetable = require('../data/testData/timetable');
const testTripSheet = require('../data/testData/tripSheet');

describe('generate trip sheet', function() {
  it('Takes a timetable array and generates a trip sheet from it', function() {
    const tripsheet = timetableLogic.getTripSheet(testTimetable);
    expect(tripsheet).toEqual(testTripSheet);
  });
});

describe('get timetable details', function() {
  it('gets the timetable meta details for a service', function() {
    let serviceId = '2633'
    let kiwirailBoolean = false
    let serviceDescription = 'HVL2018MTF 1040 UPHTT 1125 WGTNS ML'
    let timetabledetails = timetableLogic.getTimetableDetails(serviceId, testTimetable, kiwirailBoolean, serviceDescription);
    expect(timetabledetails.origin).toBe('UPPE');
    expect(timetabledetails.destination).toBe('WELL');
    expect(timetabledetails.blockId).toBe(23);
    expect(timetabledetails.line).toBe('HVL');
    expect(timetabledetails.timingPoints.length).toBe(17);

    serviceId = '648'
    kiwirailBoolean = true
    serviceDescription = 'WELLINGTON-MASTERTON EXPRESS FREIGHT'
    timetabledetails = timetableLogic.getTimetableDetails(serviceId, testTimetable, kiwirailBoolean, serviceDescription);
    expect(timetabledetails.origin).toBe('WELL');
    expect(timetabledetails.destination).toBe('MAST');
    expect(timetabledetails.blockId).toBe('');
    expect(timetabledetails.line).toBe('');
    expect(timetabledetails.timingPoints.length).toBe(0);
  });
});

describe('guess origin and destination based on service description', function() {
  it('gets origin and desination stationId codes based on a serviceDescription string', function() {

    let serviceDescription = 'WELLINGTON-MASTERTON EXPRESS FREIGHT'
    let originDesintation = timetableLogic.guessKiwiRailTimetableDetails(serviceDescription);
    expect(originDesintation[0]).toBe('WELL');
    expect(originDesintation[1]).toBe('MAST');

    serviceDescription = 'WELLINGTON-PALMERSTON NORTH EX FREIGHT'
    originDesintation = timetableLogic.guessKiwiRailTimetableDetails(serviceDescription);
    expect(originDesintation[0]).toBe('WELL');
    expect(originDesintation[1]).toBe('PALM');
  });
});

describe('get a list of services valid at a given time from a timetable', function() {
  it('gets an array of serviceId valid at a given time from a given timetable', function() {

    let time = '2019-07-07T23:55:00.000Z'
    let serviceArray = timetableLogic.getValidServicesAtTime(testTimetable, time);
    expect(serviceArray.length).toBe(11);
    expect(typeof serviceArray[0]).toBe('string');


  });
});