'use strict'

var express = require('express')
var merge = require('merge')

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
    if (url_param) {
      param = url_param
      request.checkParams(param_name, 'Invalid url param')[param_name]()
    } else if (query_param) {
      param = query_param
      request.checkQuery(param_name, 'Invalid get param')[param_name]()
    } else if (body_param) {
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
  params_template = params_template || []
  for (var index = 0; index < params_template.length; index++) {
    var param_name = params_template[index]
    var param
    if (request.check) {
      if (mandatory) request.assert(param_name, 'Missing param: ' + param_name).notEmpty()
      var errors = request.validationErrors()
      if (errors) {
        if (!Array.isArray(errors)) errors = [errors]
        var msgs = errors.map(function (err) {
          return parse_error_msg(err)
        })
        var msg = msgs.join('\n')
        // console.error(msg)
        var err = {
          message: msg,
          status: 400
        }
        return callback(err)
      }
      param = extract_param(request, param_name)
      errors = request.validationErrors()
    } else {
      param = extract_param(request, param_name)
    }
    if (param) params[param_name] = param
  }
  callback(null, params)
}

function build_function_call (path, function_name, params_template, optional_params_template) {
  return function (request, response, next) {
    get_params_from_request(request, params_template, true, function (err, params) {
      if (err) return next(err)
      get_params_from_request(request, optional_params_template, false, function (err, params2) {
        if (err) return next(err)
        merge(params, params2)
        var function_name_array = function_name.split('.')
        var handler = require(path + function_name_array[0] + '.js')[function_name_array[1]]
        request.data = params
        return handler(request, response, next)
      })
    })
  }
}

function connect_paths (router, method, controllers, auth, routes, private_area) {
  for (var path in routes) {
    var middlewares = []
    if (auth) {
      middlewares.push(auth.verify_token)
      if (private_area) {
        if (users && users.length > 0) {
          middlewares.push(auth.verify_specific_user_token(users))
        }
        middlewares.push(auth.check_access)
      }
    }

    var path_element = routes[path]
    var function_name = path_element.function_name
    var params = path_element.params
    var optional_params = path_element.optional
    var users = path_element.users
    private_area && params.push('token')
    var rest_path = build_rest_path(path, params)
    var handler = build_function_call(controllers, function_name, params, optional_params)
    middlewares.push(handler)
    router[method](path, middlewares)
    router[method](rest_path, middlewares)
  }
}

module.exports = function (routes, controllers, auth, router) {
  var router = router || express.Router()
  connect_paths(router, 'get', controllers, auth, routes.GET.Public)
  connect_paths(router, 'get', controllers, auth, routes.GET.Private, true)
  connect_paths(router, 'post', controllers, auth, routes.POST.Public)
  connect_paths(router, 'post', controllers, auth, routes.POST.Private, true)
  connect_paths(router, 'put', controllers, auth, routes.PUT.Public)
  connect_paths(router, 'put', controllers, auth, routes.PUT.Private, true)
  connect_paths(router, 'delete', controllers, auth, routes.DELETE.Public)
  connect_paths(router, 'delete', controllers, auth, routes.DELETE.Private, true)
  console.log('----------------------------------------------------------------------------------')
  console.log('-------------------------------   Created Routes   -------------------------------')
  console.log('----------------------------------------------------------------------------------')

  return router
}
