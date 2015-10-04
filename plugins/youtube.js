var ytdl = require('ytdl-core')
	
function streamUrl (url) {
	return ytdl(url, { filter: 'audioonly' })
}

function isYouTubeUrl (url) {
	// The standard url must 1) be on youtube 2) have a video.
	var isLong = url.indexOf('youtube.com') > 0 && url.indexOf('?v=') > 0
	
	// There also exists a short form: youtu.be/videoId
	var isShort = url.indexOf('youtu.be') > 0

	return isLong || isShort
}

module.exports = {
	stream:    streamUrl,
	playable : isYouTubeUrl
}
