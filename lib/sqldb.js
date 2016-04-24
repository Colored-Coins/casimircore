'use strict'

var fs = require('fs')
var path = require('path')
require('pg').defaults.parseInt8 = true
var Sequelize = require('sequelize')

module.exports = function (settings) {
  var options = {
    dialect: settings.dialect,
    host: settings.host,
    port: settings.port
  }

  console.log('settings = ', settings)
  var sequelize = new Sequelize(settings.name, settings.user, settings.pass, options)
  var db = {}
  db.sequelize = sequelize
  db.Sequelize = Sequelize
  fs
    .readdirSync(settings.dir)
    .filter(function (file) {
      return file.endsWith('.js') && !file.endsWith('DataTypes.js')
    })
    .forEach(function (file) {
      var model = sequelize.import(path.join(settings.dir, file))
      db[model.name] = model
    })

  Object.keys(db).forEach(function (modelName) {
    if ('associate' in db[modelName]) {
      db[modelName].associate(db)
    }
  })

  return db
}
