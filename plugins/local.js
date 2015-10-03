/*
 * Audio module for playing local music files.
 *
 *	/home/musicman/mymusic/some-song.mp3
 */

var path = require('path')
var fs = require('fs')

function isLocalUri (uri) {	
	// Because doing synchronous io is (a bit) slow, try to rule out
	// obvious false cases. Depending on usage this might need to
	// be optimized, especially if only local files are used.

	// HTTP(S)-based urls should always be prefixed with http/https
	var isWeb = uri.indexOf('http') === 0 || uri.indexOf('https') === 0
	
	// If there is some sort of XYZ:// at the start, it's probably
	// network-related. This might need more testing.
	var hasProtocol = /^([a-zA-Z]+\:\/\/)/.test(uri)

	if (isWeb || hasProtocol)
		return false

	try {
		var stats = fs.statSync(path.normalize(uri))
		return stats.isFile()
	} catch (e) {
		return false
	}
}

function streamFile (path) {
	var stream = fs.createReadStream(path)
	
	// If for some reason shit goes down, don't leave my people hanging
	stream.on('error', function (err) {
		console.error(err)
		callback()
	})

	return stream
}

module.exports = {
	playable: isLocalUri,
	stream:   streamFile
}
