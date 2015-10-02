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

function startProcessing (url) {
	// Urls must be protocol-prefixed (http:// or https://) otherwise this
	// will break. We cannot allow =0 because popppler links usually start
	// that way, especially if they are exported from piratradio.
	var canProcess = url.indexOf('bandcamp.com') > 0 && url.indexOf('popplers') === -1

	if (canProcess) {
		req(url, function (err, res, body) {
			if (err || res.statusCode !== 200)
				return
			
			var tracks = parseRawText(body)

			if (!tracks || !tracks.length)
				return

			console.log('bandcamp', 'preprocessed', url)
			for (var i = 0; i < tracks.length; i++) {
				req({
					url: 'http://localhost:8888/queue',
					method: "POST",
					json: { url: tracks[i] }
				}, function (erra, resa, bodya) {
				})
			}
		})
	}

	return canProcess
}


module.exports = {
	evaluate: startProcessing
}
