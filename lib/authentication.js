'use strict'

var error_message = ['Not authorized', 401]

module.exports = function (verify_cb, access_cb) {
  return {
    verify_token: function (req, res, next) {
      var token = (req.body && req.body.token) ||
        (req.query && req.query.token) ||
        (req.headers && req.headers['x-access-token']) ||
        (req.params && req.params.token) ||
        (req.cookies && req.cookies.token)
      if (!token) return next()
      req.query.token = token
      return verify_cb(token, req, res, next)
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
    }
  }
}
