// NOT YET TESTED
var req = require('request')

function isBandcampURL (url) {
	// TODO: Allow bandcamp.com links as well (not just poppler)
	return url.indexOf("bandcamp") >= 0 || url.indexOf("poppler") > 0
}

function stream (url) {
	// Fix url if prefixed (piratradio)
	url = url.replace('bandcamp', '')

	return { stdout: req(url) }
}

module.exports = {
	playable: isBandcampURL,
	play: stream
}

