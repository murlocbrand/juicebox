var request = require('request')

function isBandcampURL (url) {
	return url.indexOf("popplers") >= 0
}

function stream (url) {
	return request(url)
}

module.exports = {
	playable: isBandcampURL,
	stream: stream
}

