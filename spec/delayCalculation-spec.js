/* eslint-disable max-len */
const moment = require('moment-timezone');
moment().tz('Pacific/Auckland').format();
const delayCalculation = require('../functions/delayCalculation');

describe('Get Schedule Variance', function() {
  it('the function takes location, time and timetable information and works out current minutes late/early', function() {
    const kiwirailBoolean = false;
    const direction = 'DOWN';
    const timetableDetails = {
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
    const location = {
      lat: -41.246437,
      long: 174.774517,
      speed: 0.1,
      compass: 0, // for the purposes of this test.
      meterage: 5985,
      kiwirailLineId: '',
      estimatedDirection: '',
    };
    let locationAge = 17;
    const currentTime = moment(); // '2019-07-03T00:41:35.000Z'
    currentTime.set('hour', 12);
    currentTime.set('minute', 41);
    currentTime.set('second', 35);
    currentTime.set('miliseconds', 0);
    let value = delayCalculation.getScheduleVariance(kiwirailBoolean, currentTime, direction, timetableDetails, location, locationAge);
    expect(value.delay).toBe('1');
    expect(value.delayFriendly).toBe('01:25');

    locationAge = 15;
    currentTime.set('hour', 12);
    currentTime.set('minute', 41);
    currentTime.set('second', 55);
    currentTime.set('miliseconds', 0);
    value = delayCalculation.getScheduleVariance(kiwirailBoolean, currentTime, direction, timetableDetails, location, locationAge);
    expect(value.delay).toBe('2');
    expect(value.delayFriendly).toBe('01:47');

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
    };
  });
});
