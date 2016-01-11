var piwikTracker = require('piwik-tracker')
var onFinished = require('on-finished')

function getClientIP (req) {
  var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress
  if (ip) return ip
  if (req.ip) return req.ip
  if (req._remoteAddress) return req._remoteAddress
  var sock = req.socket
  if (sock.socket) return sock.socket.remoteAddress
  return sock.remoteAddress
}

function getFullUrl (req) {
  var forwardedProtocol = req.get('X-Forwarded-Proto')
  var protocol = forwardedProtocol || req.protocol
  var fullUrl = protocol + '://' + req.get('host') + req.originalUrl
  return fullUrl
}

module.exports = function (options) {
  return function (req, res, next) {
    req.startTime = Date.now()
    onFinished(res, function (err, res) {
      var piwik = piwikTracker(options.siteid, options.url)
      var action_result = (!err && res.statusCode < 400) ? 'success' : 'failure'
      var response_time = Date.now() - req.startTime
      var piwikData = {
        url: getFullUrl(req),
        action_name: req.route_object.function_name,
        ua: req.header('User-Agent'),
        lang: req.header('Accept-Language'),
        gt_ms: response_time,
        token_auth: options.token,
        cip: getClientIP(req)
      }
      var dimensions = piwik.dimensions
      dimensions.method && (piwikData['dimension' + dimensions.method] = req.method)
      dimensions.result && (piwikData['dimension' + dimensions.result] = action_result)
      dimensions.user && (piwikData['dimension' + dimensions.user] = req.user_identifier)
      piwik.track(piwikData)
    })
    next()
  }
}
