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

var _logger;

exports.init = function(logger, config, callback) {
    _logger = logger;
    callback();
};

/**
 * Returns all the users in the database that match the query passed in
 *
 * @param query the criteria that the users will be searched for
 * @param callback
 */
function getAssetRecords(assetID, callback) {
    var sortOrder = ''; // ascending
    var sortBy = 'email';
    Record.find({
        'assetID': assetID
    }).sort({
        'created': 1
    }).exec(function(err, records) {
        if (err) {
            return callback(new errors.MongooseError(err));
        } else {
            var amountCheckedOut = 0;
            var formattedRecords = [];
            var userIDs = [];
            var adminIDs = [];
            for (var i = 0; i < records.length; i++) {
                userIDs.push(records[i].userID);

                adminIDs.push(records[i].adminID);

            }
            User.find({
                '_id': {
                    $in: userIDs
                }
            }, {
                name: 1
            }).exec(function(err, users) {
                if (err) {
                    return callback(new errors.MongooseError(err));
                } else {
                    User.find({
                        '_id': {
                            $in: adminIDs
                        }
                    }, {
                        name: 1,
                        email: 1
                    }).exec(function(err, adminUsers) {

                        var formattedUser;
                        var formattedUsers = {};
                        for (var i = 0; i < users.length; i++) {
                            formattedUser = {
                                email: users[i].email,
                                name: users[i].name
                            };
                            formattedUsers[users[i]._id] = formattedUser;
                        }

                        var formattedAdminUser;
                        var formattedAdminUsers = {};
                        for (var k = 0; k < adminIDs.length; k++) {
                            if (adminUsers[k] !== undefined) {
                                formattedAdminUser = {
                                    id: adminUsers[k]._id,
                                    name: adminUsers[k].name
                                };
                                formattedAdminUsers[adminUsers[k]._id] = formattedAdminUser;
                            }
                        }
                        for (var j = records.length - 1; j >= 0; j--) {
                            if (records[j].type === 'checked_out') {
                                amountCheckedOut += 1;
                            }
                            var record = records[j];
                            var formattedRecord = {
                                id: record._id,
                                created: record.created,
                                type: record.type,
                                borrower: formattedUsers[record.userID]
                            };

                            if (record.adminID) {
                                formattedRecord['admin_id'] = formattedAdminUsers[record.adminID];
                            }

                            formattedRecords.push(formattedRecord);
                        }
                        var ret = {
                            'amount_checked_out': amountCheckedOut,
                            'records': formattedRecords
                        };
                        return callback(null, ret);
                    });

                }
            });

        }
    });
}

exports.getAssetRecords = getAssetRecords;
