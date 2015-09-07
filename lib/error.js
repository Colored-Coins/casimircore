'use strict'

var prettyjson = require('prettyjson')

function create_error (err) {
  if (Array.isArray(err)) {
    err = {
      message: err[0],
      status: err[1]
    }
  } else if (typeof err === 'string') {
    err = {
      message: err,
      status: 500
    }
  }
  console.error(err)
  return err
}

module.exports = function (env) {
  env = env || 'development'
  var options = {
    noColor: true
  }
  if (env !== 'production') {
    return function (err, req, res, next) {
      var parsed_error = create_error(err, req)
      res.status(parsed_error.status || 500)
      return res.send(parsed_error)
    }
  } else {
    return function (err, req, res, next) {
      var parsed_error = create_error(err)
      res.status(parsed_error.status || 500)
      var response = {
        message: parsed_error.message,
        error: {}
      }
      return res.send(prettyjson.render(response, options))
    }
  }
}
