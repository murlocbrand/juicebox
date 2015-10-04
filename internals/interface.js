var request = require('request')
var router = require('express').Router()
var metadata = {}

router.use(require('body-parser').json())

router.get('/shuffle', function (req, res) {
	request('http://localhost:8888/queue', function (err, blabla, list) {
		list = JSON.parse(list)
		// sattolo cycle (fisher yates)
		var len = list.length
		while (len > 1) {
			// 0 <= swap <= len-1
			var swap = parseInt(Math.random() * len)
			len = len - 1
			var tmp = list[swap]
			list[swap] = list[len]
			list[len] = tmp
		}

		request({
			url: 'http://localhost:8888/queue',
			method: 'PUT',
			json: { queue: list } 
		}, function (a, b, c) {
			res.redirect('/')
		})
	})
})

router.route('/metadata')
	.get(function (req, res) { 
		res.json(metadata) 
	})
	.put(function (req, res) {
		metadata = req.body
		res.send('Updated')
	})

module.exports = function (conf, preproc, plugins) {
	return {
		router:   router,
		metadata: function (data) {
			if (data)
				metadata = data
			return metadata
		}
	}
}
