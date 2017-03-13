# Casimir Core
[![Build Status][travis-image]][travis-url] [![Coverage percentage][coveralls-image]][coveralls-url] [![NPM version][npm-image]][npm-url] [![Dependency Status][daviddm-image]][daviddm-url] [![Slack Channel][slack-image]][slack-url]

[![js-standard-style](https://cdn.rawgit.com/feross/standard/master/badge.svg)](https://github.com/feross/standard)

> The core modules for the Casimir webapp framework


### Install

```sh
$ npm i --save casimircore
```


### Features

```js
var casimir_core = require('casimircore')()

console.log(casimir_core)

{
  server: {
    http_server,
    port,
    ssl,
    pub_sub,
    sockets,
    io_server
  },
  Error: 'Error Middleware',
  Router: 'Custom Router with authentication and validation',
  logger: {
    info,
    debug,
    error,
    warn
  },
  properties: properties,
  db: {
    init,
    get_model
  },
  authentication: {
    verify_token,
    verify_specific_user_token,
    check_access
  }
}
```

### Authentication

```js
var verify_callback = function (jwt_token, req, res, next) {
  get_user_by_token(jwt_token, function (err, user) {
    if (err) return next(err)
    req.user = user
    next()
  })
}

var access_callback = function (req, res, next) {
  // reaches here if there is no req.user
  res.status(401).send('Not Authorized')
}
 
var authentication = casimir_core.authentication(verify_callback, access_callback)
```

### DB

```js
var mongoose = require('mongoose')
var db = casimir_core.db
var settings = {
  user: 'user',
  pass: 'password',
  host: 'host.mongodb.com',
  port: 27000,
  name: 'testDB',

  // with URI - if provided, all previous connection settings are ignored
  uri: 'mongodb://user:password@host.mongodb.com:27000/testDB',

  // mongoose models directory
  dir: './db'
}
db.init(settings, mongoose, function (err, mongoose) {
  if (err) return console.error(err)
  console.log('connected to db')
})
```

### Error

```js
var env = process.env.NODE_ENV
var error = casimir_core.error(env)
```

### Logger

```js
var env = process.env.NODE_ENV
var logentries_api_key = 'fdsfdf23fewfew'

var log_settings = {
  env: env,
  logentries_api_key: logentries_api_key,
  log_dir: './log'
}

var logger = casimir_core.logger(log_settings)

// Can Actually run over normal console with logger
console.log = logger.info
console.error = logger.error
console.warn = logger.warn
...
```

### Properties

```js
var config_dir = './config'
var properties = casimir_core.properties(config_dir)
```

### RequestId

```js
var settings = {
  secret: 'secret',
  namespace: 'servername'
}
var requestid = casimir_core.request_id(requestSettings)
```

### Router

```js
var fs = require('fs')
var GET_public = {
  "/path": {
    "function_name": "File.Function",
    "params": ["param1","param2"],
    "optional": ["optionalParam"],
    "users": ["optionalPrivateUsers"]
  }
}
fs.writeFileSync(routes_dir + 'GET-public.json', GET_public) // can be similarly done for POST, PUT, DELETE and private
var controllers_dir = './controllers/'
var routes_dir = './routes/'
var router = casimir_core.router(routes_dir, controllers_dir, authentication)
```

### Server

```js
var validator = require('./validator.js')
// Add custom framwork modules for server
properties.modules = {
  validator: validator,
  router: router,
  error: error,
  logger: logger,
  requestid: requestid
}
// Set server and server port
var server = casimir_core.server(properties)
```

### Testing

```sh
$ cd /"module-path"/casimircore
$ npm test
```


## License

[Apache-2.0](http://www.apache.org/licenses/LICENSE-2.0)

[npm-image]: https://badge.fury.io/js/casimircore.svg
[npm-url]: https://npmjs.org/package/casimircore
[travis-image]: https://travis-ci.org/Colored-Coins/casimircore.svg?branch=master
[travis-url]: https://travis-ci.org/Colored-Coins/casimircore
[daviddm-image]: https://david-dm.org/Colored-Coins/casimircore.svg?theme=shields.io
[daviddm-url]: https://david-dm.org/Colored-Coins/casimircore
[coveralls-image]: https://coveralls.io/repos/Colored-Coins/casimircore/badge.svg
[coveralls-url]: https://coveralls.io/r//Colored-Coins/casimircore
[slack-image]: http://slack.coloredcoins.org/badge.svg
[slack-url]: http://slack.coloredcoins.org
[mocha]: https://www.npmjs.com/package/mocha
[gulp]: http://gulpjs.com/
