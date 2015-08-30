'use strict';

var config = require('../config');

var express = require('express');
var session = require('express-session');
var mongo = require('mongodb');
var Q = require('q');
var bcrypt = require('bcrypt');
var mongoStore = require('connect-mongo')(session);
var bodyParser = require('body-parser');

var moment = require('moment');
var validator = require('validator');

var router = express.Router();

// Register a user.
function register(username, password, db, req, res) {

    var users = db.collection('users');

    return Q.fcall(function() {}).then(function() {
        if (!username) {
            throw new Error("Username is empty");
        }

        if (!validator.isEmail(username)) {
            throw new Error("Username must be an email address");
        }

        if (!password) {
            throw new Error("Password is empty");
        }
        if (password.length < 8) {
            throw new Error("Password is too short");
        }
        return true;
    }).then(function() {
        return Q.ninvoke(users, "count", {username: username});
    }).then(function(count) {
        if (count) {
            throw new Error("Username already taken");
        }

        var hash = bcrypt.hashSync(password, bcrypt.genSaltSync());
        var user = {
            username: username,
            password: hash,
            next_trip_id: 1
        }
        return Q.ninvoke(users, "insert", user, {w: 1});
    }).then(function(documents) {
        var id = documents[0]._id;
        req.session.username = username;
        req.session.userid = id;
        return {};
    });
}

function login(db, req, res) {

    var users = db.collection('users');

    return Q.fcall(function() {}).then(function() {

        // Prevent spoofing mongodb queries.
        if (typeof req.body.username !== 'string') {
            throw new Error("Invalid input");
        }
        return Q.ninvoke(users, 'findOne', {username: req.body.username});

    }).then(function(document) {

        if (!document) {
            throw new Error("The username/password combination is not valid");
        }

        if (!bcrypt.compareSync(req.body.password, document.password)) {
            throw new Error("The username/password combination is not valid");
        }

        req.session.username = req.body.username;
        req.session.userid = document._id;

        return {};
    }, function() {
        throw new Error("The username/password combination is not valid");
    });
}

function logout(db, req, res) {

    return Q.fcall(function() {}).then(function() {

        if (!req.session.username) {
            throw new Error("Not logged in");
        }

        req.session.username = req.session.userid = null;
        req.session.save();

    });

}

function getNextTripId(db, username) {

    var users = db.collection('users');

    var r = Q.ninvoke(users, 'findAndModify', { username: username }, [['username', 1]], { $inc: { next_trip_id: 1 } });
    r = r.then(function(document) {
        return document[0].next_trip_id;
    });
    return r;
}

function validateTrip(req, trip) {

    if (!req.body.start) {
        throw new Error("Start time is not specified");
    }
    var m = moment(req.body.start, moment.ISO_8601);
    if (!m.isValid()) {
        throw new Error("Start time is invalid");
    }

    trip.start = m.toDate();

    if (!req.body.end) {
        throw new Error("End time is not specified");
    }
    m = moment(req.body.end, moment.ISO_8601);
    if (!m.isValid()) {
        throw new Error("End time is invalid");
    }
    trip.end = m.toDate();

    if (!req.body.destination) {
        throw new Error("Destination is not specified");
    }
    trip.destination = validator.escape(req.body.destination);

    trip.comment = validator.escape(req.body.comment || '');
}

function createTrip(db, req, res) {
    return Q.fcall(function() {}).then(function() {

        return getNextTripId(db, req.session.username);

    }).then(function(id) {

        var trips = db.collection('trips');

        var trip = {
            username: req.session.username,
            id: id
        };
        validateTrip(req, trip);

        return Q.ninvoke(trips, "insert", trip, {w: 1});
    }).then(function(documents) {
        return {id: documents[0].id};
    })
}

function getTrips(db, req, res) {

    return Q.fcall(function() {}).then(function() {

        var trips = db.collection('trips');

        return Q.ninvoke(trips, 'find', {username: req.session.username});

    }).then(function(cursor) {

        return Q.ninvoke(cursor, 'toArray');

    }).then(function(items) {
        items.forEach(function(item) {
            delete item._id;
        });
        return items;
    });
}

function changeTrip(db, req, res) {

    return Q.fcall(function() {}).then(function() {

        var trips = db.collection('trips');

        var query = {
            username: req.session.username,
            id: +req.params.trip
        };

        var trip = {
        };
        validateTrip(req, trip);

        return Q.ninvoke(trips, 'update', query, {$set: trip}, {w: 1})

    }).then(function() {
        return {}
    });

}

function deleteTrip(db, req, res) {

    return Q.fcall(function() {}).then(function() {

        var trip = +req.params.trip;
        var trips = db.collection('trips');

        Q.ninvoke(trips, 'remove', {username: req.session.username, id: trip}, {w: 1});

    }).then(function() {
        return {};
    });

}


function process(res, promise) {
    promise.then(function(data) {
        res.status(200).send(data);
    }, function(error) {
        res.status(400).send({message: error.message});
    });
}

module.exports = function(resetDb) {

    var r = Q.nfcall(mongo.MongoClient.connect, config.db.url);

    if (resetDb) {
        r = r.then(function(db) {

            var users = db.collection('users');
            return Q.ninvoke(users, 'drop').then(function () {
                return db;
            }, function(error) {
                // Ignore error if collection did not exist.
                return db;
            })
        }).then(function(db) {

            var trips = db.collection('trips');
            return Q.ninvoke(trips, 'drop').then(function() {
                return db;
            }, function(error) {
                return db;
            });
        })
    }

    r = r.then(function(db) {

        router.use(bodyParser.json());

        router.use(session({
            secret: 'aigie2kohZ2iequ1',
            resave: false,
            saveUninitialized: false,
            store: new mongoStore({db: db})
        }));

        router.get('/status', function(req, res) {
            var r = {};
            if (req.session.username) {
                r.username = req.session.username;
            }
            res.status(200).send(r);
        })

        router.post('/register', function(req, res) {
            process(res, register(req.body.username, req.body.password, db, req, res));
        });

        router.use('/login', function(req, res) {
            process(res, login(db, req, res));
        });

        router.use('/logout', function(req, res) {
            process(res, logout(db, req, res));
        });

        router.use('*', function(req, res, next) {
            if (!req.session.username) {
                res.status(403).send({message: "Not authorized"});
            } else {
                next();
            }
        });

        router.get('/trips', function(req, res) {
            process(res, getTrips(db, req, res));
        });

        router.get('/trips/:trip', function(req, res) {
            res.status(400).send({message: "Specified trip does not exist"});
        })

        router.put('/trips/:trip', function(req, res) {
            process(res, changeTrip(db, req, res));
        });

        router.delete('/trips/:trip', function(req, res) {
            process(res, deleteTrip(db, req, req));
        })

        router.post('/trips', function(req, res) {
            process(res, createTrip(db, req, res))
        });

        return router;
    }, function(error) {

        console.log("Error: " + error);

        router.all('*', function(req, res) {
            console.log("Could not connect to database. Will still serve client, but all API calls will fail.");
            res.status(500).send('No database connection');
        });

        return router;
    });

    return r;
}
