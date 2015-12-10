var piwikTracker = require('piwik-tracker')

function getRemoteAddr (req) {
  var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress
  if (ip) return ip
  if (req.ip) return req.ip
  if (req._remoteAddress) return req._remoteAddress
  var sock = req.socket
  if (sock.socket) return sock.socket.remoteAddress
  return sock.remoteAddress
}

module.exports = function (piwikData) {
  return function (req, res, next) {
    if (piwikData.enabled) {
      var piwik = piwikTracker(piwikData.siteId, piwikData.url)
      var piwikData = {
        url: req.header('Host') + req.url,
        action_name: req.route_object.function_name,
        ua: req.header('User-Agent'),
        lang: req.header('Accept-Language'),
        cvar: JSON.stringify({
          '1': ['HTTP method', req.method]
        }),
        token_auth: piwikData.token,
        cip: getRemoteAddr(req)
      }
      piwik.track(piwikData)
    }
    next()
  }
}
