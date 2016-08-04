'use strict'

var express = require('express')
var merge = require('merge')
var clone = require('clone')
var jf = require('jsonfile')
var fs = require('fs')
var path = require('path')

var ROOT_VERSION = 'root'

function build_rest_path (path, params) {
  if (params) {
    for (var i = 0; i < params.length; i++) {
      path += '/:' + params[i]
    }
  } else path = ''
  return path
}

function extract_param (request, param_name) {
  var url_param = request.params[param_name]
  var query_param = request.query[param_name]
  var body_param = request.body[param_name]
  var param
  if (request.check && request.check(param_name)[param_name]) {
    if (!(typeof url_param === 'undefined')) {
      param = url_param
      request.checkParams(param_name, 'Invalid url param')[param_name]()
    } else if (!(typeof query_param === 'undefined')) {
      param = query_param
      request.checkQuery(param_name, 'Invalid get param')[param_name]()
    } else if (!(typeof body_param === 'undefined')) {
      param = body_param
      request.checkBody(param_name, 'Invalid post param')[param_name]()
    }
  } else {
    param = url_param || query_param || body_param
  }
  return param
}

function parse_error_msg (err) {
  var msg = err.msg || ''
  var param = err.param || ''
  var value = err.value || ''
  return msg + ', ' + param + ' = ' + JSON.stringify(value)
}

function get_params_from_request (request, params_template, mandatory, callback) {
  var params = {}
  var errors
  params_template = params_template || []
  for (var index = 0; index < params_template.length; index++) {
    var param_name = params_template[index]
    var param
    if (request.check) {
      if (mandatory) request.assert(param_name, 'Missing param: ' + param_name).notEmpty()
      param = extract_param(request, param_name)
    } else {
      param = extract_param(request, param_name)
    }
    if (!(typeof param === 'undefined')) params[param_name] = param
  }

  if (request.check) {
    errors = request.validationErrors()
    if (errors) {
      if (!Array.isArray(errors)) errors = [errors]
      var explanations = errors.map(function (err) {
        return parse_error_msg(err)
      })
      var explanation = explanations.join('\n')
      var err = {
        message: 'Validation error',
        explanation: explanation,
        status: 400
      }
      return callback(err)
    }
  }

  callback(null, params)
}

function build_function_call (controllers_path, path_element) {
  var function_name_array = path_element.function_name.split('.')
  var version = function_name_array.length === 3 ? function_name_array[0] : ''
  var file_name = function_name_array[function_name_array.length - 2]
  var cFile = path.join(controllers_path, version, file_name + '.js')
  var cFunction = function_name_array[function_name_array.length - 1]
  return function (request, response, next) {
    return require(cFile)[cFunction](request, response, next)
  }
}

function build_request_params (path_element) {
  var params_template = path_element.params
  var optional_params_template = path_element.optional
  return function (request, response, next) {
    get_params_from_request(request, params_template, true, function (err, params) {
      if (err) return next(err)
      get_params_from_request(request, optional_params_template, false, function (err, params2) {
        if (err) return next(err)
        merge(params, params2)
        request.data = params
        request.route_object = path_element
        next()
      })
    })
  }
}

function connect_paths (router, version, method, controllers_path, auth, routes, private_area, custom_middlewares) {
  for (var path in routes) {
    var middlewares = []
    var path_element = routes[path]
    var users = path_element.users
    var params = path_element.params

    if (auth) {
      middlewares.push(auth.verify_token)
      if (private_area) {
        if (users && users.length > 0) {
          middlewares.push(auth.verify_specific_user_token(users))
        }
        middlewares.push(auth.check_access)
      }
    }
    // else {
    //   private_area && params.push('token')
    // }
    var rest_path = build_rest_path(path, params)
    var paramMiddleware = build_request_params(path_element)
    middlewares.push(paramMiddleware)

    if (custom_middlewares) middlewares = middlewares.concat(custom_middlewares)

    var handler = build_function_call(controllers_path, path_element)
    middlewares.push(handler)

    path = (version === ROOT_VERSION) ? path : '/' + version + path
    rest_path = (version === ROOT_VERSION) ? path : '/' + version + rest_path
    router[method](path, middlewares)
    router[method](rest_path, middlewares)
  }
}

var build_routes = function (routes_path) {
  var routes = {}
  var GET_public = {}
  var GET_private = {}
  var POST_public = {}
  var POST_private = {}
  var PUT_public = {}
  var PUT_private = {}
  var DELETE_public = {}
  var DELETE_private = {}

  var version_folders = []
  var files = fs.readdirSync(routes_path)
  files.forEach(function (file_name) {
    var file_path = path.join(routes_path, file_name)
    if (fs.lstatSync(file_path).isDirectory()) {
      if (file_name[0] !== 'v' || isNaN(file_name.substring(1, file_name.length))) {
        throw new Error('version folders under routes path must be of format "v"<number>')
      }
      version_folders.push(file_name)
    }
  })
  version_folders.sort(function (folder1, folder2) {
    return parseInt(folder1.substring(1, folder1.length), 10) - parseInt(folder2.substring(1, folder2.length), 10)
  })
  version_folders.unshift(ROOT_VERSION)
  version_folders.forEach(function (version) {
    merge_route(GET_public, 'GET-public.json')
    merge_route(GET_private, 'GET-private.json')
    merge_route(POST_public, 'POST-public.json')
    merge_route(POST_private, 'POST-private.json')
    merge_route(PUT_public, 'PUT-public.json')
    merge_route(PUT_private, 'PUT-private.json')
    merge_route(DELETE_public, 'DELETE-public.json')
    merge_route(DELETE_private, 'DELETE-private.json')

    routes[version] = {
      // Routing settings
      GET: { Public: clone(GET_public), Private: clone(GET_private) },
      POST: { Public: clone(POST_public), Private: clone(POST_private) },
      PUT: { Public: clone(PUT_public), Private: clone(PUT_private) },
      DELETE: { Public: clone(DELETE_public), Private: clone(DELETE_private) }
    }

    function merge_route (route, file_name) {
      var versioned_routes_path = version === ROOT_VERSION ? routes_path : path.join(routes_path, version)
      var route_path = path.join(versioned_routes_path, file_name)
      try {
        var json = jf.readFileSync(route_path)
        Object.keys(json).forEach(function (path) {
          json[path].function_name = version === ROOT_VERSION ? json[path].function_name : (version + '.' + json[path].function_name)
        })
        merge(route, json)
      } catch (e) {
        // file does not exist - do nothing
      }
    }
  })

  return routes
}

module.exports = function (routes_path, controllers_path, auth, router, custom_middlewares) {
  var routes = build_routes(routes_path)
  router = router || express.Router()
  for (var version in routes) {
    for (var method in routes[version]) {
      connect_paths(router, version, method.toLowerCase(), controllers_path, auth, routes[version][method].Public, false, custom_middlewares)
      connect_paths(router, version, method.toLowerCase(), controllers_path, auth, routes[version][method].Private, true, custom_middlewares)
    }
  }
  console.log('----------------------------------------------------------------------------------')
  console.log('-------------------------------   Created Routes   -------------------------------')
  console.log('----------------------------------------------------------------------------------')

  return router
}
