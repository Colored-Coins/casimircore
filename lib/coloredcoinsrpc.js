'use strict'

var request = require('request')
// var qs = require('qs')

function ColoredCoins (ccPath) {
  this.ccPath = ccPath
}

function handleResponse (err, response, body, cb) {
  if (err) return cb(err)
  if (response.statusCode === 204) return cb({code: 204, message: 'no content'})
  if (response.statusCode === 404) return cb({code: 404, message: 'no such func'})
  if (response.statusCode !== 200) return cb(body)
  if (body && typeof body === 'string') {
    body = JSON.parse(body)
  }
  cb(null, body)
}

ColoredCoins.prototype.get = function (method, params, cb) {
  // var params_string = qs.stringify(params)
  var params_string = ''
  for (var key in params) {
    var value = params[key]
    params_string += '/' + value
  }
  var path = this.ccPath + '/' + method + params_string
  request.get(path, function (err, response, body) {
    handleResponse(err, response, body, cb)
  })
}

ColoredCoins.prototype.post = function (method, params, cb) {
  var path = this.ccPath + '/' + method
  request.post(path, {json: params}, function (err, response, body) {
    handleResponse(err, response, body, cb)
  })
}

module.exports = ColoredCoins
