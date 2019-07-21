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
});
