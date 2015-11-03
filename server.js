var express = require('express');
var path = require('path');
var app = express();

app.use('/build', express.static('build'));

app.get('/', function (req, res) {
	res.sendfile('./index.html');
});

app.get('/api', function(req, res){
	res.send('api');
});

var server = app.listen(3000, function () {
	var host = server.address().address;
	var port = server.address().port;
	console.log('Example app listening at http://%s:%s', host, port)
});