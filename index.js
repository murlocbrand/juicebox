var request = require('request'),
    express = require('express')

var app = express()
var player = require('./internals').player

var plugins = require('./plugins')

var queue = []

// Each play has a unique ID to prevent past event callbacks to
// mess with the currently playing track.
var currentId = 'undefined-sequence'

var onEnd = function () {
	if (queue.length === 0) {
		if (player.playing())
			player.stop()
		return
	}

	var next = queue.shift()
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

		// Either the player exits by itself or the plugin will
		// forcibly kill it when track is done. It doesn't matter
		// by which reason the process is killed, so just go next.
		player.process().on('exit', function () {
			onEnd()
		})	
		
		// TODO: Use some proper ID generation instead of this mess.
		currentId = Math.floor(Math.random() * 100000).toString(16)
		var thisId = currentId

		// Each plugin should provide a stdout stream which contain
		// the audio stream of the track we want to play.
		plugin
			.play(next, function () {
				// This function will be called when the plugin
				// thinks the track is over. The plugin may be
				// late and we've already started the next track.
				// If the plugin killed the player we'd start a
				// chain reaction of process killing.
				if (thisId === currentId) {
					console.log('plugin exited in time', next)
					player.stop()
				} else {
					console.log('plugin exited too late', next)
				}
			})
			.stdout.pipe(player.process().stdin)
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

	queue.push(req.body.url)
	if (queue.length === 1 && !player.playing())
		onEnd()
})
// TODO: PUT /queue
// TODO: PUT /queue/:index

app.listen(8888, function () {
    console.log('juicebox listening on 8888')
})
