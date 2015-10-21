var async = require('async')
var ascoltatori = require('ascoltatori')

module.exports = function (settings, callback) {
	ascoltatori.build(settings, function (err, ascoltatore) {
		var available_channels = []
		var publishing_channels = settings.publishing_channels || []
		ascoltatori.subscribe('channels/+', function (channel, message) {
			var method = channel.split('/')[1]
			if (method === 'getChannels') {
				async.each(publishing_channels, function (publish_channel, cb) {
					ascoltatori.publish('channels/channel', publish_channel, cb)
				},
				function (err) {
					console.error(err)
				})
			}
			if (method === 'channel') {
				if (available_channels.indexOf(message) == -1) {
					available_channels.push(message)
				}
			}
		})
		return {
			subscribe: function (channel, callback) {
				ascoltatori.subscribe(channel, callback)
			},

			publish: function (channel, message, callback) {
				ascoltatori.publish(channel, message, callback)
			},

			available_channels: available_channels
		}
	})
}