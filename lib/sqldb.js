'use strict'

var fs = require('fs')
var path = require('path')
var pg = require('pg')
pg.defaults.parseInt8 = true
delete pg.native
var Sequelize = require('sequelize')

module.exports = function (settings) {
  var options = {
    dialect: settings.dialect,
    host: settings.host,
    port: settings.port,
    logging: settings.debug && console.log
  }

  var sequelize = new Sequelize(settings.name, settings.user, settings.pass, options)
  var db = {}
  db.sequelize = sequelize
  db.Sequelize = Sequelize
  fs
    .readdirSync(settings.dir)
    .filter(function (file) {
      return file.indexOf('.js') > 0 && file.indexOf('DataTypes.js') < 0
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
