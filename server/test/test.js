
process.env.NODE_ENV = 'test'

var express = require('express');
var server = require('./../server.js');

var assert = require("assert");
var request = require('supertest');

var app = express();
var http;

before(function(done) {

  server(true).then(function(router) {
    app.use('/api', router);
    var otherDone = done;
    http = app.listen(0, function() {
      done();
    });
  })
})

after(function() {
  http.close();
})

describe('User management', function() {

  var agent = request.agent(app);

  it('reports status', function(done) {
    request(app).get('/api/status').send().expect(200, done);
  })

  it('registers a user', function(done) {

    request(app).post('/api/register').
        send({ username: 'test1@example.com', password: 'jook9Nah' })
        .expect('Content-Type', /json/)
        .expect(200, done);
  });

  it('registers another user', function(done) {

    request(app).post('/api/register').
        send({ username: 'test2@example.com', password: 'quee1Cae' })
        .expect('Content-Type', /json/)
        .expect(200, done);
  });

  it('detects duplicate registration', function(done) {

    request(app).post('/api/register').
        send({ username: 'test1@example.com', password: 'Yohch1pu' })
        .expect('Content-Type', /json/)
        .expect(400, {message: 'Username already taken'}, done)
  });

  it('detects empty username', function(done) {

    request(app).post('/api/register').
        send({password: 'Yohch1pu' })
        .expect('Content-Type', /json/)
        .expect(400, {message: 'Username is empty'}, done)
  });

  it ('detects dangerous username', function(done) {
    request(app)
        .post('/api/register')
        .send({username: '<username>', password: 'Yohch1pu'})
        .expect(400, {message: 'Username must be an email address'}, done);
  })

  it('detects empty password', function(done) {

    request(app).post('/api/register').
        send({username: 'test3@example.com', password: '' })
        .expect('Content-Type', /json/)
        .expect(400, {message: 'Password is empty'}, done)
  });

  it('should login user upon registration', function(done) {

    agent.post('/api/register').
        send({username: 'test3@example.com', password: 'pePhiB4b'})
        .expect('Content-Type', /json/)
        .expect(200, {}, done)
  });

  it('should report logged-in user', function(done) {
    agent.get('/api/status').send()
        .expect(200, {username: 'test3@example.com'}, done);

  });

})

describe('Login and logout', function() {

  var agent = request.agent(app);

  it('should login user 1', function(done) {
    agent.post('/api/login').send({ username: 'test1@example.com', password: 'jook9Nah' })
        .expect(200, {}, done);
  });

  it('should login user 1 again', function(done) {
    agent.post('/api/login').send({ username: 'test1@example.com', password: 'jook9Nah' })
        .expect(200, {}, done);
  });

  it('should verify username', function(done) {
    agent.post('/api/login').send({ username: 'test11@example.com', password: 'jook9Nah' })
        .expect(400, {message: 'The username/password combination is not valid'}, done);
  });

  it('should verify password', function(done) {
    agent.post('/api/login').send({ username: 'test1@example.com', password: '12345678' })
        .expect(400, {message: 'The username/password combination is not valid'}, done);
  });

  it('should report logged-in user', function(done) {
    agent.get('/api/status').send()
        .expect(200, {username: 'test1@example.com'}, done);

  });

  it('should support logout', function(done) {
    agent.post('/api/logout').send()
        .expect(200, {}, done);
  });

  it('should report us logged out', function(done) {
    agent.get('/api/status').send()
        .expect(200, {}, done);
  });

  it('should report duplicate logout', function(done) {
    agent.post('/api/logout').send()
        .expect(400, {message: 'Not logged in'}, done);
  });

})

describe('Trip operations', function() {

    var agent = request.agent(app);

    it ('should require authentication', function(done) {
        agent.get('/api/trips').send()
            .expect(403, {message: "Not authorized"}, done);
    });

    it('should login user 1', function(done) {
        agent.post('/api/login').send({ username: 'test1@example.com', password: 'jook9Nah' })
            .expect(200, {}, done);
    });

    it ('should start with empty list of trips', function(done) {
        agent.get('/api/trips').send()
            .expect(200, [], done);
    });

    it ('should report non-existent trips', function(done) {
        agent.get('/api/trips/17').send()
            .expect(400, {message: 'Specified trip does not exist'}, done);
    });

    it ('should create a trip', function(done) {
        agent.post('/api/trips').send({
            destination: "Mars",
            start: "2015-05-10T00:00:00.000Z",
            end: "2015-05-13T00:00:00.000Z"
        }).expect(200, {id: 1}, done);
    })

    it ('should modify a trip', function(done) {
        agent.put('/api/trips/1').send({
            destination: "Mars",
            start: "2015-05-10T00:00:00.000Z",
            end: "2015-05-13T00:00:00.000Z",
            comment: 'Must be fun'
        }).expect(200, {}, done);
    })


    it ('should report the trip', function(done) {
        agent.get('/api/trips').send().expect(200, [
            {destination: 'Mars', id: 1, start: '2015-05-10T00:00:00.000Z', end: "2015-05-13T00:00:00.000Z",
             username: 'test1@example.com', comment: 'Must be fun'}
        ], done);
    })

    it ('should delete the trip', function(done) {
        agent.delete('/api/trips/1').send().expect(200, {}, done);
    })

    it ('should report no trips now', function(done) {
        agent.get('/api/trips').send().expect(200, [], done);
    })

})