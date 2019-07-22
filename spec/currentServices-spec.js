/* eslint max-len: 0 */
const moment = require('moment-timezone');
moment().tz('Pacific/Auckland').format();
const getCurrentServices = require('../functions/currentServices');
const timetableLogic = require('../functions/timetableLogic');
const testDataOrganiser = require('../data/testData/testDataOrganiser');

describe('Service Constuctor Status Generation', function() {
  const dummyData = testDataOrganiser('20190722091137');
  const current = {
    timetable: dummyData.timetable,
    tripSheet: timetableLogic.getTripSheet(dummyData.timetable),
    rosterDuties: dummyData.rosterDuties,
    busReplacementList: dummyData.busReplacementList,
  };
  const currentServices = getCurrentServices(dummyData.geVisVehicles.features, current, dummyData.time);

  it('Correctly Identifies a service as Non-Metlink', function() {
    const train = currentServices.filter((service) => {
      return service.serviceId === '234M';
    });
    const Status = train[0].statusMessage;
    expect(Status).toBe('Non-Metlink Service');
  });

  it('Correctly Identifies a service as Bus Replaced', function() {
    const train = currentServices.filter((service) => {
      return service.serviceId === '9223';
    });
    const Status = train[0].statusMessage;
    expect(Status).toBe('Bus Replaced');
  });

  it('Correctly Identifies a service as Not Linked', function() {
    const train = currentServices.filter((service) => {
      return service.serviceId === '9224';
    });
    const Status = train[0].statusMessage;
    expect(Status).toBe('No Linked Unit');
  });

  // need to add in "Previous Service Delay" and "Arriving"

  it('Correctly Identifies a service as Running Early', function() {
    const train = currentServices.filter((service) => {
      return service.serviceId === '2628';
    });
    const Status = train[0].statusMessage;
    expect(Status).toBe('Running Early');
  });

  it('Correctly Identifies a service as Running Ok', function() {
    const train = currentServices.filter((service) => {
      return service.serviceId === '6226';
    });
    const Status = train[0].statusMessage;
    expect(Status).toBe('Running Ok');
  });

  it('Correctly Identifies a service as Running Late', function() {
    const train = currentServices.filter((service) => {
      return service.serviceId === '2621';
    });
    const Status = train[0].statusMessage;
    expect(Status).toBe('Running Late');
  });

  it('Correctly Identifies a service as Running Very Late', function() {
    const train = currentServices.filter((service) => {
      return service.serviceId === '6221';
    });
    const Status = train[0].statusMessage;
    expect(Status).toBe('Running Very Late');
  });

  // need to add in Delay Risk Tests

  it('Correctly Identifies a service as In the Rimutaka Tunnel', function() {
    const train = currentServices.filter((service) => {
      return service.serviceId === '1602';
    });
    const Status = train[0].statusMessage;
    expect(Status).toBe('In Rimutaka Tunnel');
  });

  it('Correctly Identifies a service as In the Tawa Tunnel', function() {
    const train = currentServices.filter((service) => {
      return service.serviceId === '6228';
    });
    const Status = train[0].statusMessage;
    expect(Status).toBe('In Tawa Tunnel');
  });

  it('Correctly Identifies a service as Stopped between stations', function() {
    const train = currentServices.filter((service) => {
      return service.serviceId === '6224';
    });
    const Status = train[0].statusMessage;
    expect(Status).toBe('Stopped between stations');
  });
});
