var spawn = require('child_process').spawn
var exec = require('child_process').exec
var fs = require('fs')

// Which program we use to play audio.
var player = undefined

// Because some process killing is dangerous.
process.on('uncaughtException', function(err) { 
        console.log('deal with it', err) 
	console.log(err.stack)
})        

// Function to check if host can access a specific program.
// Requires 'which' unix tool to work (i.e doesn't work on windows)
// The first program to be found will be selected.
function check (program) {
	exec('which ' + program, function (error, stdout, stderr) {
		process.stderr.write('has ')
		process.stderr.write(program)
		process.stderr.write(' ')
		if (error)
			process.stderr.write('✘')
		else
			process.stderr.write('✔')
		
		if (!error && !player) {
			player = program 
			process.stderr.write(' (selected)')
		}
		
		process.stderr.write('\n')
	})
}

// The currently running program process
var instance = undefined

// Launch a new process
// TODO: Allow plugins to re-define options
function start () {
	if (instance) 
		console.warn('there exists a running player process')

	instance = spawn(player, [
		'-autoexit',	// autoexit when stdin is empty (not 100% acc.)
		'-vn',		// no video
		'-nodisp',	// no display
		'-i', 		// set input
		'pipe:0'	// to stdin
	])

	return instance
}

// Kill process by SIGHUP
// TODO: Investigate which signal to use. Maybe SIGINT?
function kill () {
	if (instance)
		instance.kill('SIGHUP')

	instance = undefined
}

// Only ffplay and avplay are supported due to their extreme similarity :>
// TODO: Add mplayer/mpd/.. and their associated options
check('ffplay')
check('avplay')

module.exports = {
	start:   start,
	stop:    kill,
	playing: function () { return instance !== undefined },
	program: function () { return player },
	process: function () { return instance }
}
