
const moment = require('moment-timezone');
moment().tz('Pacific/Auckland').format();
// supporting functions
const stationGeoboundaries = require('../data/stationGeoboundaries');
const stationMeterage = require('../data/stationMeterage');
const meterageCalculation = require('./meterageCalculation');
/**
 * represents a 'rail location'
 * @class Location
 */
class Location {
  /**
     *Creates an instance of Location.
     * @param {number} lat lattitude
     * @param {number} long longitude
     * @param {number} speed km/h
     * @param {number} compass bearing between 0 and 360 degrees
     * @param {number} meterage
     * @param {string} kiwirailLineId
     * @memberof Location
     */
  constructor(lat, long, speed, compass, meterage, kiwirailLineId) {
    this.lat = lat;
    this.long = long;
    this.speed = speed;
    this.compass = compass;
    this.meterage = meterage;
    this.kiwirailLineId = kiwirailLineId;
    this.closestStation = getClosestStation(lat, long);
    let tempLocation = {
      lat: lat,
      long: long,
      compass: compass,
      kiwirailLineId: this.closestStation.estimatedkiwirailLineId,
      meterage: meterage,
      estimatedDirection: '',
    };
    tempLocation = meterageCalculation.getmeterage(tempLocation);
    this.estimatedDirection = tempLocation.estimatedDirection;
    this.estimatedkiwirailLineId = this.closestStation.estimatedkiwirailLineId;
    this.estimatedMeterage = tempLocation.estimatedMeterage;
    /**
     * finds the closest station from raw lat and long
     * @param {number} lat
     * @param {number} long
     * @return {object} stationDetails Object
     */
    function getClosestStation(lat, long) {
      const thisLocation = {
        latitude: lat,
        longitude: long,
      };
      let closestStation = {
        stationId: '',
        latitude: 0,
        longitude: 0,
        stationDistance: 99999999999999,
        estimatedLine: '',
        estimatedMeterage: -1,
      };

      for (let st = 0; st < stationGeoboundaries.length; st++) {
        const queryStation = {
          stationId: stationGeoboundaries[st].stationId,
          latitude: (stationGeoboundaries[st].north + stationGeoboundaries[st].south) / 2,
          longitude: (stationGeoboundaries[st].east + stationGeoboundaries[st].west) / 2,
          stationDistance: 0,
          estimatedLine: '',
          estimatedMeterage: -1,
        };
        const estimatedLineMeterage = getEstimatedLineMeterage(stationGeoboundaries[st].stationId);
        queryStation.stationDistance = parseInt(distance(thisLocation, queryStation));
        queryStation.estimatedLine = estimatedLineMeterage[0];
        queryStation.estimatedMeterage = estimatedLineMeterage[1];
        if (queryStation.stationDistance < closestStation.stationDistance) {
          closestStation = queryStation;
        }
      }
      return closestStation;
      /**
      * Makes a best guess of the line the train is on based on nearest station
      * @param {string} nearestStationId
      * @return {array} line
      */
      function getEstimatedLineMeterage(nearestStationId) {
        let line;
        let meterage;
        if (nearestStationId != 'WELL'
                    && nearestStationId != 'KAIW'
                    && nearestStationId != 'NGAU') {
          for (let st = 0; st < stationMeterage.length; st++) {
            if (stationMeterage[st].station_id == nearestStationId) {
              line = stationMeterage[st].KRLine;
              meterage = stationMeterage[st].meterage;
            };
          };
        } else {
          line = '';
          meterage = 0;
        };
        return [line, meterage];
      };
      /**
    * gets distance in meters between 2 points
    * @param {object} position1 lat long pair
    * @param {object} position2 lat long pair
    * @return {number}  distance in meters between 2 points
    */
      function distance(position1, position2) {
        const lat1 = position1.latitude;
        const lat2 = position2.latitude;
        const lon1 = position1.longitude;
        const lon2 = position2.longitude;
        const R = 6371000; // radius of earth in metres
        const φ1 = lat1 * Math.PI / 180;
        const φ2 = lat2 * Math.PI / 180;
        const Δφ = (lat2 - lat1) * Math.PI / 180;
        const Δλ = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
                Math.cos(φ1) * Math.cos(φ2) *
                Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const d = R * c;
        return d;
      };
    }
  }
}

/**
 * represents a Train Vehicle, usually a EMU Car, Loco or Generator Carriage
 * @class Vehicle
 */
module.exports = class Vehicle {
  /**
       *Creates an instance of Unit.
       * @param {object} geVisVehicle
       * @memberof Vehicle
       */
  constructor(geVisVehicle) {
    this.vehicleId = geVisVehicle.VEHID;
    this.selcall = geVisVehicle.SELCALL;
    this.equipmentDescription = geVisVehicle.EQUIPDESC;
    this.location = new Location(
        geVisVehicle.LAT,
        geVisVehicle.LON,
        geVisVehicle.VEHSPD,
        geVisVehicle.VEHDIR,
        -1,
        '',
    );

    this.loadTime = moment(geVisVehicle.TIMESTMPGIS);
    this.positionTime = moment(geVisVehicle.TIMESTMPNZ);
    const locationAgeRAW = this.loadTime.diff(this.positionTime);
    this.locationAge = moment.utc(locationAgeRAW).format('mm:ss');
    this.locationAgeSeconds = Number(moment.utc(locationAgeRAW).valueOf() / 1000);
    this.serviceId = geVisVehicle.TRNID;
    this.serviceDescription = geVisVehicle.TRNDESCRP;
    this.varianceKiwirail = gevisvariancefix(geVisVehicle.DELAYTIME);
    let templinked;
    if (this.serviceId !== null) {
      templinked = true;
    } else {
      templinked = false;
    }
    this.linked = templinked;
    this.secondVehicleId = function() {
      //  if EMU, work out what the second half of the train unit is
      let secondCar = '';
      if (this.equipmentDescription == 'Matangi Power Car') {
        secondCar = 'FT' + this.vehicleId.substring(2, 6);
      } else if (this.equipmentDescription == 'Matangi Trailer Car') {
        secondCar = 'FP' + this.vehicleId.substring(2, 6);
      }
      return secondCar;
    };
    /**
         * Converts GeVis API schedule variance from negative is late to negative is early
         * @param {number} scheduleVariance
         * @return {number} corrected scheduleVariance
         */
    function gevisvariancefix(scheduleVariance) {
      let fixedvariance;
      if (scheduleVariance < 0) {
        fixedvariance = Math.abs(scheduleVariance);
      };
      if (scheduleVariance == 0) {
        fixedvariance = 0;
      };
      if (scheduleVariance > 0) {
        fixedvariance = 0 - scheduleVariance;
      };
      return fixedvariance;
    };
  }
};
