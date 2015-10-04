/*
 * This preprocessor turns a piratrad.io/station into a bunch of tracks.
 * Note: Since soundcloud isn't supported yet, those tracks will be skipped.
 */

var pcurl = require('pirate-curl')
var request = require('request')

function processUrl (url) {
	var canProcess = /http(s?)\:\/\/piratrad\.io\/([a-zA-Z0-9]+)/.test(url)
	
	if (!canProcess)
		return false

	var station = /http(s?)\:\/\/piratrad\.io\/([a-zA-Z0-9]+)/.exec(url)[2]
	pcurl(station, ['url', 'title'], function (err, list) {
		if (err)
			return
		console.log('piratrad.io', 'preprocessed', url)
		for (var i = 0; i < list.length; i++) {
			var track = list[i]
			
			// No soundcloud support (yet)
			if (track.url.indexOf('soundcloud.com') >= 0)
				continue

			request({
				url: "http://localhost:8888/queue",
				method: "POST",
				json: { 
					url: track.url, 
					metadata: { title: track.title } 
				}
			})
		}
	})

	return true
}

module.exports = {
	evaluate: processUrl
}
