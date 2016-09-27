'use strict'

var express = require('express')
var https = require('https')
var http = require('http')
var auth = require('http-auth')
var io = require('socket.io')
var socketio_redis = require('socket.io-redis')
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
var proxiedHttp = require('findhit-proxywrap')
var redis = require('redis')
var morgan = require('morgan')

module.exports = function (properties) {
  // Server and Middlewares properties
  if (!properties.ENV) throw new Error('Must have ENV in properties')
  if (!properties.server) throw new Error('Must have server settings in properties')
  var environment = properties.ENV.type
  var https_port = properties.server.https_port
  var http_port = properties.server.http_port
  var sockets = properties.server.sockets
  var faviconDir = properties.server.favicon
  var cookies_secret = properties.server.cookies_secret
  var compression_level = properties.server.compression == null ? 6 : properties.server.compression
  var proxy = properties.server.proxy
  var proxy_strict = properties.server.proxy_strict
  var log_requests = properties.server.log_requests
  var key_file = properties.ssl && properties.ssl.key
  var crt_file = properties.ssl && properties.ssl.crt
  var redis_host = properties.redis && properties.redis.host
  var redis_port = properties.redis && properties.redis.port
  var redis_user = properties.redis && properties.redis.user
  var redis_password = properties.redis && properties.redis.password
  var redis_options = properties.redis && properties.redis.options
  var redis_prefix = properties.redis && properties.redis.prefix
  var mount = properties.faye && properties.faye.mount
  var timeout = properties.faye && properties.faye.timeout
  var engine_type = properties.engine && properties.engine.type || 'jade'
  var file_extantion = properties.engine && properties.engine.file_extantion || '.jade'
  var views_folder = properties.engine && properties.engine.view_folder || 'app/views'
  var static_folder = properties.engine && properties.engine.static_folder
  var admin_users = properties.basic && properties.basic.admin_users
  var realm = properties.basic && properties.basic.realm
  var validator = properties.modules && properties.modules.validator
  var router = properties.modules && properties.modules.router
  var error = properties.modules && properties.modules.error
  var logger = properties.modules && properties.modules.logger
  var requestid = properties.modules && properties.modules.requestid
  // /////////////////////////Building the express server///////////////////////////

  //  Express Server
  var app = express()

  // If proxy procotol is enabled we need to fix standard headers
  if (proxy === 'true') {
    app.all('*', function (req, res, next) {
      req['X-Forwarded-For'] = req.connection.remoteAddress
      req['X-Forwarded-Proto'] = req.connection.proxyPort
      next()
    })
  }

  app.use(function (req, res, next) {
    var proto = req.get('X-Forwarded-Proto') && req.get('X-Forwarded-Proto').toLowerCase()
    if (proto && proto !== 'https') return res.redirect('https://' + req.get('Host') + req.url)
    return next()
  })

  // Gzip compression middleware
  app.use(compression({ level: compression_level }))
  // Adding the RequestId middleware to ALL of the rout
  requestid && app.use(requestid)
  // Adds optional express logging to winston logger
  expressWinston.requestWhitelist.push('body')
  log_requests && app.use(morgan('short', {immediate: true}))
  logger && app.use(expressWinston.logger({
    winstonInstance: logger,
    meta: true,
    colorStatus: true
  }))

  // Adding optional cookies encryption
  if (cookies_secret) {
    app.use(cookieParser(cookies_secret))
    console.log('Your cookies are now encrypted - :)')
  } else {
    console.log('You can\'t use Cookies without a secret key - :(')
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
  app.use(bodyParser.urlencoded({ extended: true }))      // Support for URL-encoded bodies
  app.engine(file_extantion, consolidate[engine_type])    // assign the template engine to the file extantion
  app.set('view engine', file_extantion)                  // set file extantion as the default extension
  app.set('views', views_folder)                          // Changing default view folder
  app.use(validator || expressValidator())                // Parameter validation middleware
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
      json: function () { res.send({ error: 'Not found' }) }, // respond with json
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
  // Default http server to wrap the express app in
  var http_server = http

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
      // Change http_server to be an HTTPS server
      http_server = https
      // Change SSL flag to true
      server.ssl = true
      // Set port to https port
      server.port = https_port
      console.log('You now have a https server with SSL enabled')
      // set up plain http server
      var https_redirect = express()
      // set up a route to redirect http to https
      https_redirect.use(function (req, res) {
        res.redirect('https://' + req.get('Host') + req.url)
      })
      // have it listen on http to redirect users to https
      https_redirect.listen(http_port)
    } else {
      console.log('Can\'t find SSL certifcate and key files so no SSL for you')
    }
  } else {
    console.log('Can\'t find SSL properties so no SSL for you')
  }

  // If proxy protocol in enabled, we will wrap the http_server we have with proxy server
  if (proxy === 'true') {
    http_server = proxiedHttp.proxy(http_server, { strict: proxy_strict })
  }

  // Create the server using whatever http_server we have now
  if (options) server.http_server = http_server.createServer(options, app)
  else server.http_server = http_server.createServer(app)

  // Adding optional Pub/Sub capabilities using Faye
  if (mount && timeout) {
    server.pub_sub = true
    var bayeux = new faye.NodeAdapter({ mount: mount, timeout: timeout })
    //  Faye Server
    bayeux.attach(server)
    console.log('faye started at mount: ' + mount + ', with timeout: ' + timeout)
  } else {
    console.log('Can\'t find faye properties so no pub/sub for you')
  }

  // Adding redis capabilities to the server module
  if (redis_host && redis_port) {
    var redis_url = 'redis://'
    redis_user && (redis_host += redis_user)
    redis_password && (redis_url += ':' + redis_password + '@')
    redis_url += redis_host + ':' + redis_port
    server.redis_client = redis.createClient(redis_url, redis_options)
    console.log('Redis client is now connected')
    server.redis_client.on('error', function (err) {
      console.error('server.redis_client error', err)
    })
    server.redis_client.on('ready', function () {
      console.log('server.redis_client ready')
    })
  }

  // Adding optional websockers capabilities using Socket.IO
  if (sockets === 'true') {
    // Sockets Server
    server.io_server = io(server.http_server)
    if (redis_host && redis_port) {
      var redis_client_generator = redis.createClient
      var pub = redis_client_generator(redis_port, redis_host, {return_buffers: true})
      var sub = redis_client_generator(redis_port, redis_host, {return_buffers: true})
      if (redis_password) {
        pub.auth_pass = redis_password
        sub.auth_pass = redis_password
        sub.buffers = true
      }
      var redis_socketio_options = { pubClient: pub, subClient: sub }
      if (redis_prefix) {
        redis_socketio_options.key = redis_prefix
      }
      var redis_socketio_adapter = socketio_redis(redis_socketio_options)
      server.io_server.adapter(redis_socketio_adapter)

      redis_socketio_adapter.pubClient.on('error', function (err) {
        console.log('error in socket.io redis pub client: ', err)
      })
      redis_socketio_adapter.subClient.on('error', function (err) {
        console.log('error in socket.io redis sub client: ', err)
      })
      console.log('using websockets on redis (pub/sub) instance - ' + redis_host + ':' + redis_port)
    }

    server.io_server.on('connection', function (socket) {
      server.sockets = true
      console.log('user conneced to socket with id: ' + socket.id)
      socket.on('disconnect', function () {
        console.log('user disconnect from socket')
      })
    })
  }

  return (server)
}
