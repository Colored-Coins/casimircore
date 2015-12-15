var piwikTracker = require('piwik-tracker')

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
    var piwik = piwikTracker(options.siteid, options.url)
    var piwikData = {
      url: getFullUrl(req),
      action_name: req.route_object.function_name,
      ua: req.header('User-Agent'),
      lang: req.header('Accept-Language'),
      cvar: JSON.stringify({
        '1': ['HTTP method', req.method]
      }),
      token_auth: options.token,
      cip: getClientIP(req)
    }
    piwik.track(piwikData)
    next()
  }
}
