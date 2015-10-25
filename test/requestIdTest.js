var casimircore = require('..')()
var requestid = casimircore.request_id({secret: '1234', namespace: 'server1'})
var request = require('supertest')
var express = require('express')
var assert = require('assert')

var rid = 'server1-7d3f17a1-f94c-46b0-a69f-b54a71f8415d'
var fakeRid = '123'
var sid = '8f79a94cbe09bdb4ce283e9a67c518c5'
var wrongSid = '8f78a94cbe09bdb4ce283e9a67c518c5'
var app = express()

app.use(requestid)
app.get('/', function (req, res, next) {
  return res.send(200)
})
app.use(casimircore.error('development'))

describe('Checking requestid', function () {
  it('should return 200 with a request ID in the response header', function (done) {
    request(app)
    .get('/')
    .expect(function (res) {
      assert.equal(res.headers['request-id'].split('-')[0], 'server1', 'Namespace should be server1')
    })
    .expect(200, done)
  })
  it('should return 200 and ignore our request-id', function (done) {
    request(app)
    .get('/')
    .set('request-id', fakeRid)
    .expect(function (res) {
      var resRid = res.headers['request-id']
      assert.notEqual(resRid, fakeRid, 'Should have ignored the fakeRid')
      assert.equal(resRid.split('-')[0], 'server1', 'Namespace should be server1')
    })
    .expect(200, done)
  })
  it('should return 200 since rid and sid are correct', function (done) {
    request(app)
    .get('/')
    .set('request-id', rid)
    .set('service-secret', sid)
    .expect('request-id', rid)
    .expect(function (res) {
      assert.equal(res.headers['request-id'].split('-')[0], 'server1', 'Namespace should be server1')
    })
    .expect(200, done)
  })
  it('should return 401 since sid exist without rid', function (done) {
    request(app)
    .get('/')
    .set('service-secret', sid)
    .expect(401, done)
  })
  it('should return 401 since sid is wrong', function (done) {
    request(app)
    .get('/')
    .set('request-id', rid)
    .set('service-secret', wrongSid)
    .expect(401, done)
  })
})
