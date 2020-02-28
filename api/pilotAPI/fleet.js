const moment = require('moment-timezone');
moment().tz('Pacific/Auckland').format();

module.exports = function(app, current, functionFlags) {
  // get the status for all Matangi Train Units
  app.get('/api/fleet/currentUnitList', (request, response) => {
    const currentUnitList = [];
    current.unitList.forEach((unit) =>
      currentUnitList.push(unit.webLegacy())
    );
    const apiResponse = {'Time': moment(), currentUnitList};
    response.writeHead(200, {'Content-Type': 'application/json'}, {cache: false});
    response.write(JSON.stringify(apiResponse));
    response.end();
  });
  // get the status for all Matangi Cars
  app.get('/api/fleet/currentCarList', (request, response) => {
    const currentCarList = [];
    current.carList.forEach((car) =>
      currentCarList.push(car.webLegacy())
    );
    const apiResponse = {'Time': moment(), currentCarList};
    response.writeHead(200, {'Content-Type': 'application/json'}, {cache: false});
    response.write(JSON.stringify(apiResponse));
    response.end();
  });
  // get the current NIS List
  app.get('/api/fleet/currentNISList', (request, response) => {
    const currentNISList = [];
    let matangiNISCount = 0
    current.NISList.list.forEach((unit) => {
      currentNISList.push(unit);
      if (unit.matangi && unit.NIS) {
        matangiNISCount++;
      }
    });
    const apiResponse = {'Time': moment(current.NISList.updated).format(), currentNISList, matangiNISCount};
    response.writeHead(200, {'Content-Type': 'application/json'}, {cache: false});
    response.write(JSON.stringify(apiResponse));
    response.end();
  });
};
