'use strict'

var fs = require('fs')
var jf = require('jsonfile')
var _ = require('lodash')

var routesDir = __dirname + '/../routes/'

// //////// Routes File /////// //
var GET_public = jf.readFileSync(routesDir + 'GET-public.json')
var GET_private = jf.readFileSync(routesDir + 'GET-private.json')
var POST_public = jf.readFileSync(routesDir + 'POST-public.json')
var POST_private = jf.readFileSync(routesDir + 'POST-private.json')
var PUT_public = jf.readFileSync(routesDir + 'PUT-public.json')
var PUT_private = jf.readFileSync(routesDir + 'PUT-private.json')
var DELETE_public = jf.readFileSync(routesDir + 'DELETE-public.json')
var DELETE_private = jf.readFileSync(routesDir + 'DELETE-private.json')

export var controllers = _.merge(GET_public, GET_private, POST_public, POST_private, PUT_public, PUT_private, DELETE_public, DELETE_private)
// var controllers_dir = __dirname + '/../app_new'
// Write routes params - just for very first initialization
var addToList = function (newParams, oldParams, array) {
  _.each(newParams, function (param) {
    if (!(_.find(oldParams, function (paramOne) { return paramOne === param }))) {
      array.push(param)
    }
  })
  return true
}

// Create a standard Casimir javascript file
var functions, object
var createCasimirFile = function (funcs, file, type, cb) {
  fs.readFile(file, function (err, data) {
    if (err && err.code === 'ENOENT') {
      functions = ''
      object = {}
    } else if (err) {
      throw err
    } else {
      functions = data.toString()
      object = require(file)
    }
    _.each(funcs, function (func) {
      if (!object[func]) {
        object[func] = cb
      }
    })
    var fileSplited = functions.split('module.exports = ')
    var keys = Object.keys(object)
    var result = fileSplited[0] + 'module.exports = {\n'
    var length = keys.length
    keys.forEach(function (key) {
      if (funcs.indexOf(key) === -1) console.warn(type + ' function is defined but never used: ' + key)
      result += '  ' + key.toString() + ': ' + object[key]
      length--
      if (length > 0) result += ','
      result += '\n'
    })
    result += '}\n'
    // fs.writeFile(file, result, function (err) {
    //   if (err) throw err
    // })
  })
}

// Creating/Updating validator file
var params = []
_.each(controllers, function (route) {
  addToList(route.params, params, params)
  if (route.optional) addToList(route.optional, params, params)
})

createCasimirFile(params, __dirname + '/validator.js', 'Validator', function (a) {
  return true
})

export var createDbFile = function (name, cb) {
  var fileName = name.toLowerCase()
  fileName = __dirname + '/../db/' + fileName + '.js'
  fs.stat(fileName, function (err, stats) {
    if (!err) {
      console.log('File Already Exists')
      return cb()
    }
    console.log('Creating new database file')
    var file = '// Load required packages\nlet mongoose = require(\'mongoose\')\n\n'
    file += 'let ' + name + ' = new mongoose.Schema({\n\n})\n\n'
    file += '// Export the Mongoose model\nmodule.exports = ' + name + '\n'
    fs.writeFile(fileName, file, function (err) {
      if (err) cb(err)
      return cb()
    })
  })
}
