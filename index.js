// Copyright 2015 Axel Smeets
var request = require('request'),
    fs = require('fs'),
    express = require('express')

var app = express()
var player = require('./internals').player

var plugins = require('./plugins')
var preprocessors = require('./preprocessors')

var queue = [], track = -1
try {
	queue = JSON.parse(fs.readFileSync('queue.json'))
	console.log('read', queue.length, 'tracks from queue.json')
} catch (e) {}

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

	var nextIndex  = (track + 1) % queue.length
	track = nextIndex

	var next = queue[nextIndex]
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
			console.log('player exited', nextIndex, thisId)
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
					console.log('plugin exited in time', nextIndex, thisId)
					player.stop()
				} else {
					console.log('plugin exited too late', nextIndex, thisId)
				}
			})
			.pipe(player.process().stdin)

		console.log('streaming', nextIndex, '(' + thisId + ')')
	} else {
		// If we didn't find a plugin to play this track, then skip it.
		onEnd()
	}
}

app.use(require('body-parser').json())

// On the index page we provide some status information.
app.get('/', function (req, res) {
	res.write('player: ' + player.program() + '\n')

	res.write('player status: ')
	if (player.playing()) {
		res.write('playing')
		res.write(' (' + currentId + ')')
	} else {
		res.write('stopped/ready')
	}
	res.write('\n')

	res.write('in queue: ')
	if (queue.length === 0)
		res.write('empty')
	else {
		res.write(queue.length.toString())
		res.write('\n')

		for (var i = 0; i < queue.length; i++)
			res.write(i + ': ' + queue[i] + '\n')
	}
	res.write('\n')

	res.end()
})

// A hacky control route to force next track.
app.get('/next', function (req, res) {
	res.send('requesting next track')
	if (player.playing())
		player.stop()
	else
		onEnd()
})

// We want the queue to be a RESTful resource
app.get('/queue', function (req, res) {
	res.json(queue).end()
})
// TODO: GET /queue/:index

// Convenience route for adding tracks
app.post('/queue', function (req, res) {
	res.write('adding ')
	res.write(req.body.url)
	res.write('\n')
	res.end()
	
	// Idea here is that a preprocessor will re-queue the track url
	// so if a preprocessor accepts the url, don't add it here. This
	// is mainly focused on resolving lists to individual items, e.g
	// directory listings, youtube playlists, piratradio stations...
	var preprocessed = false
	for (var i = 0; i < preprocessors.length; i++) {
		if (preprocessors[i].evaluate(req.body.url)) {
			preprocessed = true
			// break
		}
	}

	if (!preprocessed) {
		queue.push(req.body.url)

		if (track === -1 && !player.playing())
			onEnd()
		
		fs.writeFile('queue.json', JSON.stringify(queue), function (err) {
			if (err)
				console.warn('error writing queue to file', err)
		})
	}
})
// TODO: PUT /queue
// TODO: PUT /queue/:index

app.listen(8888, function () {
    console.log('juicebox listening on 8888')
})
