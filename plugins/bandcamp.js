var request = require('request')

function isBandcampURL (url) {
	return url.indexOf("popplers") >= 0
}

function stream (url, callback) {
	return request
		.get(url)
		.on('response', function (res) {
			var size = res.headers['content-length']

			// sec = size_bits / bits_per_sec
			// bandcamp usually encodes in mp3/128bit
			// and we need to convert into millisec (setTimeout)
			var time = Math.floor((size * 8) / 128)

			setTimeout(callback, time)
		})
}

module.exports = {
	playable: isBandcampURL,
	stream: stream
}

