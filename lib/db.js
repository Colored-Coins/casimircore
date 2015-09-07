'use strict'

var mongoose
var timestamps = require('mongoose-time')
var fs = require('fs')

function load_models (model_path) {
  fs.readdirSync(model_path).forEach(function (file) {
    if (file.split('.')[1] === 'js') {
      mongoose.model(file.split('.')[0].toLowerCase(), require(model_path + file))
    }
  })
  console.log('Done loading db schemas: ' + Object.keys(mongoose.models))
}

module.exports = {
  init: function (settings, mongooseInstance, cb) {
    mongoose = mongooseInstance || require('mongoose')
    var mongoCollectionName = settings.name
    var mongoHost = settings.host
    var mongoPort = settings.port
    var mongoUser = settings.user
    var mongoPass = settings.pass
    var DefaultSchema = mongoose.Schema

    mongoose.Schema = function (schema, options) {
      var newSchema = new DefaultSchema(schema, options)
      newSchema.plugin(timestamps())
      return newSchema
    }
    if (!mongoCollectionName || !mongoHost || !mongoPort) {
      if (cb) return cb('Can\'t connect to Database')
      throw new Error('Can\'t connect to Database')
    }
    var dbURI = mongoHost + ':' + mongoPort + '/' + mongoCollectionName
    var options = {
      server: {
        socketOptions: {
          keepAlive: 1,
          connectTimeoutMS: 30000
        }
      },
      replset: {
        socketOptions: {
          keepAlive: 1,
          connectTimeoutMS: 30000
        }
      },
      user: mongoUser,
      pass: mongoPass
    }
    // CONNECTION EVENTS
    mongoose.connection.on('connected', function () {
      console.log('Database connected to: ' + dbURI)
    })
    mongoose.connection.on('error', function (err) {
      console.log('Mongoose default connection error: ' + err)
    })
    mongoose.connection.on('disconnected', function () {
      console.log('Database disconnected')
    })
    mongoose.connection.once('open', function () {
      console.log('Database is open: ' + dbURI)
    })
    // If the Node process ends, close the Mongoose connection
    process.on('SIGINT', function () {
      mongoose.connection.close(function () {
        console.log('Database disconnected through app termination')
        process.exit(0)
      })
    })
    settings.dir && load_models(settings.dir)
    mongoose.connect(dbURI, options, function () {
      if (cb) cb(null, mongoose)
    })
  },
  get_model: function (name) {
    var to_lower_case_name = name.toLowerCase()
    return mongoose.models[name] || mongoose.models[to_lower_case_name]
  }
}
