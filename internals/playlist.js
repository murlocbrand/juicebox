/*
 * Playlist module that handles creation, manipulation and deletion.
 * Image a folder exposed as a restful resource:
 * 
 *	GET /		--> [playlist1, playlist2, .]	// list all playlists
 *	GET /:name	--> [ url, url, url ]		// view a playlist
 *	PUT /:name	[ url, url, url ]		// update a playlist
 *	POST /:name	[ url, url, url ]		// create a playlist
 *	DEL /:name					// delete a playlist
 *
 * Some nifty things you can do:
 *
 *	request('/queue').pipe(request.post('/playlist/best4ever'))
 *
 * Warning: Since this module allows filenames it is definitely possible to
 * try and do relative-path attacks, e.g reading /etc/passwd
 *
 * Some basic protection against this is in use. (path.format({}))
 * It is at least not possible to do outright requests like:
 *
 *		/etc/passwd
 *		%2Fetc%2Fpasswd
 */
var fs = require('fs')
var path = require('path')

var router = require('express').Router()
var pconf = { enabled: false, root: './playlists' }

function initialize (conf) {
	pconf = conf.playlist

	if (pconf.enabled)
		setupFull()
	else
		setupDisabled()

	pconf.root = path.resolve(path.normalize(pconf.root))

	return router
}

function setupFull () {
	fs.readdir(pconf.root, function (err, files) {
		if (err)
			fs.mkdir(pconf.root, function (mkerr) {
				if (mkerr)
					console.error('error creating playlist directory', pconf.root)
				else
					console.log('created playlist directory', pconf.root)
			})
	})		

	// Read all folder contents, don't store secret stuff here :>
	router.get('/', function (req, res) {
		fs.readdir(pconf.root, function (err, files) {
			if (err) {
				res.status(500).send('Error listing playlists').end()
				console.error(err.message)
				return
			}

			res.json(files).end()
		})
	})

	router.route('/:index')
		.all(function (req, res, next) {
			req.file = path.format({
				root: '/',
				dir: pconf.root,
				base: req.params.index + '.json',
				ext: '.json',
				name: req.params.index
			})
			next()
		})
		.get(function (req, res) {
			var stream = fs.createReadStream(req.file)

			stream.on('open', function () { 
				res.set('Content-Type', 'application/json')
				stream.pipe(res)
			})

			stream.on('error', function (err) {
				res.status(404).send('Probably not found').end()
				console.log(err)
			})
		})
		.put(function (req, res) {
			var stream = fs.createWriteStream(req.file)

			stream.on('open', function () {
				req.pipe(stream)
			})

			stream.on('error', function (err) {
				res.status(404).send('Probably not found').end()
				console.log(err)
			})

			stream.on('close', function () {
				res.status(200).send('Updated').end()
			})
		})
		.post(function (req, res) {

		})
		.delete(function (req, res) {
		
		})
}

function setupDisabled () {
	var disabled = function (req, res) {
		res.status(501).send('Playlist feature is disabled').end()
	}

	// Disable playlist listing
	router.get('/', disabled)

	// Disable all playlist interactions
	router.route('/:index')
		.all(disabled)
}

module.exports = function (conf, preproc, plugins) {
	return initialize(conf)
}
