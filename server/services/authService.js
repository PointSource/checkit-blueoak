/*
 * Copyright (c) 2015-2016 PointSource, LLC.
 * MIT Licensed
 */


/*jshint camelcase: false */
//TODO concatenate the functionality native and non native auth methods (they are very similar currently)

var request = require('request');
var moment = require('moment');
var _ = require('underscore');
var authUtil = require('../util/authUtil.js');
var errors = require('../util/errors.js'),
    mongoose = require('mongoose'),
    User = mongoose.model('User');
var google = require('googleapis');
var path = require('path');

var url, _logger, serviceAccount, serviceScopes, appAccountEmail,
companyDomains, serviceAccountEmail, serviceAccountKeyFile;

exports.init = function(logger, config, callback) {
    url = 'https://www.googleapis.com';
    _logger = logger;

    serviceAccount = config.get('google').serviceAccount;
    serviceScopes = config.get('google').serviceScopes;
    appAccountEmail = config.get('google').appAccountEmail;

    companyDomains = config.get('companyDomains');

    callback();
};

/**
 * Authenticates a client-side user with Google and gets their Google user information.
 * @param {string} code - One time google access code.
 * @param {string} redirectURI - Google redirect URI.
 */
function authenticateGoogle(idToken, session, callback) {
    getTokenInfo(idToken, function(err, profileData) {
        if (err) {
            return callback(err);
        } else {
            // Ensure only users of pointsource.com can login successfully
            if (_.isEmpty(companyDomains)) {
                //if the user does not exist it creates one and adds it to the database.
                //Either way it returns a user object
                checkForNewUser(profileData, function(err, user) {
                    if (err) {
                        return callback(new errors.DefaultError(500, 'Error creating user.'));
                    } else {
                        profileData.role = user.role;
                        profileData.userId = user._id;
                        return callback(null, profileData);
                    }
                });
            } else {
                _logger.info('Verifying domain: ' + profileData.hd);
                if (_.contains(companyDomains, profileData.hd) === true) {
                    //if the user does not exist it creates one and adds it to the database.
                    //Either way it returns a user object
                    checkForNewUser(profileData, function(err, user) {
                        if (err) {
                            return callback(new errors.DefaultError(500, 'Error creating user.'));
                        } else {
                            profileData.role = user.role;
                            profileData.userId = user._id;
                            return callback(null, profileData);
                        }
                    });
                } else {
                    return callback(new errors.DefaultError(401,
                        'User not authorized for this domain.'));
                }
            }
        }
    });
}

/**
 * Use an id token to retrieve information about the logged in user
 * @param {string} idToken - Google id token.
 */
function getTokenInfo(idToken, callback) {
    var infoApiUrl = 'https://www.googleapis.com/oauth2/v3/tokeninfo?id_token=' + idToken;
    request.get({
        url: infoApiUrl,
        json: true
    }, function(err, response) {
        var googleError = errors.getGoogleError(err, response);
        if (googleError != null) {
            return callback(googleError);
        }
        var profile = response.body;

        _logger.info('Profile request complete');
        var profileData = {};
        profileData.email = profile['email'];
        profileData.name = {
            first: profile['given_name'],
            last: profile['family_name']
        };
        profileData.hd = profile['hd'];
        profileData.sub = profile['sub'];

        callback(null, profileData);
    });
}

//TODO move to usersService?
function checkForNewUser(userInfo, callback) {
    User.find({
        email: userInfo.email
    }, {
        '_id': 1, //Limit the call to return only the user's id and role
        'role': 1
    }).limit(1).exec(function(err, user) {
        if (err) {
            //_logger.error(err);
            return callback(new errors.DefaultError(500, 'Could not connect to database.'));
        } else {
            //user does not exist
            if (user.length === 0) {
                var _user = new User({
                    name: userInfo.name,
                    email: userInfo.email,
                    phone: '0000000000',
                    role: 0
                });
                _user.save(function(err) {
                    if (err) {
                        return callback(new errors.DefaultError(400, 'Error on persistence layer: ' + err.toString()));
                    } else {
                        return callback(null, _user);
                    }
                });
            } else {
                return callback(null, user[0]); //user exists
            }
        }
    });
}

function getAuthClient(callback){
    
    var authClient = new google.auth.JWT(
        serviceAccount.email,
        path.resolve('./', serviceAccount.keyFile),
        null,
        serviceScopes,
        appAccountEmail
    );
    
    authClient.authorize(function(err, result) {
        if (err) {
            return callback(err);
        }
        return callback(null, authClient);
    });
}

//
exports.getAuthClient = getAuthClient;
exports.authenticateGoogle = authenticateGoogle;
