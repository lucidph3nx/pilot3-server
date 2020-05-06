const moment = require('moment-timezone');
moment().tz('Pacific/Auckland').format();
const path = require('path');
const express = require('express');


module.exports = function(app, current, functionFlags) {
  // cross origin requests
  app.use(function(req, res, next) {
    let oneof = false;
    if (req.headers.origin) {
      res.header('Access-Control-Allow-Origin', req.headers.origin);
      oneof = true;
    }
    if (req.headers['access-control-request-method']) {
      res.header('Access-Control-Allow-Methods', req.headers['access-control-request-method']);
      oneof = true;
    }
    if (req.headers['access-control-request-headers']) {
      res.header('Access-Control-Allow-Headers', req.headers['access-control-request-headers']);
      oneof = true;
    }
    if (oneof) {
      res.header('Access-Control-Max-Age', 60 * 60 * 24 * 365);
    }
    // intercept OPTIONS method
    if (oneof && req.method == 'OPTIONS') {
      res.send(200);
    } else {
      next();
    }
  });

  // =======PilotAPIModules========
  require('./pilotAPI/fleet')(app, current, functionFlags);
  // require('./pilotAPI/location')(app, current, functionFlags);
  require('./pilotAPI/performance')(app, current, functionFlags);
  require('./pilotAPI/roster')(app, current, functionFlags);
  require('./pilotAPI/serverStatus')(app, current, functionFlags);
  require('./pilotAPI/services')(app, current, functionFlags);
  require('./pilotAPI/staff')(app, current, functionFlags);
  // =======Staff Photos========
  app.use('/staff', express.static(path.resolve('./data/img/staff')));

  const port = 4000;
  app.listen(port, '0.0.0.0');
  console.log('Pilot API listening on ' + port);
};
