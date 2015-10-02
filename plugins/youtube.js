// Status: Seems to work nicely
var ytdl = require('ytdl-core')
	
function streamUrl (url, callback) {
	var stream = ytdl(url, { filter: 'audioonly' })

	// The info event is emitted by ytdl when metadata has been fetched
	stream.on('info', function (info, format) {
		// Because avplay/ffplay sometimes fail to autoexit we may need
		// to manually kill it. Here we use seconds which isn't very
		// accurate, but we skip having to parse content lengths and
		// bitrates to figure out millisec-accurate duration.
		setTimeout(callback, info.length_seconds * 1000)
	})

	return { stdout : stream }
}

function isYouTubeUrl (url) {
	// The be playable we need the url to be 1) on youtube 2) have a video
	return url.indexOf('youtube.com') > 0 && url.indexOf('?v=') > 0
}

module.exports = {
	play:      streamUrl,
	playable : isYouTubeUrl
}
