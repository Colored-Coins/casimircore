# Casimir Core [![Build Status][travis-image]][travis-url] [![Coverage percentage][coveralls-image]][coveralls-url] [![NPM version][npm-image]][npm-url] [![Dependency Status][daviddm-image]][daviddm-url]

[![js-standard-style](https://cdn.rawgit.com/feross/standard/master/badge.svg)](https://github.com/feross/standard)

> The Core modules for the Casimir webapp framework


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
    check_access,
    issue_token
  },
  block_explorer: {
    get,
    post
  }
}
```

### Authentication

```js
var secret = 'helloKitty'

var callback = function (token, decoded, errmsg, req, res, next) {
  var User = db.get_model('User')
  User.findOne({ user_name: decoded.iss }, function (err, user) {
    if (err) {
      console.warn(err)
      return next(errmsg)
    }
    if (!user) return next()
    if (user.black_list.indexOf(token) !== -1) {
      console.warn('Token has been used')
      return next(errmsg)
    }
    req.user = user
    if (decoded.type === 'api_key') console.log(token, '-', req.path)
    req.user.requestToken = {token: token, decoded: decoded}
    return next()
  })
}

var authentication = casimir_core.authentication(secret, callback)
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
  dir: './db'
}
db.init(settings, mongoose, function (err, mongoose) {
  if (err) return console.error(err)
  console.log('connected to db')
})
```

### BLOCK-EXPLORER

```js
var block_explorer = casimir_core.block_explorer(explorerURI)
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
  logentries_api_ley: logentries_api_key,
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
```

### Router

```js
var GET_public = {
  "/path": {
    "function_name": "File.Function",
    "params": ["param1","param2"],
    "optional": ["optionalParam"],
    "users": ["optionalPrivateUsers"]
  }
}
var contollers_dir = './controllers/'
var routes = {
  GET: { Public: GET_public, Private: GET_private },
  POST: { Public: POST_public, Private: POST_private },
  PUT: { Public: PUT_public, Private: PUT_private },
  DELETE: { Public: DELETE_public, Private: DELETE_private }
}
var router = casimir_core.router(routes, contollers_dir, authentication)
```

### Server

```js
var validator = require('./validator.js')
// Add custom framwork modules for server
properties.modules = {
  validator: validator,
  router: router,
  error: error,
  logger: logger
}
// Set server and server port
var server = casimir_core.server(properties)
```

### Setup

```js
```

### Testing

```sh
$ cd /"module-path"/casimircore
$ npm test
```


## License

MIT © [thehobbit85]()

[npm-image]: https://badge.fury.io/js/casimircore.svg
[npm-url]: https://npmjs.org/package/casimircore
[travis-image]: https://travis-ci.org/casimircore.svg?branch=master
[travis-url]: https://travis-ci.org/casimircore
[daviddm-image]: https://david-dm.org/casimircore.svg?theme=shields.io
[daviddm-url]: https://david-dm.org/casimircore
[coveralls-image]: https://coveralls.io/repos/casimircore/badge.svg
[coveralls-url]: https://coveralls.io/r//casimircore
[mocha]:https://www.npmjs.com/package/mocha
[gulp]:http://gulpjs.com/
