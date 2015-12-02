'use strict'

var winston = require('winston')
var mail = require('winston-mail')
var fs = require('fs')
var logentries = require('le_node')
var assert = require('assert')

function custom_time_stamp1 () {
  var date = new Date()
  var month = date.getUTCMonth() + 1
  return date.getUTCDate() + '/' + month + '/' + date.getFullYear() + '-' + date.getUTCHours() + ':' + date.getUTCMinutes() + ':' + date.getUTCSeconds()
}

// var custom_time_stamp2 = function () {
//   var date = new Date()
//   var month = date.getUTCMonth() + 1
//   return date.getUTCDate() + '/' + month + '/' + date.getFullYear() + '-' + date.getUTCHours() + ':' + date.getUTCMinutes() + ':' + date.getUTCSeconds() + ':' + date.getUTCMilliseconds()
// }

function development_transports (myToken) {
  var temp = [
    new (winston.transports.Console)({
      level: 'silly',
      colorize: true,
      silent: false,
      timestamp: custom_time_stamp1
    })
    // new (winston.transports.DailyRotateFile)({
    //   level: 'silly',
    //   filename: __dirname + '/../log/log.txt',
    //   maxsize: 500000,
    //   prettyPrint: true,
    //   silent: false,
    //   timestamp: custom_time_stamp2
    // })
  ]
  return temp
}

function qa_transports (myToken) {
  var temp = [
    // new (winston.transports.Console)({
    //   level: 'warn',
    //   colorize: true,
    //   silent: false,
    //   timestamp: custom_time_stamp1
    // }),
    // new (winston.transports.DailyRotateFile)({
    //   level: 'silly',
    //   filename: __dirname + '/../log/log.txt',
    //   maxsize: 500000,
    //   prettyPrint: true,
    //   silent: false,
    //   timestamp: custom_time_stamp2
    // }),
    new (mail.Mail)({
      to: 'thehobbit85@gmail.com',
      level: 'warn',
      silent: true,
      token: myToken
      // handleExceptions: true
      // from: The address you want to send from. (default: winston@[server-host-name])
      // host: SMTP server hostname (default: localhost)
      // port: SMTP port (default: 587 or 25)
      // username: User for server auth
      // password: Password for server auth
      // subject Subject for email (default: winston: {{level}} {{msg}})
      // ssl: Use SSL (boolean or object { key, ca, cert })
    })
  ]
  return temp
}

function production_transports (myToken) {
  var temp = [
    // new (winston.transports.Console)({
    //   level: 'info',
    //   colorize: true,
    //   silent: false,
    //   timestamp: custom_time_stamp1
    // }),
    // new (winston.transports.DailyRotateFile)({
    //   level: 'info',
    //   filename: __dirname + '/../log/log.txt',
    //   maxsize: 500000,
    //   prettyPrint: true,
    //   silent: false,
    //   timestamp: custom_time_stamp2
    // }),
    new (mail.Mail)({
      to: 'thehobbit85@gmail.com',
      level: 'warn',
      silent: true
      // handleExceptions: true
      // from: The address you want to send from. (default: winston@[server-host-name])
      // host: SMTP server hostname (default: localhost)
      // port: SMTP port (default: 587 or 25)
      // username: User for server auth
      // password: Password for server auth
      // subject Subject for email (default: winston: {{level}} {{msg}})
      // ssl: Use SSL (boolean or object { key, ca, cert })
    })
  ]
  return temp
}

function defaultTransports () {
  var temp = [
    new (winston.transports.Console)({
      level: 'silly',
      colorize: true,
      silent: false,
      timestamp: custom_time_stamp1
    })
  ]
  return temp
}

module.exports = function (settings) {
  var env = settings.env || process.env.NODE_ENV
  var logentries_api_ley = settings.logentries_api_ley
  var transports = settings.transports
  var cli = settings.cli
  var logger
  var dir = (settings.log_dir)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir)
  if (transports) {
    logger = new (winston.Logger)(transports)
  } else {
    switch (env) {
      case 'development':
        logger = new (winston.Logger)({transports: development_transports(myToken)})
        break
      case 'QA':
        logger = new (winston.Logger)({transports: qa_transports(myToken)})
        break
      case 'production':
        logger = new (winston.Logger)({transports: production_transports(myToken)})
        break
      default:
        logger = new (winston.Logger)({transports: defaultTransports()})
        break
    }
  }
  assert(logentries)
  var myToken = process.env.LOG_API_KEY || logentries_api_ley
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
  // logger.exitOnError = false

  if (cli) logger.cli()
  //  console.log(logger)
  return logger
}

// levels = {
//   silly: 0,
//   debug: 1,
//   verbose: 2,
//   info: 3,
//   warn: 4,
//   error: 5
// }

// colors = {
//   silly: 'magenta',
//   verbose: 'cyan',
//   debug: 'blue',
//   info: 'green',
//   warn: 'yellow',
//   error: 'red'
// }
