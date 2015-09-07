// 'use strict'

// var passport = require('passport')
// var crypto = require('crypto')
// var LocalStrategy = require('passport-local').Strategy
// var FacebookStrategy = require('passport-facebook').Strategy
// var TwitterStrategy = require('passport-twitter').Strategy
// var GoogleStrategy = require('passport-google-oauth').Strategy
// var BearerStrategy = require('passport-http-bearer').Strategy
// var BasicStrategy = require('passport-http').BasicStrategy
// var casimir = require(__dirname + '/casimir')
// var db = casimir.db

// // Load Models
// var Client = db.get_model('client')
// var User = db.get_model('newuser')
// var Token = db.get_model('token')

// passport.use('client-basic', new BasicStrategy(
//   function (username, password, callback) {
//     Client.findOne({ clientId: username }, function (err, client) {
//       if (err) { return callback(err) }

//       // No client found with that id or bad password
//       if (!client || client.secret !== password) { return callback(null, false) }

//       // Success
//       return callback(null, client)
//     })
//   }
// ))

// passport.use(new BasicStrategy(
//   function (username, password, callback) {
//     User.findOne({ username: username }, function (err, user) {
//       if (err) { return callback(err) }

//       // No user found with that username
//       if (!user) { return callback(null, false) }

//       // Make sure the password is correct
//       user.verifyPassword(password, function (err, isMatch) {
//         if (err) { return callback(err) }

//         // Password did not match
//         if (!isMatch) { return callback(null, false) }

//         // Success
//         return callback(null, user)
//       })
//     })
//   }
// ))

// passport.use(new BearerStrategy(
//   function (accessToken, callback) {
//     Token.findOne({value: accessToken}, function (err, token) {
//       if (err) { return callback(err) }

//       // No token found
//       if (!token) { return callback(null, false) }

//       User.findOne({ _id: token.userId }, function (err, user) {
//         if (err) { return callback(err) }

//         // No user found
//         if (!user) { return callback(null, false) }

//         // Simple example with no scope
//         callback(null, user, { scope: '*' })
//       })
//     })
//   }
// ))

// passport.serializeUser(function (user, callback) {
//   callback(null, user.username)
// })

// passport.deserializeUser(function (username, callback) {
//   User.findOne({username: username}, function (err, user) {
//     callback(err, user)
//   })
// })

// exports.isAuthenticated = passport.authenticate(['basic', 'bearer'], { session: false })
// exports.isBearerAuthenticated = passport.authenticate('bearer', { session: false })
// exports.isClientAuthenticated = passport.authenticate('client-basic', { session: false })

// module.exports = function () {
//   passport.use('local', new LocalStrategy({
//       passReqToCallback: true
//     },
//     function (username, password, done) {
//       User.findOne({ 'local.username': username }, function (err, user) {
//         if (err) { return done(err) }
//         if (!user) {
//           return done(null, false, { message: 'Incorrect username.' })
//         }
//         if (!user.password === password) {
//           return done(null, false, { message: 'Incorrect password.' })
//         }
//         return done(null, user)
//       })
//     }
//   ))

//   passport.use('facebook', new FacebookStrategy({
//       clientID: '',
//       clientSecret: '',
//       callbackURL: '',
//       enableProof: false,
//       passReqToCallback: true
//     },
//     function (req, accessToken, refreshToken, profile, done) {
//       var data = {
//         facebook: {
//           id: profile.id,
//           profile: profile,
//           accessToken: accessToken,
//           refreshToken: refreshToken
//         }
//       }
//       var condition = {}
//       if (req.user && req.user.userId) {
//         condition = {userId: req.user.userId}
//       } else {
//         var userId = crypto.randomBytes(32).toString('Base64')
//         condition = {userId: userId}
//       }

//       User.update(condition, data, {upsert: true}, function (err, user) {
//         return done(err, user)
//       })
//     }
//   ))

//   passport.use('twitter', new TwitterStrategy({
//       consumerKey: '',
//       consumerSecret: '',
//       callbackURL: '',
//       passReqToCallback: true
//     },
//     function (req, token, tokenSecret, profile, done) {
//       var data = {
//         twitter: {
//           id: profile.id,
//           profile: profile,
//           token: token,
//           tokenSecret: tokenSecret
//         }
//       }
//       var condition = {}
//       if (req.user && req.user.userId) {
//         condition = {userId: req.user.userId}
//       } else {
//         var userId = crypto.randomBytes(32).toString('Base64')
//         condition = {userId: userId}
//       }

//       User.update(condition, data, {upsert: true}, function (err, user) {
//         return done(err, user)
//       })
//     }
//   ))

//   passport.use('google', new GoogleStrategy({
//       consumerKey: '',
//       consumerSecret: '',
//       callbackURL: '',
//       passReqToCallback: true
//     },
//     function (req, accessToken, refreshToken, profile, done) {
//       var data = {
//         google: {
//           id: profile.id,
//           profile: profile,
//           accessToken: accessToken,
//           refreshToken: refreshToken
//         }
//       }
//       var condition = {}
//       if (req.user && req.user.userId) {
//         condition = {userId: req.user.userId}
//       } else {
//         var userId = crypto.randomBytes(32).toString('Base64')
//         condition = {userId: userId}
//       }

//       User.update(condition, data, {upsert: true}, function (err, user) {
//         return done(err, user)
//       })
//     }
//   ))

//   return passport
// }
