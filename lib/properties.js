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
    properties_default.server.https_port = process.env.SSL_PORT || process.env.HTTPS_PORT || properties_default.server.https_port
    properties_default.server.http_port = process.env.HTTP_PORT || properties_default.server.http_port
    properties_default.server.host = process.env.HOST || properties_default.server.host
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
  if (properties_default.db || process.env.DB_HOST || process.env.DB_URI) {
    properties_default.db = properties_default.db || {}
    properties_default.db.name = process.env.DB_COLLECTION || process.env.DBCOLLECTION || properties_default.db.name
    properties_default.db.host = process.env.DB_HOST || process.env.DBHOST || properties_default.db.host
    properties_default.db.port = process.env.DB_PORT || process.env.DBPORT || properties_default.db.port
    properties_default.db.user = process.env.DB_USER || process.env.DBUSER || properties_default.db.user
    properties_default.db.pass = process.env.DB_PASS || process.env.DBPASS || properties_default.db.pass
    properties_default.db.dir = process.env.DB_DIR || process.env.DBDIR || properties_default.db.dir
    properties_default.db.uri = process.env.DB_URI || process.env.DBURI || properties_default.db.uri
    properties_default.db.options = process.env.DB_OPTIONS || process.env.DBOPTIONS || properties_default.db.options
  }
  if (properties_default.redis || process.env.REDIS_HOST) {
    properties_default.redis = properties_default.redis || {}
    properties_default.redis.host = process.env.REDIS_HOST || process.env.REDISHOST || properties_default.redis.host
    properties_default.redis.port = process.env.REDIS_PORT || process.env.REDISPORT || properties_default.redis.port
    properties_default.redis.user = process.env.REDIS_USER || process.env.REDISUSER || properties_default.redis.user
    properties_default.redis.pass = process.env.REDIS_PASS || process.env.REDISPASS || properties_default.redis.pass
    properties_default.redis.prefix = process.env.REDIS_PREFIX || process.env.REDISPREFIX || properties_default.redis.prefix
  }

  properties_default.bitcoin_rpc = properties_default.bitcoin_rpc || {}
  properties_default.bitcoin_rpc.ssl = process.env.BITCOIND_SSL || process.env.RPCSSL || properties_default.bitcoin_rpc.ssl
  properties_default.bitcoin_rpc.url = process.env. BITCOIND_HOST || process.env.RPCURL || properties_default.bitcoin_rpc.url
  properties_default.bitcoin_rpc.path = process.env.BITCOIND_PATH || process.env.RPCPATH || properties_default.bitcoin_rpc.path
  properties_default.bitcoin_rpc.username = process.env.BITCOIND_USER || process.env.RPCUSERNAME || properties_default.bitcoin_rpc.username
  properties_default.bitcoin_rpc.password = process.env.BITCOIND_PASS || process.env.RPCPASSWORD || properties_default.bitcoin_rpc.password
  properties_default.bitcoin_rpc.port = process.env.BITCOIND_PORT || process.env.RPCPORT || properties_default.bitcoin_rpc.port
  properties_default.bitcoin_rpc.timeout = process.env.BITCOIND_TIMEOUT || process.env.RPCTIMEOUT || properties_default.bitcoin_rpc.timeout

  properties_default.xray = properties_default.xray || {}
  properties_default.xray.sample = (process.env.XRAY_SAMPLE || properties_default.xray.sample || 'false') == 'true'
  properties_default.xray.service = process.env.XRAY_SERVICE || properties_default.xray.service || 'ElasticBeanstalk'
  properties_default.xray.app_name = process.env.XRAY_APP_NAME || properties_default.xray.app_name || 'CasimirApp'

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
