'use strict'

var jwt = require('jwt-simple')
var moment = require('moment')
var request = require('request')

var error_message = ['Not authorized', 401]

var verify_fb_accsess_token = function (facebook_properties, fb_input_token, callback) {
  var fb_graph_host = facebook_properties.graph_host
  var fb_application_id = facebook_properties.application_id
  var fb_application_secret = facebook_properties.application_secret
  var fb_access_token = fb_application_id + '|' + fb_application_secret
  var host = fb_graph_host + '/debug_token?access_token=' + fb_access_token + '&input_token=' + fb_input_token
  request.get(host, function (err, response, body) {
    if (err) return callback(err)
    if (response.statusCode !== 200) return callback(body)
    body = JSON.parse(body)
    if (body.error) return callback(body.error)
    if (!body.data) return callback('no data in body (verify_fb_accsess_token)')
    if (body.data.error) return callback(body.data.error)
    if (!body.data.user_id) return callback('no facebook user_id found in data')
    callback(null, body.data.user_id)
  })
}

module.exports = function (secret, verify_cb, access_cb, facebook_properties) {
  return {
    verify_token: function (req, res, next) {
      var token = (req.body && req.body.token) ||
        (req.query && req.query.token) ||
        (req.headers && req.headers['x-access-token']) ||
        (req.params && req.params.token) ||
        (req.cookies && req.cookies.token)
      if (!token) return next()
      req.query.token = token
      try {
        var decoded = jwt.decode(token, secret)
        // if (decoded.exp <= Date.now()) return next()
        return verify_cb(token, decoded, error_message, req, res, next)
      } catch (err) {
        if (!facebook_properties) return next()
        // try to facebook login:
        verify_fb_accsess_token(facebook_properties, token, function (err, fid) {
          if (err) return next()
          decoded = {
            fid: fid,
            type: 'session_token',
            valid: true
          }
          return verify_cb(token, decoded, error_message, req, res, next)
        })
      }
    },

    verify_specific_user_token: function (allowedUsers) {
      return function (req, res, next) {
        var user = req.user
        if (!~allowedUsers.indexOf(user._id.toString())) req.user = null
        return next()
      }
    },

    check_access: function (req, res, next) {
      if (req.user) return next()
      if (access_cb) return access_cb(req, res, next)
      return next(error_message)
    },

    issue_token: function (settings) {
      var token_params = {
        iss: settings.iss || 'guest',
        exp: moment().add(settings.expiration_time || 3600000, 'milliseconds').valueOf(),
        type: settings.type || 'session_token'
      }
      if (settings.data) token_params.data = settings.data
      var token = jwt.encode(token_params, secret)
      return token
    }
  }
}
