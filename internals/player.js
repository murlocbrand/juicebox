var spawn = require('child_process').spawn
var exec = require('child_process').exec
var fs = require('fs')

// Which program we use to play audio.
// Defined to be first program which passes 'check'.
var player = undefined

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
		'-autoexit',	// autoexit when stdin is empty
		'-nodisp',	// pls no window, ok ty
		'-'		// read from stdin
	], {
		// Since node 0.9.5 we must make sure that data on stderr/stdout
		// is piped to /dev/null or buffers become filled and block.
		stdio: ['pipe', 'ignore', 'ignore']
	})

	return instance
}

// Kill process by SIGHUP
// TODO: Investigate which signal to use. Maybe SIGINT?
// TODO: Fix plugins piping data into this process crashing when stream closes.
function kill () {
	if (instance)
		instance.kill('SIGHUP')

	instance = undefined
}



module.exports = function (conf, preproc, plugins) {
	// Only ffplay and avplay are supported due to their extreme similarity :>
	// TODO: Add mplayer/mpd/.. and their associated options
	check('ffplay')
	check('avplay')

	return {
		start:   start,
		stop:    kill,
		playing: function () { return instance !== undefined },
		program: function () { return player },
		process: function () { return instance }
	}
}
