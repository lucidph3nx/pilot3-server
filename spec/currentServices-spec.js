/* eslint max-len: 0 */
const moment = require('moment-timezone');
moment().tz('Pacific/Auckland').format();
const getCurrentServices = require('../functions/currentServices');
const timetableLogic = require('../functions/timetableLogic');
const testDataOrganiser = require('../data/testData/testDataOrganiser');

describe('Service Constuctor status Generation', function() {
  const dummyData1 = testDataOrganiser('20190722091137');
  const current1 = {
    timetable: dummyData1.timetable,
    geVisVehicles: dummyData1.geVisVehicles,
    tripSheet: timetableLogic.getTripSheet(dummyData1.timetable),
    rosterDuties: dummyData1.rosterDuties,
    busReplacementList: dummyData1.busReplacementList,
  };
  const currentServices1 = getCurrentServices(dummyData1.geVisVehicles.features, current1, dummyData1.time);

  const dummyData2 = testDataOrganiser('20190723082606');
  const current2 = {
    timetable: dummyData2.timetable,
    geVisVehicles: dummyData2.geVisVehicles,
    tripSheet: timetableLogic.getTripSheet(dummyData2.timetable),
    rosterDuties: dummyData2.rosterDuties,
    busReplacementList: dummyData2.busReplacementList,
  };
  const currentServices2 = getCurrentServices(dummyData2.geVisVehicles.features, current2, dummyData2.time);

  it('Correctly Identifies a service as Non-Metlink', function() {
    const train = currentServices1.filter((service) => {
      return service.serviceId === '234M';
    });
    const status = train[0].statusMessage;
    expect(status).toBe('Non-Metlink Service');
  });

  it('Correctly Identifies a service as Bus Replaced', function() {
    const train = currentServices1.filter((service) => {
      return service.serviceId === '9223';
    });
    const status = train[0].statusMessage;
    expect(status).toBe('Bus Replaced');
  });

  it('Correctly Identifies a service as Not Linked', function() {
    const train = currentServices2.filter((service) => {
      return service.serviceId === '6222';
    });
    const status = train[0].statusMessage;
    expect(status).toBe('No Linked Unit');
  });

  it('Correctly Identifies a service as Previous Service Delay where previous service exists and is late', function() {
    const train = currentServices2.filter((service) => {
      return service.serviceId === '9217';
    });
    const status = train[0].statusMessage;
    expect(status).toBe('Previous Service Delayed');
  });

  it('Correctly Identifies a service as Arriving when already at its desination station', function() {
    const train = currentServices2.filter((service) => {
      return service.serviceId === '9215';
    });
    const status = train[0].statusMessage;
    expect(status).toBe('Arriving');
  });

  it('Correctly Identifies a service as Running Early', function() {
    const train = currentServices1.filter((service) => {
      return service.serviceId === '2628';
    });
    const status = train[0].statusMessage;
    expect(status).toBe('Running Early');
  });

  it('Correctly Identifies a service as Running Ok', function() {
    const train = currentServices1.filter((service) => {
      return service.serviceId === '6226';
    });
    const status = train[0].statusMessage;
    expect(status).toBe('Running Ok');
  });

  it('Correctly Identifies a service as Running Late', function() {
    const train = currentServices2.filter((service) => {
      return service.serviceId === '6224';
    });
    const status = train[0].statusMessage;
    expect(status).toBe('Running Late');
  });

  it('Correctly Identifies a service as Running Very Late', function() {
    const train = currentServices1.filter((service) => {
      return service.serviceId === '6221';
    });
    const status = train[0].statusMessage;
    expect(status).toBe('Running Very Late');
  });

  it('Correctly Identifies a service as a Delay Risk', function() {
    const train = currentServices1.filter((service) => {
      return service.serviceId === '2626';
    });
    const status = train[0].statusMessage;
    expect(status).toBe('Delay Risk: Train LE TM');
  });

  it('Correctly Identifies a service as In the Rimutaka Tunnel', function() {
    const train = currentServices1.filter((service) => {
      return service.serviceId === '1602';
    });
    const status = train[0].statusMessage;
    expect(status).toBe('In Rimutaka Tunnel');
  });

  it('Correctly Identifies a service as In the Tawa Tunnel', function() {
    const train = currentServices1.filter((service) => {
      return service.serviceId === '6228';
    });
    const status = train[0].statusMessage;
    expect(status).toBe('In Tawa Tunnel');
  });

  it('Correctly Identifies a service as Awaiting departure', function() {
    const train = currentServices2.filter((service) => {
      return service.serviceId === '2624';
    });
    const status = train[0].statusMessage;
    expect(status).toBe('Awaiting Departure');
  });

  it('Correctly Identifies a service as GPS Tracking Fault', function() {
    const train = currentServices1.filter((service) => {
      return service.serviceId === '2624';
    });
    const status = train[0].statusMessage;
    expect(status).toBe('GPS Fault');
  });
  it('Correctly Identifies a service as OMS Tracking Fault', function() {
    const train = currentServices2.filter((service) => {
      return service.serviceId === 'PL10';
    });
    const status = train[0].statusMessage;
    expect(status).toBe('Check OMS Linking');
  });

  it('Correctly Identifies a service in the TAITA storage road', function() {
    const train = currentServices2.filter((service) => {
      return service.serviceId === '4613';
    });
    const status = train[0].statusMessage;
    expect(status).toBe('In Storage Road');
  });

  it('Correctly Identifies a service in the WAIKANAE Turnback', function() {
    const train = currentServices2.filter((service) => {
      return service.serviceId === '6219';
    });
    const status = train[0].statusMessage;
    expect(status).toBe('In Turn Back Road');
  });

  it('Correctly Identifies a service as Stopped between stations', function() {
    const train = currentServices1.filter((service) => {
      return service.serviceId === '6224';
    });
    const status = train[0].statusMessage;
    expect(status).toBe('Stopped between stations');
  });
});
