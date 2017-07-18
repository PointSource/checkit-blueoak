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

var url, _logger, _usersService, companyDomains, serviceAccountKeyFile;

exports.init = function(logger, usersService, config, callback) {
    url = 'https://www.googleapis.com';
    _logger = logger;
    _usersService = usersService;

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
                _usersService.checkForNewUser(profileData, function(err, user) {
                    if (err) {
                        return callback(new errors.DefaultError(500, 'Error creating user.'));
                    } else {
                        console.log('USERS ROLE');
                        console.log(user.role);
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
                    _usersService.checkForNewUser(profileData, function(err, user) {
                        if (err) {
                            return callback(new errors.DefaultError(500, 'Error creating user.'));
                        } else {
                            console.log('USERS ROLE');
                            console.log(user.role);
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

exports.authenticateGoogle = authenticateGoogle;
