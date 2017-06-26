/*
 * Copyright (c) 2015-2016 PointSource, LLC.
 * MIT Licensed
 */

var request = require('request');
var errors = require('../util/errors.js'),
    mongoose = require('mongoose'),
    User = mongoose.model('User'),
    Record = mongoose.model('Record'),
    Asset = mongoose.model('Asset');

var _logger, _authService, domain;

var google = require('googleapis');

var adminServices = {};

exports.init = function(logger, config, authService, callback) {
    _logger = logger;
    _authService = authService;

    domain = config.get('google').domain;

    callback();
};

/**
 * Returns all the users in the database that match the query passed in
 *
 * @param query the criteria that the users will be searched for
 * @param callback
 */
function getAllUsers(query, callback) {

    var sortOrder = ''; // ascending
    var sortBy = 'email';
    if (query.sortBy) {
        sortBy = query.sortBy;
    }

    User.find({}).sort(sortOrder + sortBy).exec(function(err, users) {
        if (err) {
            return callback(new errors.DefaultError(400, 'Error while getting list of users.'));
        } else {
            return callback(null, users);
        }
    });
}

var _objectUnique = function(a) {
    return a.reduce(function(object, item) {
        object[item.assetID] = item;
        return object;
    }, {});
};

/**
 * Returns the reservations under the user.
 *
 * @param userEmail the email of the user that has the reservations
 * @param callback
 */
//TODO change find to findOne
function getUserReservations(userEmail, callback) {
    //First, find user's ID based on email
    if (userEmail) {
        User.find({
            email: userEmail
        }, {
            '_id': 1
        }).exec(function(err, user) {
            if (err) {
                return callback(new errors.MongooseError(err));
            } else {
                if (!user[0]) {

                    return callback(new errors.DefaultError(401, 'User does not exist with email: ' + userEmail));
                }
                //Then, find all the current records associated with that user
                Record.find({
                    'userID': user[0]._id,
                    'type': {
                        $in: ['checked_out', 'checked_in', 'reserved']
                    }
                }).sort({
                    'created': 1
                }).exec(function(err, records) {
                    if (err) {
                        return callback(new errors.MongooseError(err));
                    } else {
                        /*if(){

                        }*/
                        var activeRecords = [],
                            k;
                        var uniqueObject = _objectUnique(records);

                        for (k in uniqueObject) {
                            if (uniqueObject.hasOwnProperty(k)) {
                                activeRecords.push(uniqueObject[k]);
                            }
                        }

                        records = activeRecords;

                        var assetIDs = [];
                        var returnedReservation = [];
                        for (var i = 0; i < records.length; i++) {
                            assetIDs.push(records[i].assetID);
                        }
                        //Lastly, search through and get the name of the associated assets
                        Asset.find({
                            '_id': {
                                $in: assetIDs
                            }
                        }, {
                            name: 1
                        }).exec(function(err, assets) {
                            if (err) {
                                _logger.error(err);
                                return callback(new errors.MongooseError(err));
                            } else {

                                var prepAssets = {};
                                for (var l = 0; l < assets.length; l++) {
                                    prepAssets[assets[l]._id] = assets[l].name;
                                }

                                var returnedReservations = [];
                                for (var j = 0; j < records.length; j++) {
                                    /*jshint camelcase: false */

                                    if (records[j].type !== 'checked_in') {
                                        var returnedReservation = {
                                            id: records[j]._id,
                                            status: records[j].type,
                                            start: records[j].pickup_date,
                                            end: records[j].return_date,
                                            asset: {
                                                id: records[j].assetID,
                                                name: prepAssets[records[j].assetID]
                                            }
                                        };
                                         returnedReservations.push(returnedReservation);
                                    }
                                }
                                return callback(null, returnedReservations);
                            }
                        });

                    }
                });
            }
        });
    } else {
        return callback(new errors.DefaultError(400, 'User email is undefined! Improper signin'));
    }

}

/**
 * Retrieves the username of the user, given the userID
 *
 * @param userID the userID that the search is based on
 * @param callback
 */
function getUserName(userID, callback) {
    User.find({
        _id: userID
    }).exec(function(err, user) {
        if (err) {
            //_logger.error(err);
            return callback(new errors.DefaultError(404, 'User not found with that ID.'));
        } else {
            var userName = {
                _id: userID,
                name: user[0].name
            };
            return callback(null, userName);
        }
    });
}

/**
 * Returns whether or not the user exists in the database
 *
 * @param userEmail the user that is being checked
 * @param callback
 */
function userExists(userEmail, callback) {
    User.find({
        email: userEmail
    }, {
        '_id': 1
    }).limit(1).exec(function(err, user) {
        if (err) {
            //_logger.error(err);
            return callback(new errors.DefaultError(404, 'User not found with that ID.'));
        } else {
            if (user.length === 0) {
                return callback(null, false); //user does not exist
            } else {
                return callback(null, true); //user exists
            }
        }
    });
}

/**
 * Adds the user to the database. The requestBody should follow the following format:
 *
 * {
 *     "name": {
 *         "first": "Tim",
 *         "last": "Creasman",
 *     },
 *     "email": "tim.creasman@pointsource.com",
 *     "phone": 1111111111,
 *     "role": []
 * }
 *
 * @param requestBody
 * @param callback
 */
function addUser(requestBody, callback) {

    var _user = new User({
        name: requestBody.name,
        email: requestBody.email,
        phone: requestBody.phone,
        role: requestBody.role
    });

    _user.save(function(err) {
        if (err) {
            _logger.error(err);
            return callback(new errors.DefaultError(400, 'Error on persistence layer: ' + err.toString()));
        } else {
            return callback(null, _user);
        }
    });
}

/**
 * Removes the user from the database according to their ID
 *
 * @param userID the removed user's ID
 * @param callback
 */
function removeUser(userID, callback) {

    User.find({
        _id: userID
    }).remove(function(err, asset) {
        if (err) {
            //_logger.error(err);
            return callback(new errors.DefaultError(500, 'Failed at removing asset.'));
        } else {

            callback(null, {
                message: 'Successfully removed asset'
            });

        }
    });
}

/**
 * A call to this endpoint returns all the users associated with the apps registered google account
 */
adminServices.getGoogleUsers = function(callback) {
    _authService.getAuthClient(function(err, authClient){
        if (err) {
            return callback(new errors.DefaultError(500, 'Failed to authenticate the server with Google'));
        } else {
            var service = google.admin('directory_v1');
            service.users.list({
                domain: domain,
                fields: 'users(primaryEmail, name)',
                maxResults: 500, // Default is 100. Maximum is 500.
                auth: authClient
            }, function(err, profiles) {
                if (err){
                    return callback(new errors.DefaultError(err.code, 'Failed to retrieve the list of Google Users'));
                } else {
                    return callback(null, profiles);
                }
            });
        }
    });
};


exports.getAllUsers = getAllUsers;
exports.getUserReservations = getUserReservations;
exports.getUserName = getUserName;
exports.userExists = userExists;
exports.addUser = addUser;
exports.removeUser = removeUser;

exports.adminServices = adminServices;
