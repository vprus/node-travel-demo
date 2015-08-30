'use strict';

var _ = require('lodash');

var env = process.env.NODE_ENV || 'development';
console.log('Using environment: ' + env);

module.exports = _.extend(
        require('./all'),
        require('./' + env) || {}
);
