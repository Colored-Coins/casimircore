'use strict'

var uuid = require('uuid')

module.exports = function (settings) {
  return function (req, res, next) {
    settings.header = settings.header || 'request-id'
    settings.param = settings.header || 'requestid'
    settings.cookie = settings.header || 'requestid'
    settings.namespace && (settings.namespace += '-')
    var rid = (req.body && req.body[settings.param]) ||
      (req.query && req.query[settings.param]) ||
      (req.headers && req.headers[settings.header]) ||
      (req.params && req.params[settings.param]) ||
      (req.cookies && req.cookies[settings.cookie]) ||
      settings.namespace + uuid.v4()
    req.headers[settings.header] = rid
    res.setHeader(settings.header, rid)
    next()
  }
}
