'use strict'

module.exports = function () {
  return {
    authentication: require('./authentication'),
    block_explorer: require('./blockexplorer'),
    colored_coins: require('./coloredcoinsrpc'),
    db: require('./db'),
    error: require('./error'),
    logger: require('./logger'),
    // passport: require('./passportSetup'),
    properties: require('./properties'),
    request_id: require('./requestid'),
    router: require('./router'),
    server: require('./server'),
    piwik: require('./piwik')
    // setup: require('./setup'),
  }
}
