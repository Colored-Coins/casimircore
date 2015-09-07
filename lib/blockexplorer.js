'use strict'

var request = require('request')
var qs = require('qs')

function handleResponse (err, response, body, cb) {
  if (err) return cb(err)
  if (response.statusCode === 204) return cb({code: 204, message: 'no content'})
  if (response.statusCode !== 200) return cb(body)
  if (body && typeof body === 'string') {
    body = JSON.parse(body)
  }
  cb(null, body)
}

module.exports = function (blockexplorer_path) {
  return {
    get: function (method, params, cb) {
      var params_string = qs.stringify(params)
      var path = blockexplorer_path + method + '?' + params_string
      request.get(path, function (err, response, body) {
        handleResponse(err, response, body, cb)
      })
    },
    post: function (method, params, cb) {
      var path = blockexplorer_path + method
      request.post(path, {form: params}, function (err, response, body) {
        handleResponse(err, response, body, cb)
      })
    }
  }
}
