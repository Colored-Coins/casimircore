'use strict'

module.exports = function () {
  return {
    authentication: require('./authentication'),
    db: require('./db'),
    sqldb: require('./sqldb'),
    error: require('./error'),
    logger: require('./logger'),
    // passport: require('./passport'),
    properties: require('./properties'),
    request_id: require('./requestid'),
    router: require('./router'),
    server: require('./server'),
    piwik: require('./piwik')
    // setup: require('./setup'),
  }
}
