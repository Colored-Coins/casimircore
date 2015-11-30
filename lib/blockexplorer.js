'use strict'

var request = require('request')
var qs = require('qs')
var util = require('util')
var events = require('events')
var io = require('socket.io-client')

var BlockExplorer = function (blockexplorer_path) {
  var self = this

  self.channels = ['newblock', 'newtransaction', 'newcctransaction', 'revertedblock', 'revertedtransaction', 'revertedcctransaction']
  self.rooms = [
    {
      room: 'transaction',
      key: 'txid'
    },
    {
      room: 'address',
      key: 'address'
    },
    {
      room: 'asset',
      key: 'assetId'
    }
  ]
  self.blockexplorer_path = blockexplorer_path
  self.socket = io(blockexplorer_path + '/events')
  self.socket.on('connect', function () {
    self.channels.forEach(function (channel) {
      self.socket.on(channel, function (data) {
        if (channel === 'newblock') {
          console.log('newblock')
        }
        self.emit(channel, data)
      })
      self.socket.emit('join', channel)
    })
    self.socket.on('transaction', function (data) {
      self.rooms.forEach(function (room) {
        if (data[room.key]) {
          self.emit(room.room + '/' + data[room.key], data)
        }
      })
    })
  })
}

util.inherits(BlockExplorer, events.EventEmitter)

function handleResponse (err, response, body, cb) {
  if (err) return cb(err)
  if (response.statusCode === 204) return cb({code: 204, message: 'no content'})
  if (response.statusCode !== 200) return cb(body)
  if (body && typeof body === 'string') {
    body = JSON.parse(body)
  }
  cb(null, body)
}

BlockExplorer.prototype.get = function (method, params, cb) {
  var params_string = qs.stringify(params)
  var path = this.blockexplorer_path + '/api/' + method + '?' + params_string
  request.get(path, function (err, response, body) {
    handleResponse(err, response, body, cb)
  })
}

BlockExplorer.prototype.post = function (method, params, cb) {
  var path = this.blockexplorer_path + '/api/' + method
  request.post(path, {form: params}, function (err, response, body) {
    handleResponse(err, response, body, cb)
  })
}

BlockExplorer.prototype.join = function (room) {
  var self = this
  self.socket.emit('join', room)
}

BlockExplorer.prototype.leave = function (room) {
  this.socket.emit('leave', room)
}

module.exports = BlockExplorer
