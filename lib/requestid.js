'use strict'

var uuid = require('uuid')
var request = require('request')
var crypto = require('crypto')

module.exports = function (settings) {
  if (!settings.secret) throw new Error('Must provide secret')
  var secret = settings.secret
  var requestId = settings.requestId || 'request-id'
  var serviceSecret = settings.serviceSecret || 'service-secret'
  var namespace = (settings.namespace && (settings.namespace += '-')) || 'namespace'

  return function (req, res, next) {
    var sid = req.headers && req.headers[serviceSecret]
    var rid = req.headers && req.headers[requestId]
    if (!sid) {
      rid = namespace + uuid.v4()
      req.headers[requestId] = rid
      sid = crypto.createHmac('md5', secret).update(rid).digest('hex')
    } else if (sid !== crypto.createHmac('md5', secret).update(rid).digest('hex')) return next(new Error('Not in my house'))

    var headers = {}
    headers[requestId] = rid
    headers[serviceSecret] = sid
    req.service = {
      request: request.defaults({headers: headers})
    }
    res.setHeader(requestId, rid)
    return next()
  }
}
