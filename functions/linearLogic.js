const nzRailConventions = require('../Data/nzRailConventions');
const serviceIdlineAssociations = nzRailConventions.serviceIdlineAssociations;
const lineNamesMetlinkKiwirail = nzRailConventions.lineNamesMetlinkKiwirail;
const stationGeoboundaries = require('../data/stationGeoboundaries');
const stationMeterage = require('../data/stationMeterage');
const lineshapes = require('../Data/lineshapes');

module.exports = {
  /**
 * Takes a metlink line and coverts it to
 * the corresponding Kiwirail line
 * @param {string} metlinkLineId
 * @return {string} - KiwiRail Line
 */
  convertMetlinkLinetoKiwirailLine: function(metlinkLineId) {
    let kiwirailLineId = '';
    if (lineNamesMetlinkKiwirail.has(metlinkLineId)) {
      kiwirailLineId = lineNamesMetlinkKiwirail.get(metlinkLineId);
    }
    return kiwirailLineId;
  },
  /**
 * Takes a Kiwirail line and coverts it to
 * the corresponding metlink line
 * @param {string} kiwirailLineId
 * @return {string} - metlink Line
 */
  convertKiwirailLinetoMetlinkLine: function(kiwirailLineId) {
    let metlinkLineId = '';
    for (const [key, value] of lineNamesMetlinkKiwirail.entries()) {
      if (value == kiwirailLineId) {
        metlinkLineId = key;
      };
    };
    return metlinkLineId;
  },
  /**
 * Takes a serviceId and works out the operator
 * @param {string} serviceId
 * @return {string} - operator
 */
  getOperatorFromServiceId: function(serviceId) {
    let operator = '';
    let serviceIdPrefix = module.exports.getPrefixFromServiceId(serviceId);
    serviceIdPrefix = serviceIdPrefix.padStart(2, '0');

    if (serviceIdlineAssociations.has(serviceIdPrefix)) {
      operator = serviceIdlineAssociations.get(serviceIdPrefix).operator;
    }
    return operator;
  },
  /**
   * Takes a serviceId and works out the operator
   * @param {string} serviceId
   * @return {string} - operator
   */
  getKiwirailLineFromServiceId: function(serviceId) {
    let kiwirailLine = '';
    let serviceIdPrefix = module.exports.getPrefixFromServiceId(serviceId);
    serviceIdPrefix = serviceIdPrefix.padStart(2, '0');

    if (serviceIdlineAssociations.has(serviceIdPrefix)) {
      kiwirailLine = serviceIdlineAssociations.get(serviceIdPrefix).kiwirailLineId;
    }
    return kiwirailLine;
  },
  /**
 * Takes a serviceId and works out the applicable prefix
 * @param {string} serviceId
 * @return {string} - serviceIdPrefix
 */
  getPrefixFromServiceId: function(serviceId) {
    const numcharId = module.exports.convertToNumChar(serviceId);
    // look for service id's with a random letter on the end
    // treat as a 3 digit
    if (numcharId == 'NNNC') {
      serviceId = serviceId.substring(0, 3);
    }
    let serviceIdPrefix = '';
    switch (numcharId) {
      case 'CNN':
      case 'NNNC':
      case 'NNN':
        serviceIdPrefix = serviceId.substring(0, 1);
        break;
      case 'NNNN':
      case 'CCNN':
      case 'CCN':
        serviceIdPrefix = serviceId.substring(0, 2);
    };
    return serviceIdPrefix;
  },
  /**
 * Takes a serviceId and works out the applicable suffix
 * @param {string} serviceId
 * @return {string} - serviceIdSuffix
 */
  getSuffixFromServiceId: function(serviceId) {
    const numcharId = module.exports.convertToNumChar(serviceId);
    // look for service id's with a random letter on the end
    // treat as a 3 digit
    if (numcharId == 'NNNC') {
      serviceId = serviceId.substring(0, 3);
    }
    // return last digit
    const serviceIdSuffix = serviceId[serviceId.length - 1];
    return serviceIdSuffix;
  },
  /**
 * gets the Direction based on the serviceId
 * @param {string} serviceId
 * @return {string} direction 'UP' or 'DOWN"
 */
  getDirectionFromId: function(serviceId) {
    let direction = '';
    const serviceIdSuffix = module.exports.getSuffixFromServiceId(serviceId);
    // Odd = 'DOWN' and Even = 'UP'
    if (serviceIdSuffix % 2 == 0) {
      direction = 'UP';
    } else {
      direction = 'DOWN';
    };
    return direction;
  },
  /**
 * gets the Metlink line Id based on the serviceId
 * @param {string} serviceId
 * @return {string} metlinkLineId
 */
  getMetlinkLineFromId: function(serviceId) {
    let metlinkLineId = '';
    let serviceIdPrefix = module.exports.getPrefixFromServiceId(serviceId);
    serviceIdPrefix = serviceIdPrefix.padStart(2, '0');

    if (serviceIdlineAssociations.has(serviceIdPrefix)) {
      metlinkLineId = serviceIdlineAssociations.get(serviceIdPrefix).metlinkLineId;
    }
    return metlinkLineId;
  },
  /**
 * converts service ID into a numchar format
 * each digit is C for char or N for number
 * @param {string} text
 * @return {string} numchar
 */
  convertToNumChar: function(text) {
    let numchar = '';
    for (let p = 0; p < text.length; p++) {
      if (isNaN(text[p])) {
        numchar = numchar + 'C';
      } else {
        numchar = numchar + 'N';
      };
    };
    return numchar;
  },
  /**
 * checks if a location seems to be closest
 * to the correct linked line
 * @param {object} location object
 * @return {boolean} - false if seems to be wrong line
 */
  checkCorrectLine: function(location) {
    if (location.kiwirailLineId == '') {
      return true;
    };
    const distanceBetween2Points = module.exports.distanceBetween2Points;
    let correctLine = true;
    const thislocation = {
      latitude: location.lat,
      longitude: location.long,
    };
    const kiwirailLineId = location.kiwirailLineId;
    // defaults to the first of either
    const thisline = lineshapes.filter((lineshapes) => lineshapes.lineId == kiwirailLineId);
    const otherLine = lineshapes.filter((lineshapes) => lineshapes.lineId !== kiwirailLineId);
    let closestPointThisLine = thisline[0];
    let closestPointOtherLine = otherLine[0];
    for (i = 0; i < thisline.length; i++) {
      const distanceClosest = distanceBetween2Points(closestPointThisLine, thislocation);
      const distanceThis = distanceBetween2Points(thisline[i], thislocation);
      if (distanceThis < distanceClosest) {
        closestPointThisLine = thisline[i];
      }
    }
    for (i = 0; i < otherLine.length; i++) {
      const distanceClosest = distanceBetween2Points(closestPointOtherLine, thislocation);
      const distanceThis = distanceBetween2Points(otherLine[i], thislocation);
      if (distanceThis < distanceClosest) {
        closestPointOtherLine = otherLine[i];
      }
    }
    const distanceThisLine = distanceBetween2Points(closestPointThisLine, thislocation);
    const distanceOtherLine = distanceBetween2Points(closestPointOtherLine, thislocation);
    const buffer = 300; // 300m
    // is the closest point on another line closer than this line, with a buffer to prefer this line
    if (distanceThisLine > (distanceOtherLine + buffer)) {
      correctLine = false;
    }
    return correctLine;
  },
  distanceBetween2Points: function(position1, position2) {
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
  },
  /** looks at location on line and works out
   *  given the direction,
   *  what the previous station would be
   *  and if location is current Station
   * @param {Object} location - location object
   * @return {object} - last Station Details
   */
  getlaststationDetails: function(location) {
    // default blank response
    const lastStation = {
      stationId: '',
      stationCurrent: false,
    };
    // abort sequence for invalid meterages
    if (location.meterage === -1) {
      return lastStation;
    }
    // checks lat long for current stations first
    for (let j = 0; j < stationGeoboundaries.length; j++) {
      const withinBoundary = (
        location.long > stationGeoboundaries[j].west
        && location.long < stationGeoboundaries[j].east
        && location.lat < stationGeoboundaries[j].north
        && location.lat > stationGeoboundaries[j].south);
      if (withinBoundary) {
        lastStation.stationId = stationGeoboundaries[j].station_id;
        lastStation.stationCurrent = true;
        break;
      }
    };
    // works out last station based on line, direction and meterage
    if (!lastStation.stationCurrent) {
      // eslint-disable-next-line max-len
      let filteredStationMeterage = stationMeterage.filter((stationMeterage) => stationMeterage.kiwirailLineId == location.kiwirailLineId);
      if (location.direction == 'DOWN') {
        filteredStationMeterage = filteredStationMeterage.reverse();
      };
      for (let m = 0; m < filteredStationMeterage.length; m++) {
        const prevStn = filteredStationMeterage[m];
        const station = filteredStationMeterage[m+1];
        // loop until past meterage then use last station
        if (location.direction == 'DOWN') {
          if (station.meterage <= location.meterage) {
            lastStation.stationId = prevStn.stationId;
            break;
          }
        } else {
          if (station.meterage >= location.meterage) {
            lastStation.stationId = prevStn.stationId;
            break;
          }
        }
      }
    };
    return lastStation;
  },
};
