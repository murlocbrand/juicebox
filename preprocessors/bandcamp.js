/*
 * This module preprocesses bandcamp links and turns them into audio streams.
 *
 *	https://bandcamp.com/some/track --> http://popplers5.bandcamp.com/...
 *
 * It also fixes piratradio exported lists:
 *
 *	bandcamphttp://popplers5.bandcamp.com --> http://popplers5.bandcamp.com
 */
var req = require('request')

function parseRawText(text) {
        // Find references to file:{"mp3-128":"popplers"}, which is the direct download link
        var files = text.match(/"file":{"[a-zA-z0-9\-]+":"[htps]{4,5}:\/\/[a-zA-Z\.0-9\/?=\-&;]+"}/g)

        // No tracks found, send error message and bail.
        if (files === null || files === undefined || files.length === 0)
            return
	
	var tracks = []

        for (var i = 0; i < files.length; i++)
            tracks.push(files[i].match(/[htps]{4,5}:\/\/[a-zA-Z\.0-9\/?=\-&;]+/)[0])

        return tracks
}

function requeueTrack (url) {
	req({ 
		url: 'http://localhost:8888/queue',
		method: "POST",
		json: { url: url }
	})
}

function startProcessing (url) {
	// Urls must be protocol-prefixed (http:// or https://) otherwise this
	// will break (bandcamp.com will be first thing).
	var mustResolve = url.indexOf('bandcamp.com') > 0 
			&& url.indexOf('popplers') === -1
	
	// If we start with bandcamp and have popplers, assume it's exported
	var mustFix = url.indexOf('popplers') > 0 && url.indexOf('bandcamp') === 0
	
	if (mustFix) {
		// Only replace the first ocurrence of 'bandcamp' because that
		// is what piratradio prepends/edits, e.g revert to normal.
		requeueTrack(url.replace('bandcamp', ''))
		return true
	}

	if (mustResolve) {
		req(url, function (err, res, body) {
			if (err || res.statusCode !== 200)
				return
			
			var tracks = parseRawText(body)

			if (!tracks || !tracks.length)
				return

			console.log('bandcamp', 'preprocessed', url)
			for (var i = 0; i < tracks.length; i++)
				requeueTrack(tracks[i])
		})
		return true
	}

	return false
}


module.exports = {
	evaluate: startProcessing
}
