/* eslint-disable no-undef */
/* eslint-disable max-len */
const moment = require('moment-timezone');
moment().tz('Pacific/Auckland').format();
const delayCalculation = require('../functions/delayCalculation');

describe('Get Schedule Variance', function() {
  it('the function takes location, time and timetable information and works out current minutes late/early', function() {
    const kiwirailBoolean = false;
    const direction = 'DOWN';
    let timetableDetails = {
      serviceId: '9237',
      consist: 'EMU2',
      blockId: 4,
      line: 'JVL',
      direction: 'DOWN',
      timingPoints: [
        {serviceId: '9237', line: 'JVL', direction: 'D', blockId: '4', consist: 'D', arrives: cps2m('123000'), departs: cps2m('123000'), station: 'JOHN', stationSequence: 0},
        {serviceId: '9237', line: 'JVL', direction: 'D', blockId: '4', consist: 'D', arrives: cps2m('123200'), departs: cps2m('123200'), station: 'RARO', stationSequence: 1},
        {serviceId: '9237', line: 'JVL', direction: 'D', blockId: '4', consist: 'D', arrives: cps2m('123500'), departs: cps2m('123500'), station: 'KHAN', stationSequence: 2},
        {serviceId: '9237', line: 'JVL', direction: 'D', blockId: '4', consist: 'D', arrives: cps2m('123700'), departs: cps2m('123700'), station: 'BOXH', stationSequence: 3},
        {serviceId: '9237', line: 'JVL', direction: 'D', blockId: '4', consist: 'D', arrives: cps2m('123800'), departs: cps2m('123800'), station: 'SIML', stationSequence: 4},
        {serviceId: '9237', line: 'JVL', direction: 'D', blockId: '4', consist: 'D', arrives: cps2m('124000'), departs: cps2m('124000'), station: 'AWAR', stationSequence: 5},
        {serviceId: '9237', line: 'JVL', direction: 'D', blockId: '4', consist: 'D', arrives: cps2m('124200'), departs: cps2m('124200'), station: 'NGAI', stationSequence: 6},
        {serviceId: '9237', line: 'JVL', direction: 'D', blockId: '4', consist: 'D', arrives: cps2m('124400'), departs: cps2m('124400'), station: 'CROF', stationSequence: 7},
        {serviceId: '9237', line: 'JVL', direction: 'D', blockId: '4', consist: 'D', arrives: cps2m('125300'), departs: cps2m('125300'), station: 'WELL', stationSequence: 8},
      ],
      origin: 'JOHN',
      departs: '12:30',
      destination: 'WELL',
      arrives: '12:53',
    };
    let location = {
      lat: -41.246437,
      long: 174.774517,
      speed: 0.1,
      compass: 0, // for the purposes of this test.
      meterage: 5985,
      kiwirailLineId: '',
      estimatedDirection: '',
    };
    let locationAge = 17;
    const currentTime = moment();
    currentTime.set('hour', 12);
    currentTime.set('minute', 41);
    currentTime.set('second', 35);
    currentTime.set('miliseconds', 0);
    let value = delayCalculation.getScheduleVariance(kiwirailBoolean, currentTime, direction, timetableDetails, location, locationAge);
    expect(value.delay).toBe(1);
    expect(value.delayFriendly).toBe('01:12');

    locationAge = 15;
    currentTime.set('hour', 12);
    currentTime.set('minute', 41);
    currentTime.set('second', 55);
    currentTime.set('miliseconds', 0);
    value = delayCalculation.getScheduleVariance(kiwirailBoolean, currentTime, direction, timetableDetails, location, locationAge);
    expect(value.delay).toBe(2);
    expect(value.delayFriendly).toBe('01:34');


    timetableDetails = {
      serviceId: '2631',
      consist: 'EMU6',
      blockId: 80,
      line: 'HVL',
      direction: 'DOWN',
      timingPoints: [
        {'serviceId': '2631', 'line': 'HVL', 'direction': 'D', 'blockId': 80, 'consist': 'EMU6', 'arrives': cps2m('102000'), 'departs': cps2m('102000'), 'station': 'UPPE', 'stationSequence': 0, 'dayType': 5},
        {'serviceId': '2631', 'line': 'HVL', 'direction': 'D', 'blockId': 80, 'consist': 'EMU6', 'arrives': cps2m('102200'), 'departs': cps2m('102200'), 'station': 'WALL', 'stationSequence': 1, 'dayType': 5},
        {'serviceId': '2631', 'line': 'HVL', 'direction': 'D', 'blockId': 80, 'consist': 'EMU6', 'arrives': cps2m('102500'), 'departs': cps2m('102500'), 'station': 'TREN', 'stationSequence': 2, 'dayType': 5},
        {'serviceId': '2631', 'line': 'HVL', 'direction': 'D', 'blockId': 80, 'consist': 'EMU6', 'arrives': cps2m('102700'), 'departs': cps2m('102700'), 'station': 'HERE', 'stationSequence': 3, 'dayType': 5},
        {'serviceId': '2631', 'line': 'HVL', 'direction': 'D', 'blockId': 80, 'consist': 'EMU6', 'arrives': cps2m('102900'), 'departs': cps2m('102900'), 'station': 'SILV', 'stationSequence': 4, 'dayType': 5},
        {'serviceId': '2631', 'line': 'HVL', 'direction': 'D', 'blockId': 80, 'consist': 'EMU6', 'arrives': cps2m('103200'), 'departs': cps2m('103200'), 'station': 'MANO', 'stationSequence': 5, 'dayType': 5},
        {'serviceId': '2631', 'line': 'HVL', 'direction': 'D', 'blockId': 80, 'consist': 'EMU6', 'arrives': cps2m('103400'), 'departs': cps2m('103400'), 'station': 'POMA', 'stationSequence': 6, 'dayType': 5},
        {'serviceId': '2631', 'line': 'HVL', 'direction': 'D', 'blockId': 80, 'consist': 'EMU6', 'arrives': cps2m('103600'), 'departs': cps2m('103600'), 'station': 'TAIT', 'stationSequence': 7, 'dayType': 5},
        {'serviceId': '2631', 'line': 'HVL', 'direction': 'D', 'blockId': 80, 'consist': 'EMU6', 'arrives': cps2m('103900'), 'departs': cps2m('103900'), 'station': 'WING', 'stationSequence': 8, 'dayType': 5},
        {'serviceId': '2631', 'line': 'HVL', 'direction': 'D', 'blockId': 80, 'consist': 'EMU6', 'arrives': cps2m('104100'), 'departs': cps2m('104100'), 'station': 'NAEN', 'stationSequence': 9, 'dayType': 5},
        {'serviceId': '2631', 'line': 'HVL', 'direction': 'D', 'blockId': 80, 'consist': 'EMU6', 'arrives': cps2m('104300'), 'departs': cps2m('104300'), 'station': 'EPUN', 'stationSequence': 10, 'dayType': 5},
        {'serviceId': '2631', 'line': 'HVL', 'direction': 'D', 'blockId': 80, 'consist': 'EMU6', 'arrives': cps2m('104500'), 'departs': cps2m('104500'), 'station': 'WATE', 'stationSequence': 11, 'dayType': 5},
        {'serviceId': '2631', 'line': 'HVL', 'direction': 'D', 'blockId': 80, 'consist': 'EMU6', 'arrives': cps2m('104800'), 'departs': cps2m('104800'), 'station': 'WOBU', 'stationSequence': 12, 'dayType': 5},
        {'serviceId': '2631', 'line': 'HVL', 'direction': 'D', 'blockId': 80, 'consist': 'EMU6', 'arrives': cps2m('105100'), 'departs': cps2m('105100'), 'station': 'AVA', 'stationSequence': 13, 'dayType': 5},
        {'serviceId': '2631', 'line': 'HVL', 'direction': 'D', 'blockId': 80, 'consist': 'EMU6', 'arrives': cps2m('105300'), 'departs': cps2m('105300'), 'station': 'PETO', 'stationSequence': 14, 'dayType': 5},
        {'serviceId': '2631', 'line': 'HVL', 'direction': 'D', 'blockId': 80, 'consist': 'EMU6', 'arrives': cps2m('105900'), 'departs': cps2m('105900'), 'station': 'NGAU', 'stationSequence': 15, 'dayType': 5},
        {'serviceId': '2631', 'line': 'HVL', 'direction': 'D', 'blockId': 80, 'consist': 'EMU6', 'arrives': cps2m('110500'), 'departs': cps2m('110500'), 'station': 'WELL', 'stationSequence': 16, 'dayType': 5},
      ],
      origin: 'UPPE',
      departs: '10:20',
      destination: 'WELL',
      arrives: '11:05',
    };
    location = {
      lat: -41.222097,
      long: 174.909662,
      speed: 56.1,
      compass: 204.9, // for the purposes of this test.
      meterage: 14118,
      kiwirailLineId: '',
      estimatedDirection: '',
    };
    locationAge = 9;
    currentTime.set('hour', 10);
    currentTime.set('minute', 50);
    currentTime.set('second', 48);
    currentTime.set('miliseconds', 0);
    value = delayCalculation.getScheduleVariance(kiwirailBoolean, currentTime, direction, timetableDetails, location, locationAge);
    expect(value.delay).toBe(2);
    expect(value.delayFriendly).toBe('02:14');
  });
});

describe('Gets the details of the next station for a train', function() {
  it('gets the next station correctly - Johnsonville Line Up Example', function() {
    const meterage = 3039;
    const direction = 'UP';
    const timetableDetails = {
      timingPoints: [
        {'serviceId': '9228', 'line': 'JVL', 'direction': 'U', 'blockId': 4, 'consist': 'EMU2', 'arrives': cps2m('100200'), 'departs': cps2m('100200'), 'station': 'WELL', 'stationSequence': 0, 'dayType': 5},
        {'serviceId': '9228', 'line': 'JVL', 'direction': 'U', 'blockId': 4, 'consist': 'EMU2', 'arrives': cps2m('101000'), 'departs': cps2m('101000'), 'station': 'CROF', 'stationSequence': 1, 'dayType': 5},
        {'serviceId': '9228', 'line': 'JVL', 'direction': 'U', 'blockId': 4, 'consist': 'EMU2', 'arrives': cps2m('101200'), 'departs': cps2m('101200'), 'station': 'NGAI', 'stationSequence': 2, 'dayType': 5},
        {'serviceId': '9228', 'line': 'JVL', 'direction': 'U', 'blockId': 4, 'consist': 'EMU2', 'arrives': cps2m('101400'), 'departs': cps2m('101400'), 'station': 'AWAR', 'stationSequence': 3, 'dayType': 5},
        {'serviceId': '9228', 'line': 'JVL', 'direction': 'U', 'blockId': 4, 'consist': 'EMU2', 'arrives': cps2m('101600'), 'departs': cps2m('101600'), 'station': 'SIML', 'stationSequence': 4, 'dayType': 5},
        {'serviceId': '9228', 'line': 'JVL', 'direction': 'U', 'blockId': 4, 'consist': 'EMU2', 'arrives': cps2m('101700'), 'departs': cps2m('101700'), 'station': 'BOXH', 'stationSequence': 5, 'dayType': 5},
        {'serviceId': '9228', 'line': 'JVL', 'direction': 'U', 'blockId': 4, 'consist': 'EMU2', 'arrives': cps2m('102000'), 'departs': cps2m('102000'), 'station': 'KHAN', 'stationSequence': 6, 'dayType': 5},
        {'serviceId': '9228', 'line': 'JVL', 'direction': 'U', 'blockId': 4, 'consist': 'EMU2', 'arrives': cps2m('102300'), 'departs': cps2m('102300'), 'station': 'RARO', 'stationSequence': 7, 'dayType': 5},
        {'serviceId': '9228', 'line': 'JVL', 'direction': 'U', 'blockId': 4, 'consist': 'EMU2', 'arrives': cps2m('102500'), 'departs': cps2m('102500'), 'station': 'JOHN', 'stationSequence': 8, 'dayType': 5},
      ],
    };
    const stationDetails = delayCalculation.getNextStationDetails(meterage, direction, timetableDetails);
    expect(stationDetails.stationId).toBe('CROF');
    expect(stationDetails.meterage).toBe(4770);
    expect(stationDetails.time.format('HH:mm')).toBe('10:10');
  });
  it('gets the next station correctly - Hutt Valley Line Down Example', function() {
    const meterage = 14327;
    const direction = 'DOWN';
    const timetableDetails = {
      timingPoints: [
        {'serviceId': '2629', 'line': 'HVL', 'direction': 'D', 'blockId': 28, 'consist': 'EMU2', 'arrives': cps2m('100000'), 'departs': cps2m('100000'), 'station': 'UPPE', 'stationSequence': 0, 'dayType': 5},
        {'serviceId': '2629', 'line': 'HVL', 'direction': 'D', 'blockId': 28, 'consist': 'EMU2', 'arrives': cps2m('100200'), 'departs': cps2m('100200'), 'station': 'WALL', 'stationSequence': 1, 'dayType': 5},
        {'serviceId': '2629', 'line': 'HVL', 'direction': 'D', 'blockId': 28, 'consist': 'EMU2', 'arrives': cps2m('100500'), 'departs': cps2m('100500'), 'station': 'TREN', 'stationSequence': 2, 'dayType': 5},
        {'serviceId': '2629', 'line': 'HVL', 'direction': 'D', 'blockId': 28, 'consist': 'EMU2', 'arrives': cps2m('100700'), 'departs': cps2m('100700'), 'station': 'HERE', 'stationSequence': 3, 'dayType': 5},
        {'serviceId': '2629', 'line': 'HVL', 'direction': 'D', 'blockId': 28, 'consist': 'EMU2', 'arrives': cps2m('100900'), 'departs': cps2m('100900'), 'station': 'SILV', 'stationSequence': 4, 'dayType': 5},
        {'serviceId': '2629', 'line': 'HVL', 'direction': 'D', 'blockId': 28, 'consist': 'EMU2', 'arrives': cps2m('101200'), 'departs': cps2m('101200'), 'station': 'MANO', 'stationSequence': 5, 'dayType': 5},
        {'serviceId': '2629', 'line': 'HVL', 'direction': 'D', 'blockId': 28, 'consist': 'EMU2', 'arrives': cps2m('101400'), 'departs': cps2m('101400'), 'station': 'POMA', 'stationSequence': 6, 'dayType': 5},
        {'serviceId': '2629', 'line': 'HVL', 'direction': 'D', 'blockId': 28, 'consist': 'EMU2', 'arrives': cps2m('101600'), 'departs': cps2m('101600'), 'station': 'TAIT', 'stationSequence': 7, 'dayType': 5},
        {'serviceId': '2629', 'line': 'HVL', 'direction': 'D', 'blockId': 28, 'consist': 'EMU2', 'arrives': cps2m('101900'), 'departs': cps2m('101900'), 'station': 'WING', 'stationSequence': 8, 'dayType': 5},
        {'serviceId': '2629', 'line': 'HVL', 'direction': 'D', 'blockId': 28, 'consist': 'EMU2', 'arrives': cps2m('102100'), 'departs': cps2m('102100'), 'station': 'NAEN', 'stationSequence': 9, 'dayType': 5},
        {'serviceId': '2629', 'line': 'HVL', 'direction': 'D', 'blockId': 28, 'consist': 'EMU2', 'arrives': cps2m('102300'), 'departs': cps2m('102300'), 'station': 'EPUN', 'stationSequence': 10, 'dayType': 5},
        {'serviceId': '2629', 'line': 'HVL', 'direction': 'D', 'blockId': 28, 'consist': 'EMU2', 'arrives': cps2m('102500'), 'departs': cps2m('102500'), 'station': 'WATE', 'stationSequence': 11, 'dayType': 5},
        {'serviceId': '2629', 'line': 'HVL', 'direction': 'D', 'blockId': 28, 'consist': 'EMU2', 'arrives': cps2m('102800'), 'departs': cps2m('102800'), 'station': 'WOBU', 'stationSequence': 12, 'dayType': 5},
        {'serviceId': '2629', 'line': 'HVL', 'direction': 'D', 'blockId': 28, 'consist': 'EMU2', 'arrives': cps2m('103100'), 'departs': cps2m('103100'), 'station': 'AVA', 'stationSequence': 13, 'dayType': 5},
        {'serviceId': '2629', 'line': 'HVL', 'direction': 'D', 'blockId': 28, 'consist': 'EMU2', 'arrives': cps2m('103300'), 'departs': cps2m('103300'), 'station': 'PETO', 'stationSequence': 14, 'dayType': 5},
        {'serviceId': '2629', 'line': 'HVL', 'direction': 'D', 'blockId': 28, 'consist': 'EMU2', 'arrives': cps2m('103900'), 'departs': cps2m('103900'), 'station': 'NGAU', 'stationSequence': 15, 'dayType': 5},
        {'serviceId': '2629', 'line': 'HVL', 'direction': 'D', 'blockId': 28, 'consist': 'EMU2', 'arrives': cps2m('104500'), 'departs': cps2m('104500'), 'station': 'WELL', 'stationSequence': 16, 'dayType': 5},
      ],
    };
    stationDetails = delayCalculation.getNextStationDetails(meterage, direction, timetableDetails);
    expect(stationDetails.stationId).toBe('AVA');
    expect(stationDetails.meterage).toBe(12520);
    expect(stationDetails.time.format('HH:mm')).toBe('10:31');
  });
});

describe('Gets the details of the previous station for a train', function() {
  it('gets the previous station correctly - Johnsonville Line Up Example', function() {
    const meterage = 3039;
    const direction = 'UP';
    const timetableDetails = {
      timingPoints: [
        {'serviceId': '9228', 'line': 'JVL', 'direction': 'U', 'blockId': 4, 'consist': 'EMU2', 'arrives': cps2m('100200'), 'departs': cps2m('100200'), 'station': 'WELL', 'stationSequence': 0, 'dayType': 5},
        {'serviceId': '9228', 'line': 'JVL', 'direction': 'U', 'blockId': 4, 'consist': 'EMU2', 'arrives': cps2m('101000'), 'departs': cps2m('101000'), 'station': 'CROF', 'stationSequence': 1, 'dayType': 5},
        {'serviceId': '9228', 'line': 'JVL', 'direction': 'U', 'blockId': 4, 'consist': 'EMU2', 'arrives': cps2m('101200'), 'departs': cps2m('101200'), 'station': 'NGAI', 'stationSequence': 2, 'dayType': 5},
        {'serviceId': '9228', 'line': 'JVL', 'direction': 'U', 'blockId': 4, 'consist': 'EMU2', 'arrives': cps2m('101400'), 'departs': cps2m('101400'), 'station': 'AWAR', 'stationSequence': 3, 'dayType': 5},
        {'serviceId': '9228', 'line': 'JVL', 'direction': 'U', 'blockId': 4, 'consist': 'EMU2', 'arrives': cps2m('101600'), 'departs': cps2m('101600'), 'station': 'SIML', 'stationSequence': 4, 'dayType': 5},
        {'serviceId': '9228', 'line': 'JVL', 'direction': 'U', 'blockId': 4, 'consist': 'EMU2', 'arrives': cps2m('101700'), 'departs': cps2m('101700'), 'station': 'BOXH', 'stationSequence': 5, 'dayType': 5},
        {'serviceId': '9228', 'line': 'JVL', 'direction': 'U', 'blockId': 4, 'consist': 'EMU2', 'arrives': cps2m('102000'), 'departs': cps2m('102000'), 'station': 'KHAN', 'stationSequence': 6, 'dayType': 5},
        {'serviceId': '9228', 'line': 'JVL', 'direction': 'U', 'blockId': 4, 'consist': 'EMU2', 'arrives': cps2m('102300'), 'departs': cps2m('102300'), 'station': 'RARO', 'stationSequence': 7, 'dayType': 5},
        {'serviceId': '9228', 'line': 'JVL', 'direction': 'U', 'blockId': 4, 'consist': 'EMU2', 'arrives': cps2m('102500'), 'departs': cps2m('102500'), 'station': 'JOHN', 'stationSequence': 8, 'dayType': 5},
      ],
    };
    const stationDetails = delayCalculation.getPrevStationDetails(meterage, direction, timetableDetails);
    expect(stationDetails.stationId).toBe('WELL');
    expect(stationDetails.meterage).toBe(0);
    expect(stationDetails.time.format('HH:mm')).toBe('10:02');
  });
  it('gets the previous station correctly - Hutt Valley Line Down Example', function() {
    const meterage = 14327;
    const direction = 'DOWN';
    const timetableDetails = {
      timingPoints: [
        {'serviceId': '2629', 'line': 'HVL', 'direction': 'D', 'blockId': 28, 'consist': 'EMU2', 'arrives': cps2m('100000'), 'departs': cps2m('100000'), 'station': 'UPPE', 'stationSequence': 0, 'dayType': 5},
        {'serviceId': '2629', 'line': 'HVL', 'direction': 'D', 'blockId': 28, 'consist': 'EMU2', 'arrives': cps2m('100200'), 'departs': cps2m('100200'), 'station': 'WALL', 'stationSequence': 1, 'dayType': 5},
        {'serviceId': '2629', 'line': 'HVL', 'direction': 'D', 'blockId': 28, 'consist': 'EMU2', 'arrives': cps2m('100500'), 'departs': cps2m('100500'), 'station': 'TREN', 'stationSequence': 2, 'dayType': 5},
        {'serviceId': '2629', 'line': 'HVL', 'direction': 'D', 'blockId': 28, 'consist': 'EMU2', 'arrives': cps2m('100700'), 'departs': cps2m('100700'), 'station': 'HERE', 'stationSequence': 3, 'dayType': 5},
        {'serviceId': '2629', 'line': 'HVL', 'direction': 'D', 'blockId': 28, 'consist': 'EMU2', 'arrives': cps2m('100900'), 'departs': cps2m('100900'), 'station': 'SILV', 'stationSequence': 4, 'dayType': 5},
        {'serviceId': '2629', 'line': 'HVL', 'direction': 'D', 'blockId': 28, 'consist': 'EMU2', 'arrives': cps2m('101200'), 'departs': cps2m('101200'), 'station': 'MANO', 'stationSequence': 5, 'dayType': 5},
        {'serviceId': '2629', 'line': 'HVL', 'direction': 'D', 'blockId': 28, 'consist': 'EMU2', 'arrives': cps2m('101400'), 'departs': cps2m('101400'), 'station': 'POMA', 'stationSequence': 6, 'dayType': 5},
        {'serviceId': '2629', 'line': 'HVL', 'direction': 'D', 'blockId': 28, 'consist': 'EMU2', 'arrives': cps2m('101600'), 'departs': cps2m('101600'), 'station': 'TAIT', 'stationSequence': 7, 'dayType': 5},
        {'serviceId': '2629', 'line': 'HVL', 'direction': 'D', 'blockId': 28, 'consist': 'EMU2', 'arrives': cps2m('101900'), 'departs': cps2m('101900'), 'station': 'WING', 'stationSequence': 8, 'dayType': 5},
        {'serviceId': '2629', 'line': 'HVL', 'direction': 'D', 'blockId': 28, 'consist': 'EMU2', 'arrives': cps2m('102100'), 'departs': cps2m('102100'), 'station': 'NAEN', 'stationSequence': 9, 'dayType': 5},
        {'serviceId': '2629', 'line': 'HVL', 'direction': 'D', 'blockId': 28, 'consist': 'EMU2', 'arrives': cps2m('102300'), 'departs': cps2m('102300'), 'station': 'EPUN', 'stationSequence': 10, 'dayType': 5},
        {'serviceId': '2629', 'line': 'HVL', 'direction': 'D', 'blockId': 28, 'consist': 'EMU2', 'arrives': cps2m('102500'), 'departs': cps2m('102500'), 'station': 'WATE', 'stationSequence': 11, 'dayType': 5},
        {'serviceId': '2629', 'line': 'HVL', 'direction': 'D', 'blockId': 28, 'consist': 'EMU2', 'arrives': cps2m('102800'), 'departs': cps2m('102800'), 'station': 'WOBU', 'stationSequence': 12, 'dayType': 5},
        {'serviceId': '2629', 'line': 'HVL', 'direction': 'D', 'blockId': 28, 'consist': 'EMU2', 'arrives': cps2m('103100'), 'departs': cps2m('103100'), 'station': 'AVA', 'stationSequence': 13, 'dayType': 5},
        {'serviceId': '2629', 'line': 'HVL', 'direction': 'D', 'blockId': 28, 'consist': 'EMU2', 'arrives': cps2m('103300'), 'departs': cps2m('103300'), 'station': 'PETO', 'stationSequence': 14, 'dayType': 5},
        {'serviceId': '2629', 'line': 'HVL', 'direction': 'D', 'blockId': 28, 'consist': 'EMU2', 'arrives': cps2m('103900'), 'departs': cps2m('103900'), 'station': 'NGAU', 'stationSequence': 15, 'dayType': 5},
        {'serviceId': '2629', 'line': 'HVL', 'direction': 'D', 'blockId': 28, 'consist': 'EMU2', 'arrives': cps2m('104500'), 'departs': cps2m('104500'), 'station': 'WELL', 'stationSequence': 16, 'dayType': 5},
      ],
    };
    stationDetails = delayCalculation.getPrevStationDetails(meterage, direction, timetableDetails);
    expect(stationDetails.stationId).toBe('WOBU');
    expect(stationDetails.meterage).toBe(14370);
    expect(stationDetails.time.format('HH:mm')).toBe('10:28');
  });
});

describe('Gets the Meterage of any given station', function() {
  it('takes a 4 character stationId and returns the meterage', function() {
    let stationId = 'WELL';
    let meterage = delayCalculation.getMeterageOfStation(stationId);
    expect(meterage).toBe(0);
    stationId = 'PETO';
    meterage = delayCalculation.getMeterageOfStation(stationId);
    expect(meterage).toBe(10500);
    stationId = '';
    meterage = delayCalculation.getMeterageOfStation(stationId);
    expect(meterage).toBe(undefined);
    stationId = 'AUCK';
    meterage = delayCalculation.getMeterageOfStation(stationId);
    expect(meterage).toBe(682000);
  });
});


/**
* Takes a time Compass format
* Converts it into a moment object
* @param {string} compasstime
* @return {object} - Moment object
*/
function cps2m(compasstime) {
  const thisMoment = moment();
  // ordinary code
  thisMoment.set('hour', compasstime.substring(0, 2));
  thisMoment.set('minute', compasstime.substring(2, 4));
  thisMoment.set('second', compasstime.substring(4, 6));
  thisMoment.set('miliseconds', 0);
  return thisMoment;
}
