/**
 * represents a EMU Unit, designed for Matangi in Wellington
 * @class Unit
 */
module.exports = class Unit {
  /**
     *Creates an instance of Unit.
     * @param {object} powerCar vehicle object
     * @param {object} trailerCar vehicle object
     * @memberof Unit
     */
  constructor(powerCar, trailerCar) {
    if (powerCar !== undefined) {
      this.unitId = powerCar.vehicleId.substring(2, 6);
    } else {
      this.unitId = trailerCar.vehicleId.substring(2, 6);
    }
    this.FP = powerCar;
    this.FT = trailerCar;
    this.linkedCar = '';
    this.linkedServiceId = '';
    // work out which car is linked to a service, if any
    if (this.FP !== undefined && this.FP.linkedServiceId !== '') {
      this.linkedServiceId = this.FP.linkedServiceId;
      this.linkedCar = 'FP';
    } else if (this.FT.linkedServiceId !== '') {
      this.linkedServiceId = this.FT.linkedServiceId;
      this.linkedCar = 'FP';
    } else {
      this.linkedServiceId = '';
      this.linkedCar = '';
    }
    // if trailer is linked use it, else just use the power car
    if (this.linkedCar == 'FT' || this.FP == undefined) {
      this.speed = this.FT.location.speed;
      this.line = this.FT.location.estimatedkiwirailLineId;
      this.meterage = this.FT.location.estimatedMeterage;
      this.direction = this.FT.location.estimatedDirection;
      this.closestStationId = this.FT.location.closestStation.stationId;
    } else {
      this.speed = this.FP.location.speed;
      this.line = this.FP.location.estimatedkiwirailLineId;
      this.meterage = this.FP.location.estimatedMeterage;
      this.direction = this.FP.location.estimatedDirection;
      this.closestStationId = this.FP.location.closestStation.stationId;
    }
  }
  /**
   * generates a slim version of service for transmission over web
   * this is the legacy version to work with the old client
   * @return {object} service object
   */
  webLegacy() {
    const unitLite = {
      unitId: this.unitId,
      linkedServiceId: this.linkedServiceId || '',
      speed: this.speed || -1,
      line: this.line || '???',
      meterage: this.meterage || -1,
      direction: this.direction || '?',
      closestStation: this.closestStationId || '',
      FP: this.FP != undefined ? this.FP.webLegacy() : '',
      FT: this.FT != undefined ? this.FT.webLegacy() : '',
    };
    return unitLite;
  }
};
