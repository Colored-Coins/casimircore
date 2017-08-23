'use strict'

var mongoose
var timestamps = require('mongoose-time')
var fs = require('fs')
var merge = require('mongoose-merge-plugin')
var mongoUri = require('mongodb-uri')
var _ = require('lodash')

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
    var username = settings.user
    var password = settings.pass
    var host = settings.host
    var port = settings.port
    var database = settings.name
    var uri = settings.uri
    var options = settings.options
    mongoose = mongooseInstance || require('mongoose')
    mongoose.plugin(merge)
    var DefaultSchema = mongoose.Schema

    mongoose.DefaultSchema = DefaultSchema
    mongoose.Schema = function (schema, options) {
      var newSchema = new DefaultSchema(schema, options)
      newSchema.plugin(timestamps())
      return newSchema
    }
    if (!uri && (!database || !host || !port)) {
      if (cb) return cb('Can\'t connect to Database')
      throw new Error('Can\'t connect to Database')
    }
    uri = uri || mongoUri.formatMongoose({username: username, password: password, hosts: [{host: host, port: port}], database: database})
    var default_options = {
      server: {
        socketOptions: {
          keepAlive: 1,
          connectTimeoutMS: 30000
        }
      },
      replset: {
        socketOptions: {
          keepAlive: 1,
          connectTimeoutMS: 3000
        }
      }
    }
    if (options) {
      try {
        options = JSON.parse(options)
        options = _.merge(default_options, options)
      } catch (e) {
        console.warning('cant resolve db options:', e)
        options = default_options
      }
    } else {
      options = default_options
    }
    console.log('db_options', JSON.stringify(options))
    // CONNECTION EVENTS
    mongoose.connection.on('connected', function () {
      console.log('Database connected to: ' + uri)
    })
    mongoose.connection.on('error', function (err) {
      console.log('Mongoose default connection error: ' + err)
    })
    mongoose.connection.on('disconnected', function () {
      console.log('Database disconnected')
    })
    mongoose.connection.once('open', function () {
      console.log('Database is open: ' + uri)
    })
    // If the Node process ends, close the Mongoose connection
    process.on('SIGINT', function () {
      mongoose.connection.close(function () {
        console.log('Database disconnected through app termination')
        process.exit(0)
      })
    })
    settings.dir && load_models(settings.dir)
    console.log('Connecting to Database...')
    mongoose.connect(uri, options, function (err) {
      if (cb) cb(err, mongoose)
    })
  },

  get_model: function (name) {
    var to_lower_case_name = name.toLowerCase()
    return mongoose.models[name] || mongoose.models[to_lower_case_name]
  }
}
