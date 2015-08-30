'use strict';

var express = require('express');
var compress = require('compression');

var server = require('./server/server.js');

var app = express();

app.set('port', process.env.PORT || 3001);

// General middleware for all routes.
app.use(compress());

server().then(function(router) {
  app.use('/api', router);
}).then(function() {
  app.use(express.static(__dirname + '/client'));
}).then(function() {
  app.listen(app.get('port'), function() {
    console.log('Server started at port ' + app.get('port'));
  });
}).done();
