'use strict'

var fs = require('fs')
var Sequelize = require('sequelize')

module.exports = function (settings) {
  console.log('---- init() ')

  if (!settings.user || !settings.pass || !settings.host || !settings.name) {
    throw new Error('Can\'t connect to Database - missing user, pass, host or name')
  }
  var connectionString = [
    settings.dialect + '://',
    settings.user + ':',
    settings.pass + '@',
    settings.host + '/',
    settings.name
  ].join('')

  var sequelize = new Sequelize(connectionString)
  var db = {}
  console.log('settings.dir = ', settings.dir)
  var db_models = fs.readdirSync(settings.dir)
  console.log('db_models = ', db_models)
  db_models.forEach(function (model) {
    require(settings.dir + model)(sequelize, db)
  })

  console.log('casimir.js - return from init()')
  return db
}
