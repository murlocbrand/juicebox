var ytdl = require('ytdl-core')
	
function streamUrl (url) {
	return ytdl(url, { filter: 'audioonly' })
}

function isYouTubeUrl (url) {
	// The be playable we need the url to be 1) on youtube 2) have a video
	return url.indexOf('youtube.com') > 0 && url.indexOf('?v=') > 0
}

module.exports = {
	stream:    streamUrl,
	playable : isYouTubeUrl
}
