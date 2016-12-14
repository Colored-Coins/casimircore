'use strict'

var winston = require('winston')
var fs = require('fs')
var logentries = require('le_node')
var assert = require('assert')

function custom_time_stamp1 () {
  var date = new Date()
  var month = date.getUTCMonth() + 1
  return date.getUTCDate() + '/' + month + '/' + date.getFullYear() + '-' + date.getUTCHours() + ':' + date.getUTCMinutes() + ':' + date.getUTCSeconds()
}

var defaultTransports = [
  new (winston.transports.Console)({
    colorize: true,
    silent: false,
    timestamp: custom_time_stamp1
  })
]

module.exports = function (settings) {
  var env = settings.env || process.env.NODE_ENV
  var logentries_api_key = settings.logentries_api_key
  var cli = settings.cli
  var logger
  var dir = (settings.log_dir)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir)
  var transports = settings.transports || defaultTransports
  var level = settings.level
  if (!level) {
    switch (env) {
      case 'development':
        level = 'silly'
        break
      case 'QA':
        level = 'debug'
        break
      case 'production':
        level = 'info'
        break
      default:
        level = 'silly'
        break
    }
  }
  logger = new (winston.Logger)({level: level, transports: transports})
  var myToken = process.env.LOG_API_KEY || logentries_api_key
  if (myToken) {
    logger.add(winston.transports.Logentries, {
      token: myToken,
      level: 'debug',
      colorize: true,
      silent: false,
      prettyPrint: true
    })
  }
  logger.addFilter(function (msg, meta, level) {
    return '(' + process.pid + ') - ' + msg
  })

  if (cli) logger.cli()
  return logger
}
