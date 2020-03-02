const moment = require('moment-timezone');
moment().tz('Pacific/Auckland').format();

// ======supporting functions=======
const getCurrentServices = require('../functions/currentServices');
const getCurrentUnitList = require('../functions/currentUnitList');
const timetableLogic = require('../functions/timetableLogic');

// =======API=======
let kiwirailAPI;
let maximoAPI;
let metserviceAPI;
let vdsRosterAPI;
let compassAPI;
let PilotSQLLog;
let puppeteerOps;
// only define the API modules if credentials file exists
const fs = require('fs');
const path = require('path');
const credentialPath = path.join(__dirname, '..', 'credentials.js');
if (fs.existsSync(credentialPath)) {
  kiwirailAPI = require('../api/kiwirailAPI');
  maximoAPI = require('../api/maximoAPI');
  metserviceAPI = require('../api/metserviceAPI');
  vdsRosterAPI = require('../api/vdsRosterAPI');
  compassAPI = require('../api/compassAPI');
  PilotSQLLog = require('../api/pilotSQLLog');
  puppeteerOps = require('../api/puppeteerOps');
}

// ======dummy data=======
const testDataOrganiser = require('../data/testData/testDataOrganiser');

/**
 * represents all current data for server
 * @class CurrentData
 */
module.exports = class CurrentData {
  /**
     *Creates an instance of CurrentData.
      * @param {object} functionFlags // behavior modification
      * @param {object} applicationSettings // settings
      * @param {object} alternativeToken // for use in development for speed
      * @memberof CurrentData
      */
  constructor(functionFlags, applicationSettings, alternativeToken) {
    this.functionFlags = functionFlags;
    this.applicationSettings = applicationSettings;
    // CurrentData status property
    this.status = {
      GEVIS: {
        message: '',
        updateTime: moment('1970-01-01'),
      },
      VDS: {
        message: '',
        updateTime: moment('1970-01-01'),
      },
      COMPASS: {
        message: '',
        updateTime: moment('1970-01-01'),
      },
      METSERVICE: {
        message: '',
        updateTime: moment('1970-01-01'),
      },
      MAXIMO: {
        message: '',
        updateTime: moment('1970-01-01'),
      },
    };
    // geVis token to get Vehciles from Kiwirail
    if (alternativeToken) {
      this.geVisToken = alternativeToken;
    } else {
      this.geVisToken = {
        token: undefined,
        updateTime: moment('1970-01-01'),
        pending: false,
      };
    }
    this.maximoTokens = {
      token: undefined,
      updateTime: moment('1970-01-01'),
      pending: false,
    };
    this.creationTime = moment();
    this.geVisVehicles = [];
    this.runningServices = [];
    this.unitList = [];
    this.carList = [];
    this.NISList = {
      list: [],
      updated: moment('1970-01-01'),
    };
    this.rosterDuties = [];
    this.rosterDutiesLastUpdated = moment('1970-01-01');
    this.rosterDayStatus = [];
    this.rosterStatusLastUpdated = moment('1970-01-01');
    this.staffList = [];
    this.timetable = [];
    this.tripSheet = [];
    this.timetableLastUpdated = moment('1970-01-01');
    this.busReplacementList = [];
    this.busReplacementsLastUpdated = moment('1970-01-01');
    this.weatherObservations = [];
    this.weatherObservationsLastUpdated = moment('1970-01-01');
  }
  /**
   * checks GeVis, VDS and Compass
   * updates status
   */
  checkResourceStatus() {
    const fullDebugMode = this.functionFlags.fullDebugMode;
    if (!fullDebugMode) {
      kiwirailAPI.checkAPI(this.geVisToken.token).then((result) => {
        this.status.GEVIS.message = result;
        this.status.GEVIS.updateTime = moment();
      });
      vdsRosterAPI.checkVDSDBConnection().then((result) => {
        this.status.VDS.message = result;
        this.status.VDS.updateTime = moment();
      });
      compassAPI.checkCompassDBConnection().then((result) => {
        this.status.COMPASS.message = result;
        this.status.COMPASS.updateTime = moment();
      });
      metserviceAPI.checkAPI().then((result) => {
        this.status.METSERVICE.message = result;
        this.status.METSERVICE.updateTime = moment();
      });
      maximoAPI.checkAPI(this.maximoTokens).then((result) => {
        this.status.MAXIMO.message = result;
        this.status.MAXIMO.updateTime = moment();
      });
    }
  }
  /**
   * checks to see if the current geVis token is valid
   * if full debug it just returns true
   * @return {boolean} valid or not
   */
  tokenValid() {
    const fullDebugMode = this.functionFlags.fullDebugMode;
    const lifespan = this.applicationSettings.tokenLifespan;
    if (fullDebugMode) {
      return true;
    }
    if (this.geVisToken.token == undefined ||
      this.geVisToken.updateTime < moment().subtract(lifespan, 'minutes')) {
      return false;
    } else {
      return true;
    }
  }
  /**
   * checks to see if the current Maximo token is valid
   * if full debug it just returns true
   * @return {boolean} valid or not
   */
  maximoTokenValid() {
    const fullDebugMode = this.functionFlags.fullDebugMode;
    const lifespan = this.applicationSettings.maximoTokenLifespan;
    if (fullDebugMode) {
      return true;
    }
    if (this.maximoTokens.token == undefined ||
      this.maximoTokens.updateTime < moment().subtract(lifespan, 'minutes')) {
      return false;
    } else {
      return true;
    }
  }
  /**
   * checks if NIS List is valid
   * and up to date
   * @return {boolean} valid or not
   */
  listNISValid() {
    const lifespan = this.applicationSettings.NISListLifespan;
    const uptoDate = (this.NISList.updated > moment().subtract(lifespan, 'minutes'));
    const empty = (this.NISList.list.length == 0);
    if (uptoDate & !empty) {
      return true;
    } else {
      return false;
    }
  }
  /**
   * updates the geVis token using puppeteer
   */
  updateToken() {
    const fullDebugMode = this.functionFlags.fullDebugMode;
    const tokenPending = this.geVisToken.pending;
    if (!fullDebugMode && !tokenPending) {
      // get new token using puppeteer
      this.geVisToken.pending = true;
      this.pilotLog('GeVis Auth Token Retrival Begun');
      puppeteerOps.getGeVisToken().then((result) => {
        this.geVisToken.pending = false;
        this.geVisToken.token = result[0];
        this.geVisToken.updateTime = result[1];
        this.pilotLog('GeVis Auth Token Retrieved Ok');
      }).catch((error) => {
        this.geVisToken.pending = false;
        this.pilotLog('GeVis token retreval ' + error);
      });
    }
  }
  /**
   * updates the geVis token using puppeteer
   */
  updateMaximoTokens() {
    const tokenPending = this.maximoTokens.pending;
    if (!tokenPending) {
      // get new token using puppeteer
      this.maximoTokens.pending = true;
      puppeteerOps.getMaximoTokens().then((result) => {
        this.maximoTokens.pending = false;
        this.maximoTokens.token = result;
        this.maximoTokens.updateTime = moment();
        this.pilotLog('Maximo Auth Updated');
      }).catch((error) => {
        this.maximoTokens.pending = false;
        this.pilotLog('Maximo token retreval ' + error);
      });
    }
  }
  /**
   * updates the vehicle list from GeVis if token is valid
   * returns test data if full debug mode is enabled
   * @return {Promise}
   */
  updateVehicles() {
    const fullDebugMode = this.functionFlags.fullDebugMode;
    return new Promise((resolve, reject) => {
      if (!fullDebugMode) {
        if (this.tokenValid()) {
          kiwirailAPI.geVisVehicles(this.geVisToken.token).then((result) => {
            this.geVisVehicles = result;
            this.pilotLog('GeVis Vehicles loaded ok');
            resolve();
          }).catch((error) => {
            this.pilotLog(error);
            resolve();
          });
        }
      } else {
        // get dummy vehicles
        const dummyData = testDataOrganiser(this.functionFlags.debugDataToUse);
        this.geVisVehicles = dummyData.geVisVehicles;
        this.pilotLog('TEST GeVis Vehicles loaded ok');
        resolve();
      }
    });
  }
  /**
   * updates the NIS list from Maximo if token is valid
   * @return {Promise}
   */
  updateNISList() {
    const logging = this.functionFlags.pilotSQLLogging;
    return new Promise((resolve, reject) => {
      if (this.maximoTokenValid()) {
        maximoAPI.maximoNISList(this.maximoTokens).then((result) => {
          this.NISList = result;
          this.pilotLog('Maximo NIS List loaded ok');
          if (logging) {
            this.NISList.list.forEach(function(workOrder) {
              PilotSQLLog.logSQL.notInService(workOrder);
            });
          }
          resolve();
        }).catch((error) => {
          this.pilotLog(error);
          resolve();
        });
      }
    });
  }
  /**
   * updates running services using geVis vehicle data
   */
  updateRunningServices() {
    const fullDebugMode = this.functionFlags.fullDebugMode;
    const logging = this.functionFlags.pilotSQLLogging;
    let time;
    if (fullDebugMode) {
      const dummyData = testDataOrganiser(this.functionFlags.debugDataToUse);
      time = dummyData.time;
    } else {
      time = moment();
    }
    this.runningServices = getCurrentServices(this.geVisVehicles.features, this, time);
    if (logging) {
      this.runningServices.forEach(function(service) {
        PilotSQLLog.logSQL.service(service);
      });
    }
  }
  /**
   * updates running services using geVis vehicle data
   */
  updateUnitLists() {
    const logging = this.functionFlags.pilotSQLLogging;
    const unitsAndCars = getCurrentUnitList(this.geVisVehicles.features);
    this.unitList = unitsAndCars[0];
    this.carList = unitsAndCars[1];
    if (logging) {
      this.carList.forEach(function(vehicle) {
        PilotSQLLog.logSQL.vehicle(vehicle);
      });
    }
  }
  /**
   * checks if weather observations are valid
   * and up to date
   * @return {boolean} valid or not
   */
  weatherValid() {
    const lifespan = this.applicationSettings.weatherLifespan;
    const uptoDate = (this.weatherObservationsLastUpdated > moment().subtract(lifespan, 'minutes'));
    const empty = (this.weatherObservations.length == 0);
    if (uptoDate & !empty) {
      return true;
    } else {
      return false;
    }
  }
  /**
   * updates weather observations using metservice data
   */
  updateWeather() {
    const logging = this.functionFlags.pilotSQLLogging;
    metserviceAPI.getWeatherObservations().then((result) => {
      this.weatherObservations = result;
      this.weatherObservationsLastUpdated = moment();
      this.pilotLog('Weather loaded ok');
      if (logging) {
        for (let i = 0; i < this.weatherObservations.length; i++) {
          if (this.weatherObservations[i] !== undefined) {
            PilotSQLLog.logSQL.weatherObservation(this.weatherObservations[i]);
          }
        }
      }
    }).catch((error) => {
      this.pilotLog(error);
    });
  }
  // metserviceAPI
  /**
   * updates roster duties from VDS or dummy data if in debug mode
   */
  updateRosterDuties() {
    const fullDebugMode = this.functionFlags.fullDebugMode;
    if (!fullDebugMode) {
      vdsRosterAPI.rosterDuties().then((result) => {
        this.rosterDuties = result;
        this.rosterDutiesLastUpdated = moment();
        this.pilotLog('VDS Roster Duties loaded ok');
      }).catch((error) => {
        console.log(error);
      });
    } else {
      // get dummy roster duties
      const dummyData = testDataOrganiser(this.functionFlags.debugDataToUse);
      this.rosterDuties = dummyData.rosterDuties;
      this.rosterDutiesLastUpdated = moment();
      this.pilotLog('TEST VDS Roster Duties loaded ok');
    }
  }
  /**
   * checks if roster duties are valid
   * and up to date
   * @return {boolean} valid or not
   */
  rosterDutiesValid() {
    const lifespan = this.applicationSettings.rosterDutiesLifespan;
    const uptoDate = (this.rosterDutiesLastUpdated > moment().subtract(lifespan, 'minutes'));
    const empty = (this.rosterDuties.length == 0);
    if (uptoDate & !empty) {
      return true;
    } else {
      return false;
    }
  }
  /**
   * updates roster day status from VDS or dummy data if in debug mode
   */
  updateRosterDayStatus() {
    const fullDebugMode = this.functionFlags.fullDebugMode;
    if (!fullDebugMode) {
      vdsRosterAPI.dayRosterStatus(moment()).then((result) => {
        this.rosterDayStatus = result;
        this.rosterStatusLastUpdated = moment();
        this.pilotLog('VDS Roster Day Status loaded ok');
      }).catch((error) => {
        console.log(error);
      });
    } else {
      // get dummy roster day status
      const dummyData = testDataOrganiser(this.functionFlags.debugDataToUse);
      this.rosterDayStatus = dummyData.rosterDayStatus;
      this.rosterStatusLastUpdated = moment();
      this.pilotLog('TEST VDS Roster Day Status loaded ok');
    }
  }
  /**
   * checks if roster day status is valid
   * and up to date
   * @return {boolean} valid or not
   */
  rosterDayStatusValid() {
    const lifespan = this.applicationSettings.rosterDayStatusLifespan;
    const uptoDate = (this.rosterStatusLastUpdated > moment().subtract(lifespan, 'minutes'));
    const empty = (this.rosterDayStatus.length == 0);
    if (uptoDate & !empty) {
      return true;
    } else {
      return false;
    }
  }
  /**
   * updates bus replacement list from Compass
   * or dummy data if in debug mode
   */
  updateBusReplacementsList() {
    const fullDebugMode = this.functionFlags.fullDebugMode;
    if (!fullDebugMode) {
      compassAPI.busReplacements().then((result) => {
        this.busReplacementList = result;
        this.busReplacementsLastUpdated = moment();
        this.pilotLog('Compass bus replacement list loaded ok');
      }).catch((error) => {
        console.log(error);
      });
    } else {
      // get dummy bus replacement list
      const dummyData = testDataOrganiser(this.functionFlags.debugDataToUse);
      this.busReplacementList = dummyData.busReplacementList;
      this.busReplacementsLastUpdated = moment();
      this.pilotLog('TEST Compass bus replacement list loaded ok');
    }
  }
  /**
   * checks if bus replacement list is up to date
   *  does not check empty since it could be expected to be empty
   * @return {boolean} valid or not
   */
  busReplacementsListValid() {
    const lifespan = this.applicationSettings.busReplacementListLifespan;
    const uptoDate = (this.busReplacementsLastUpdated > moment().subtract(lifespan, 'minutes'));
    if (uptoDate) {
      return true;
    } else {
      return false;
    }
  }
  /**
 * updates staff List from PilotDB
 */
  updateStaffList() {
    PilotSQLLog.getStaffList().then((result) => {
      this.staffList = result;
      this.pilotLog('Staff List loaded ok');
    }).catch((error) => {
      console.log(error);
    });
  }
  /**
   * updates timetable from Compass
   * or dummy data if in debug mode
   */
  updateTimetable() {
    const fullDebugMode = this.functionFlags.fullDebugMode;
    const workingOffsiteMode = this.functionFlags.workingOffsiteMode;
    if (!fullDebugMode && !workingOffsiteMode) {
      timetableLogic.getCurrentTimetable().then((result) => {
        this.timetable = result;
        this.tripSheet = timetableLogic.getTripSheet(result);
        this.timetableLastUpdated = moment();
        this.pilotLog('Compass timetable loaded ok');
      }).catch((error) => {
        console.log(error);
      });
    } else {
      const dummyData = testDataOrganiser(this.functionFlags.debugDataToUse);
      this.timetable = dummyData.timetable;
      this.tripSheet = timetableLogic.getTripSheet(dummyData.timetable);
      this.timetableLastUpdated = moment();
      this.pilotLog('TEST Compass timetable loaded ok');
    }
  }
  /**
   * checks if timetable is valid
   * and up to date
   * @return {boolean} valid or not
   */
  timetableValid() {
    const timetableUpdateHour = this.applicationSettings.timetableUpdateHour;
    const timetableDay = moment().hour(timetableUpdateHour).minute(0).second(0);
    const uptoDate = (this.timetableLastUpdated > timetableDay);
    const empty = (this.timetable.length == 0);
    if (uptoDate & !empty) {
      return true;
    } else {
      return false;
    }
  }
  /**
     * a simple function to streamline console log code for this program
     * eventually hope to have it log to the DB as well
     * @param {string} status - the thing to report
     */
  pilotLog(status) {
    console.log(moment().format('HH:mm:ss') + ' ' + status);
  }
};
