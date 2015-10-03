var request = require('request')
var router = require('express').Router()

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

module.exports = router 
