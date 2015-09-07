'use strict'

var express = require('express')
var https = require('https')
var http = require('http')
var auth = require('http-auth')
var io = require('socket.io')
var fs = require('fs')
var faye = require('faye')
var expressWinston = require('express-winston')
var cookieParser = require('cookie-parser')
var favicon = require('serve-favicon')
var bodyParser = require('body-parser')
var expressValidator = require('express-validator')
var compression = require('compression')
var cors = require('cors')
var consolidate = require('consolidate')

module.exports = function (properties) {
  // Server and Middlewares properties
  var environment = properties.ENV.type
  var https_port = properties.server.https_port
  var http_port = properties.server.http_port
  var sockets = properties.server.sockets
  var faviconDir = properties.server.favicon
  var key_file = properties.ssl.key
  var crt_file = properties.ssl.crt
  var cookies_secret = properties.server.cookies_secret
  var mount = properties.faye.mount
  var timeout = properties.faye.timeout
  var engine_type = properties.engine.type || 'jade'
  var file_extantion = properties.engine.file_extantion || '.jade'
  var views_folder = properties.engine.view_folder || 'app/views'
  var static_folder = properties.engine.static_folder
  var admin_users = properties.basic.admin_users
  var realm = properties.basic.realm
  var validator = {customValidators: properties.modules.validator}
  var router = properties.modules.router
  var error = properties.modules.error
  var logger = properties.modules.logger
  var compression_level = properties.server.compression == null ? 6 : properties.server.compression

  // /////////////////////////Building the express server///////////////////////////

  //  Express Server
  var app = express()

  // Gzip compression middleware
  app.use(compression({level: compression_level}))
  // Adds optional express logging to winston logger
  logger && app.use(expressWinston.logger({
    winstonInstance: logger,
    meta: true,
    colorStatus: true
  }))

  // Adding optional cookies encryption
  if (cookies_secret) {
    app.use(cookieParser(cookies_secret))
    logger.info('Your cookies are now encrypted - :)')
  } else {
    logger.info('You can\' use Cookies - :(')
  }

  // Dev mode middlewares
  if (environment === 'development') {
    // Allow the client to choose HTTP method as a query param
    app.use(function (req, res, next) {
      req.query.method && (req.method = req.query.method)
      next()
    })
    // Adds optional basic http authentication to all routes
    if (admin_users && realm) {
      var basic = auth.basic({
        realm: realm,
        file: admin_users,
        skipUser: true
      })
      app.use(auth.connect(basic))
    }
  }

  app.use(favicon(faviconDir))                            // Fast fav icon middleware
  app.use(cors())                                         // Allowing CORS comunication
  app.use(bodyParser.json())                              // Support for JSON-encoded bodies
  app.use(bodyParser.urlencoded({extended: true}))        // Support for URL-encoded bodies
  app.engine(file_extantion, consolidate[engine_type])    // assign the template engine to the file extantion
  app.set('view engine', file_extantion)                  // set file extantion as the default extension
  app.set('views', views_folder)                          // Changing default view folder
  app.use(expressValidator(validator))                    // Parameter validation middleware
  router && app.use(router)                               // Load the router to the server
  static_folder && app.use(express.static(static_folder)) // Optional HTTP static server middleware
  logger && app.use(expressWinston.errorLogger({          // Adds optional express error logging to winston logger
    winstonInstance: logger,
    level: 'silly',
    statusLevels: true
  }))

  // HTTP status 404 response middlware
  app.use(function (req, res, next) {
    res.status(404)
    res.format({
      html: function () { res.render('404') },              // respond with html page
      json: function () { res.send({error: 'Not found'}) }, // respond with json
      default: function () { res.send('Not found') }        // default to plain-text
    })
  })
  error && app.use(error)

  // ////////////////////Building The returned Server Object//////////////////////
  var server = {
    port: http_port,
    ssl: false,
    pub_sub: false,
    sockets: false
  }

  // Adding optional SSL to the server
  if (key_file && crt_file) {
    var ssl_key = fs.readFileSync(key_file)
    var ssl_cert = fs.readFileSync(crt_file)

    if (ssl_key && ssl_cert) {
      // SSL settings
      var options = {
        key: ssl_key,
        cert: ssl_cert,
        ciphers: 'HIGH:!DSS:!aNULL@STRENGTH',
        honorCipherOrder: true
      }
      // Crete HTTPS server
      server.http_server = https.createServer(options, app)
      server.ssl = true
      // Set port to https port
      server.port = https_port
      logger.info('You now have a https server with SSL enabled')
      // set up plain http server
      var https_redirect = express()
      // set up a route to redirect http to https
      https_redirect.use(function (req, res) {
        res.redirect('https://' + req.get('Host') + req.url)
      })
      // have it listen on http to redirect users to https
      https_redirect.listen(http_port)
    } else {
      logger.info('Can\'t find SSL certifcate and key files so no SSL for you')
      server.http_server = http.createServer(app)
    }
  } else {
    logger.info('Can\'t find SSL properties so no SSL for you')
    server.http_server = http.createServer(app)
  }

  // Adding optional Pub/Sub capabilities using Faye
  if (mount && timeout) {
    server.pub_sub = true
    var bayeux = new faye.NodeAdapter({mount: mount, timeout: timeout})
    //  Faye Server
    bayeux.attach(server)
    logger.info('faye started at mount: ' + mount + ', with timeout: ' + timeout)
  } else {
    logger.info('Can\'t find faye properties so no pub/sub for you')
  }

  // Adding optional websockers capabilities using Socket.IO
  if (sockets === 'true') {
    // Sockets Server
    server.io_server = io(server.http_server)
    server.io_server.on('connection', function (socket) {
      server.sockets = true
      logger.info('user conneced to scoket with id: ' + socket.id)
      socket.on('disconnect', function () {
        logger.info('user disconnect from socket')
      })
    })
  }
  return (server)
}
