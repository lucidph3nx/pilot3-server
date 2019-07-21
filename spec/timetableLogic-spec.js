/* eslint max-len: 0 */
const moment = require('moment-timezone');
moment().tz('Pacific/Auckland').format();
const timetableLogic = require('../functions/timetableLogic');
const testDataOrganiser = require('../data/testData/testDataOrganiser');

describe('generate trip sheet', function() {
  it('Takes a timetable array and generates a trip sheet from it', function() {
    const dummyData = testDataOrganiser('STOCK');
    const testTripSheet = timetableLogic.getTripSheet(dummyData.timetable);
    expect(testTripSheet.length).toBe(430);
  });
});

describe('get timetable details', function() {
  it('gets the timetable meta details for a service', function() {
    const dummyData = testDataOrganiser('STOCK');
    const testTimetable = dummyData.timetable;
    let serviceId = '2633';
    let kiwirailBoolean = false;
    let serviceDescription = 'HVL2018MTF 1040 UPHTT 1125 WGTNS ML';
    let timetabledetails = timetableLogic.getTimetableDetails(serviceId, testTimetable, kiwirailBoolean, serviceDescription);
    expect(timetabledetails.origin).toBe('UPPE');
    expect(timetabledetails.destination).toBe('WELL');
    expect(timetabledetails.blockId).toBe(23);
    expect(timetabledetails.line).toBe('HVL');
    expect(timetabledetails.timingPoints.length).toBe(17);

    serviceId = '648';
    kiwirailBoolean = true;
    serviceDescription = 'WELLINGTON-MASTERTON EXPRESS FREIGHT';
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
    let serviceDescription = 'WELLINGTON-MASTERTON EXPRESS FREIGHT';
    let originDesintation = timetableLogic.guessKiwiRailTimetableDetails(serviceDescription);
    expect(originDesintation[0]).toBe('WELL');
    expect(originDesintation[1]).toBe('MAST');

    serviceDescription = 'WELLINGTON-PALMERSTON NORTH EX FREIGHT';
    originDesintation = timetableLogic.guessKiwiRailTimetableDetails(serviceDescription);
    expect(originDesintation[0]).toBe('WELL');
    expect(originDesintation[1]).toBe('PALM');
  });
});

describe('get a list of services valid at a given time from a timetable', function() {
  it('gets an array of serviceId valid at a given time from a given timetable', function() {
    const dummyData = testDataOrganiser('STOCK');
    const testTimetable = dummyData.timetable;
    const time = dummyData.time;
    const serviceArray = timetableLogic.getValidServicesAtTime(testTimetable, time);
    expect(serviceArray.length).toBe(13);
    expect(typeof serviceArray[0]).toBe('string');
  });
});
