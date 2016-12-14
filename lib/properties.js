'use strict'

var ini = require('iniparser')
var _ = require('lodash')
var environment = process.env.NODE_ENV || 'development'

module.exports = function (settingsDir) {
  var properties_default = {}
  var properties_custom = {}
  try {
    properties_default = ini.parseSync(settingsDir + 'properties_' + environment + '.conf')
  } catch (e) {
    throw new Error('Can\'t find default properties')
  }

  properties_default.ENV.type = environment
  if (properties_default.JWT) {
    properties_default.JWT.jwtTokenSecret = process.env.JWTTOKENSECRET || properties_default.JWT && properties_default.JWT.jwtTokenSecret
  }
  if (properties_default.log) {
    properties_default.log.logentries_api_key = process.env.LOG_API_KEY || properties_default.log.logentries_api_key
    properties_default.log.level = process.env.LOG_LEVEL || properties_default.log.level
  }
  if (properties_default.server) {
    properties_default.server.https_port = process.env.SSL_PORT || properties_default.server.https_port
    properties_default.server.http_port = process.env.PORT || properties_default.server.http_port
    properties_default.server.name = process.env.SERVERNAME || properties_default.server.name
    properties_default.server.proxy = process.env.PROXY || properties_default.server.proxy
    properties_default.server.redis = process.env.REDIS || properties_default.server.redis
    properties_default.server.proxy_strict = process.env.PROXY_STRICT || properties_default.server.proxy_strict
    properties_default.server.proxy_strict = (properties_default.server.proxy_strict === 'true')
    properties_default.server.sockets = process.env.SOCKETS || properties_default.server.sockets
    properties_default.server.sockets_redis = process.env.SOCKETS_REDIS || properties_default.server.sockets_redis
    properties_default.server.sockets_redis = (properties_default.server.sockets_redis === 'true')
    properties_default.server.log_requests = process.env.LOG_REQUESTS || (properties_default.server.log_requests === 'true')
  }
  if (properties_default.ssl) {
    properties_default.ssl.key = process.env.KEY_FILE || properties_default.ssl.key
    properties_default.ssl.crt = process.env.CRT_FILE || properties_default.ssl.crt
  }
  if (properties_default.db) {
    properties_default.db.name = process.env.DBCOLLECTION || properties_default.db.name
    properties_default.db.host = process.env.DBHOST || properties_default.db.host
    properties_default.db.port = process.env.DBPORT || properties_default.db.port
    properties_default.db.user = process.env.DBUSER || properties_default.db.user
    properties_default.db.pass = process.env.DBPASS || properties_default.db.pass
    properties_default.db.dir = process.env.DBDIR || properties_default.db.dir
  }
  if (properties_default.redis) {
    properties_default.redis.host = process.env.REDISHOST || properties_default.redis.host
    properties_default.redis.port = process.env.REDISPORT || properties_default.redis.port
    properties_default.redis.user = process.env.REDISUSER || properties_default.redis.user
    properties_default.redis.pass = process.env.REDISPASS || properties_default.redis.pass
    properties_default.redis.prefix = process.env.REDISPREFIX || properties_default.redis.prefix
  }
  if (environment !== 'production') {
    try {
      properties_custom = ini.parseSync(settingsDir + 'properties.conf')
      properties_default = _.merge(properties_default, properties_custom)
    } catch (e) {
      console.warn('Can\'t find properties.conf so using default configuration')
    }
  }
  return properties_default
}
