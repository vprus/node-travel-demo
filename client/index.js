var React = require('react');
var moment = require('moment');
var request = require('superagent');
var validator = require('validator');

var SignInSignUp = React.createClass({

    render: function() {
        return <div className="toolbar-status">
            <h1></h1>
            <a href="#" className="btn btn-default" onClick={this.props.handleSignin}>Sign In</a>
            <a href="#" className="btn btn-default" onClick={this.props.handleSignup}>Sign Up</a>
            </div>;
    }

});

var Login = React.createClass({

    getInitialState: function() {
        return {
            returningUser: false
        }
    },

    handleNewUser: function() {
        this.setState({returningUser: false});
    },

    handleReturningUser: function() {
        this.setState({returningUser: true});
    },

    handleIn: function() {
        var email = this.refs.email.getDOMNode().value;
        if (!validator.isEmail(email)) {
            this.setState({error: "Please specify a valid email"});
            return;
        }
        var password = this.refs.password.getDOMNode().value;
        if (!password) {
            this.setState({error: "Password cannot be empty"});
            return;
        }

        if (this.state.returningUser) {
            this.props.onSignIn({username: email, password: password});
        }
        else {
            var passwordAgain = this.refs.passwordAgain.getDOMNode().value;
            if (passwordAgain != password) {
                this.setState({error: "Passwords do not match"});
                return;
            }
            this.props.onSignUp({username: email, password: password});
        }
    },

    render: function() {
        var passwordClass;
        var newUserButtonClass="btn btn-default";
        var returningUserButtonClass="btn btn-default";
        if (this.state.returningUser) {
            passwordClass = "returning";
            returningUserButtonClass += " active";
        } else {
            passwordClass = "new";
            newUserButtonClass += " active";
        }
        passwordClass="form-group " + passwordClass;

        var error;
        if (this.props.error || this.state.error) {
            error = <p className="bg-danger">{this.props.error || this.state.error}</p>
        }

        return <form className='login centered-card'>
            <h2>Sign in or Sign up</h2>
            {error}
             <div className="form-group">
                <label for="email" className="sr-only">Email address</label>
                <input ref="email" type="email" className="form-control" id="email" placeholder="Email address"/>
            </div>
            <div className="btn-group form-group text-center" role="group">
                <button type="button" className={newUserButtonClass} onClick={this.handleNewUser}>I am new user</button>
                <button type="button" className={returningUserButtonClass} onClick={this.handleReturningUser}>I am returning user</button>
            </div>
            <div className={passwordClass}>
                <label for="password" className="sr-only">Password</label>
                <input ref="password" type="password" className="form-control" id="password" placeholder="Password" required=""/>
                <input ref="passwordAgain" type="password" className="form-control" id="passwordAgain" placeholder="Confirm Password" required=""/>
            </div>

            <div className="form-group">
             <button className="btn btn-primary" onClick={this.handleIn}>Sign in</button>
             </div>

            </form>;
    }
});

var User = React.createClass({
    render: function() {
        
    }
});

var Toolbar = React.createClass({

    handleFilter: function() {
        var value = this.refs.filter.getDOMNode().value;

        this.props.onFilter(value);
    },

    render: function() {

        var rightHand;
        if (this.props.user) 
            rightHand = <User user={this.props.user}/>;
        else
            rightHand = <SignInSignUp handleSignin={this.props.handleSignin} handleSignup={this.props.handleSignup}/>;

        return <div className="toolbar">
            <div className="toolbar-status">
                <h1></h1>
                <a href="#" className="btn btn-primary" onClick={this.props.onCreate}>Create</a>
                <a href="#" className="btn btn-default" onClick={this.props.onPrint}>Print</a>
                <a href="#" className="btn btn-default" onClick={this.props.onLogout}>Logout</a>
            </div>
            <h1>Easy Travel</h1> <input ref="filter" type="text" className="trip-filter" placeholder="Filter trips" onChange={this.handleFilter}></input>
            </div>;
    }
});

var Landing = React.createClass({
    render: function() {
        return <div className="landing">
            <h1>Easy Travel</h1>
            <h2>Keep track of your travel plans</h2>
            <a href="#" className="btn btn-large btn-primary" onClick={this.props.onGetStarted}>Get Started</a>
            </div>
    }
});

var Trip = React.createClass({

    render: function() {

        var now = moment();
        var start = moment(this.props.trip.start);
        var end = moment(this.props.trip.end);

        var remaining;
        if (start.diff(now) > 0) {
            var days = start.diff(now, 'days');
            if (days == 0) {
                remaining = 'today';
            } else {
                remaining = start.fromNow();
            }
        }

        return <div className="trip">
            <div className="trip-header">
            <h1>{this.props.trip.destination}</h1> <span>{remaining}</span>
                <div className='trip-operations'>
                        <h1></h1>
                        <a onClick={this.props.onEdit}><i className="fa fa-pencil"/></a>
                        <a onClick={this.props.onDelete}><i className="fa fa-trash"/></a>
                </div>



            <div>{start.format('D MMM YYYY')} through {end.format('D MMM YYYY')}</div>
                </div>
            <hr/>
            <div className="trip-comments">{this.props.trip.comment || 'No comments'}</div>
            </div>;
    }
    
});

var TripEditor = React.createClass({

    getInitialState: function() {
        return {
            error: null
        }
    },

    handleSave: function() {

        var that = this;

        var destination = this.refs.destination.getDOMNode().value;
        if (!destination) {
            this.setState({error: "Destination is empty"});
            return;
        }

        var start = this.refs.start.getDOMNode().value;
        if (!start) {
            this.setState({error: "Start date is not specified"});
            return;
        }
        start = new Date(start).toISOString();

        var end = this.refs.end.getDOMNode().value;
        if (!end) {
            this.setState({error: "End date is not specified"});
            return;
        }
        end = new Date(end).toISOString();

        var comment = this.refs.comment.getDOMNode().value;

        var trip = {
            destination: destination, start: start, end: end, comment: comment
        }

        if (this.props.trip) {
            // We were editing existing trip.
            trip.id = this.props.trip.id;
            request.put('/api/trips/' + this.props.trip.id).send(trip).end(function (error, response) {
                if (error) {
                    that.setState({error: response.body.message});
                } else {
                    that.props.onSave(trip);
                }
            });

        } else {
            request.post('/api/trips').send(trip).end(function (error, response) {
                if (error) {
                    that.setState({error: response.body.message});
                } else {
                    trip.id = response.body.id;
                    that.props.onCreate(trip);
                }
            });
        }
    },

    render: function() {

        var error;
        if (this.props.error || this.state.error) {
            error = <p className="bg-danger">{this.props.error || this.state.error}</p>
        }

        var trip = this.props.trip || {}

        var buttonLabel = "Create";
        if (this.props.trip) {
            buttonLabel = "Save";
        }

        return <form className='trip-editor centered-card'>
            <h2>Create New Trip</h2>
            {error}
            <div className="form-group">
                <label for="destination">Destination</label>
                <input ref="destination" type="text" className="form-control" id="destination" placeholder="" defaultValue={trip.destination}/>
            </div>
            <div className="form-group">
                <label for="start">Start Date</label>
                <input ref="start" type="text" className="form-control" id="start" placeholder="" defaultValue={trip.start}/>
            </div>
            <div className="form-group">
                <label for="end">End Date</label>
                <input ref="end" type="text" className="form-control" id="end" placeholder="" defaultValue={trip.end}/>
            </div>
            <div className="form-group">
                <label for="comment">Comment</label>
                <textarea ref="comment" id="comment" className="form-control" rows="3" defaultValue={trip.comment}/>
            </div>
            <div className="form-group">
                <button className="btn btn-primary" onClick={this.handleSave}>{buttonLabel}</button>
            </div>

        </form>;

    },

    componentDidMount: function() {
        var s = this.refs.start.getDOMNode();
        $(s).datepicker({autoclose: true});

        var e = this.refs.end.getDOMNode();
        $(e).datepicker({autoclose: true});
    }

});

var Trips = React.createClass({
    
    render: function() {

        var that = this;

        var trips = []

        var filter = that.props.filter;
        if (filter) {
            filter = filter.toLowerCase();
        }

        this.props.trips.forEach(function(t) {

            if (filter)
            {
                if (t.destination.toLowerCase().indexOf(filter) == -1
                    && t.comment.toLowerCase().indexOf(filter) == -1) {
                    return;
                }
            }

            function onEdit() {
                that.props.onEdit(t);
            }

            function onDelete() {
                that.props.onDelete(t)
            }

            trips.push(<Trip trip={t} onEdit={onEdit} onDelete={onDelete}/>);
        });
        return <div className='trips'>{trips}</div>;

        /*
        return <div className="trips">
            <Trip destination="Moscow" start="2015-05-10T00:00:00.000Z" end="2015-05-13T00:00:00.000Z"/>
            <Trip destination="Barcelona" start="2015-06-20T00:00:00.000Z" end="2015-06-26T00:00:00.000Z"/>
            <Trip destination="Prague" start="2015-07-03T00:00:00.000Z" end="2015-07-10T00:00:00.000Z"/>
            </div>;*/
    }

});


var App = React.createClass({

    clearError: function() {
        this.setState({error: null});
    },

    fetchTrips: function() {

        var that = this;

        request.get('/api/trips').send().end(function(error, response) {

            if (error) {
                that.setState({error: response.body.message});
            } else {
                that.clearError();
                that.setState({trips: response.body});
            }
        });

    },

    getInitialState: function() {

        var that = this;
        request.get('/api/status').send().end(function(error, response) {
             if (!error && response.body.username) {
                 that.setState({route: ['trips']});
                 that.fetchTrips();
             } else {
                 this.setState({route: ['landing']});
             }
        });

        return {
            route: ['loading'],
            trips: [],
            filter: null
        }
    },

    handleGetStarted: function() {
        this.setState({
            route: ['login']
        })
    },

    handleSignUp: function(user) {

        var that = this;

        request.post('/api/register').send(user)
        .end(function(error, response) {

            if (error) {
                that.setState({loginError: response.body.message});
            } else {
                that.setState({route: ['trips']});
                that.fetchTrips();
            }

        });
    },

    handleSignIn: function(user) {

        var that = this;

        request.post('/api/login').send(user)
        .end(function(error, response) {

            if (error) {
                that.setState({loginError: response.body.message});
            } else {
                that.setState({route: ['trips']});
            }
        });
    },

    handleLogout: function() {
        var that = this;

        request.post('/api/logout').send()
        .end(function(error, response) {
           if (error) {

           } else {
               that.setState({route: ['login']});
           }
        });
    },

    handleLogout: function() {
        this.setState({
            route: ['login']
        })
    },

    handleCreate: function() {
        this.setState({
            route: ['create']
        })
    },

    handleCreated: function(trip) {
        var trips = this.state.trips;
        trips.push(trip);
        this.setState({
            route: ['trips'],
            trips: trips
        })
    },

    handleEdit: function(trip) {

        this.setState({
            route: ['edit'],
            editedTrip: trip
        })

    },

    handleSave: function(trip) {
        var trips = this.state.trips;
        var i;
        for (i = 0; i < trips.length; ++i) {
            if (trips[i].id === trip.id) {
                trips[i] = trip;
            }
        }
        this.setState({trips: trips, route: ['trips']});
    },

    handleDelete: function(trip) {

        var that = this;

        request.del('/api/trips/' + trip.id).send().end(function(error, response) {
            if (error) {
                this.setState({error: error});
            } else {
                var trips = that.state.trips;
                var index = trips.indexOf(trip);
                trips.splice(index, 1);
                that.setState({trips: trips});
            }
        });

    },

    handleFilter: function(text) {
        this.setState({filter: text});
    },

    render: function() {
        var r = this.state.route[0];
        var content ;
        if (r === 'landing')
            return <Landing onGetStarted={this.handleGetStarted}/>;
        else if (r === 'login')
            return <Login error={this.state.loginError} onSignUp={this.handleSignUp} onSignIn={this.handleSignIn}/>;
        else if (r === 'create')
            return <TripEditor onCreate={this.handleCreated}/>;
        else if (r === 'edit')
            return <TripEditor trip={this.state.editedTrip} onSave={this.handleSave}/>;
        else if (r === 'trips') 
            content = <Trips filter={this.state.filter} trips={this.state.trips} onEdit={this.handleEdit} onDelete={this.handleDelete}/>;
        
        return <div>
            <Toolbar onCreate={this.handleCreate} onPrint={this.handlePrint} onLogout={this.handleLogout} onFilter={this.handleFilter}/>
            {content}
            </div>
    }

});


React.render(
    <App/>,
    document.getElementById('container')
);
