const meterageCalculation = require('../functions/meterageCalculation');

describe('Get Meterage of GPS Coordinate', function() {
    it('uses line shapes to work out what the approximate meterage is for a GSP coordinate', function() {
        let location = {
            lat: -41.092655,
            long: 174.867612,
            speed: 49, // not used in this test
            compass: 314.6,
            meterage: -1,
            kiwirailLineId: 'NIMT',
            estimatedDirection: '',
        };
        let value = meterageCalculation.getmeterage(location);
        expect(value.meterage).toBe(23428);
        expect(value.estimatedDirection).toBe('UP');

        location = {
            lat: -41.220843,
            long: 174.895697,
            speed: 67.1, // not used in this test
            compass: 93.3,
            meterage: -1,
            kiwirailLineId: 'WRAPA',
            estimatedDirection: '',
        };
        value = meterageCalculation.getmeterage(location);
        expect(value.meterage).toBe(12828);
        expect(value.estimatedDirection).toBe('UP');

        location.compass = 273.2; // flip direction
        value = meterageCalculation.getmeterage(location);
        expect(value.meterage).toBe(12828);
        expect(value.estimatedDirection).toBe('DOWN');
    });
});
