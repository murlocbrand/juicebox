// Copyright 2015 Axel Smeets
var request = require('request'),
    fs = require('fs'),
    express = require('express'),
    toml = require('toml')

var app = express()
app.set('json spaces', 4)

var conf = {}

try {
	conf = toml.parse(fs.readFileSync('config.toml'))
} catch (e) {
	console.error("Error parsing 'config.toml' on", e.line + ':' + e.column)
	console.error(e.message)
	process.exit(1)
}

var internals = require('./internals')

// Human url --> Audio track processors
var preprocessors = require('./preprocessors')

// Audio track --> Audio stream processors
var plugins = require('./plugins')

// Audio player { play, stop, playing, process }
var player = internals.player

// Play queue { peek, pop, length, router }
var queue = internals.playqueue(conf, preprocessors)

// Playlist router
var playlists = internals.playlist(conf)

// Each play has a unique ID to prevent past event callbacks to
// mess with the currently playing track.
var currentId = 'undefined-sequence'

// Somewhat dangerous but necessary due to how ytdl works
// and how /next route kills pipes that are still in use.
// TODO: Kill both source and drain (not just drain).
process.on('uncaughtException', function (err) {
	var safeErrors = [
		"status code 302",	// ytdl-core when google is lame
		"read ECONNRESET",	// player.kill() on /next (pipe)
		"Could not extract signature deciphering actions"
	]

	console.log(err.message, safeErrors.indexOf(err.message))

	// If it's an error we can't handle, then fuck it: bail away
	if (safeErrors.indexOf(err.message) === -1) {
		console.error(err)
		console.log(err.stack)
		process.exit(1)
	}

	// ECONNRESET is triggered by us, not intentionally, but to play next
	// track. If we did onEnd()/stop() on it as well we'd be skipping tracks
	// and maybe doing chain reaction stuff.
	else if (err !== safeErrors[1])
		player.stop()	
})

function onEnd () {
	if (queue.length === 0) {
		if (player.playing())
			player.stop()
		return
	}

	// currently playing is always index 0
	var next = queue.peek()
	var plugin
	for (var i = 0; i < plugins.length; i++) {
		plugin = plugins[i]
		if (plugin.playable(next))
			break
		plugin = undefined
	}

	if (plugin) {
		if (player.playing())
			player.stop()

		player.start()
	
		// TODO: Use some proper ID generation instead of this mess.
		currentId = Math.floor(Math.random() * 100000).toString(16)
		var thisId = currentId

		// Either the player exits by itself or the plugin will
		// forcibly kill it when track is done. It doesn't matter
		// by which reason the process is killed, so just go next.
		player.process().on('exit', function () {
			console.log('player exited',  thisId)
			// Push the track we just played onto the queue tail to
			// get a circular, 0-is-current play queue.
			queue.pop()
			onEnd()
		})	
	
		// Each plugin provides a stream which contains the audio and
		// we pipe that stream into the player's input.
		// This approach relies on player automagically recognizing
		// codecs and bitrates (if not more things as well). It is,
		// however, very simple to use.
		// TODO: Perhaps use audiocogs and node-speaker combination
		// instead.
		plugin
			.stream(next, function () {
				// This function will be called when the plugin
				// thinks the track is over. The plugin may be
				// late and we've already started the next track.
				// If the plugin killed the player we'd start a
				// chain reaction of process killing.
				if (thisId === currentId) {
					console.log('plugin exited in time', thisId)
					player.stop()
				} else {
					console.log('plugin exited too late', thisId)
				}
			})
			.pipe(player.process().stdin)

		console.log('streaming', '(' + thisId + ')')
	} else {
		// If we didn't find a plugin to play this track, then skip it.
		queue.pop()
		onEnd()
	}
}

// On the index page we provide some status information.
app.get('/', function (req, res) {
	res.write('player:        ' + player.program() + '\n')

	res.write('player status: ')
	if (player.playing()) {
		res.write('playing')
		res.write(' (' + currentId + ')')
	} else {
		res.write('stopped/ready')
	}
	res.write('\n')

	res.write('\n')
	res.write('in play queue: ')
	if (queue.length() === 0)
		res.write('empty')
	else
		res.write(queue.length().toString())
	res.write('\n')

	res.write('\n')
	res.write('routes:\n')
	res.write('-------------------------------------------\n')
	;[ 
		'play next track:          /next',
		'',
		'inspect play queue:       /queue',
		'get specific queue index: /queue/:index',
		'',
		'list all playlists:       /playlist',
		'view a specific playlist: /playlist/:index'
	].forEach(function (line) {
		res.write(line)
		res.write('\n')
	})
	
	res.end()
})

// A hacky control route to force next track.
app.get('/next', function (req, res) {
	res.redirect('/')
	if (player.playing())
		player.stop()
	else
		onEnd()
})

app.use('/queue', queue.router)

app.use('/playlist', playlists)

app.listen(8888, function () {
    console.log('juicebox listening on 8888')
})
