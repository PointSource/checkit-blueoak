/*
 * Copyright (c) 2015-2016 PointSource, LLC.
 * MIT Licensed
 */


var moment = require('moment');

var request = require('request'),
    errors = require('../util/errors.js'),
    ReadWriteLock = require('rwlock'); // rwlock package for thread safety

var mongoose = require('mongoose'),
    Asset = mongoose.model('Asset'),
    Record = mongoose.model('Record'),
    User = mongoose.model('User'),
    Schema = mongoose.Schema;

var AWS = require('aws-sdk');

var fs = require('fs');

var lock = new ReadWriteLock(); // lock to use with checkout asset function

var _logger,
    assetLocations,
    _usersService,
    _notificationService;

var adminServices = {};

exports.init = function(logger, config, usersService, notificationService, callback) {
    assetLocations = config.get('assetLocations');
    _logger = logger;
    _usersService = usersService;
    _notificationService = notificationService;
    callback();
};

/*
 * Returns the most current record
 */
var _objectUnique = function(a) {
    return a.reduce(function(object, item) {
        object[item.assetID] = item;
        return object;
    }, {});
};

/**
 * Formats assets from the mongoDB to the format the client needs
 * @param {array} assets - The array of assets to format
 * @param {boolean} condensed - Whether or not to condense the data into a minimal format
 */
var _formatAssets = function(assets, condensed, callback) {
    var userIDs = [];
    var assetIDs = [];
    var preppedUsers = {},
        preppedRecords = {};
    var formattedRecords = [];
    var returnedAssets = [];

    for (var i = 0; i < assets.length; i++) {
        assetIDs.push(assets[i]._id);
    }

    //Find, sort, and format the active_reservations field
    Record.find({
        'assetID': {
            $in: assetIDs
        },
        'type': {
            $in: ['checked_out', 'reserved', 'checked_in']
        }
    }).sort({
        'created': 1
    }).exec(function(err, records) {
        if (err) {
            return callback(err);
        } else {

            var activeRecords = [],
                key;
            var uniqueObject = _objectUnique(records);

            for (key in uniqueObject) {
                if (uniqueObject.hasOwnProperty(key)) {
                    activeRecords.push(uniqueObject[key]);
                }
            }
            records = activeRecords;

            for (var i = 0; i < records.length; i++) {
                userIDs.push(records[i].userID);
            }
            User.find({
                '_id': {
                    $in: userIDs
                }
            }, {
                name: 1
            }).sort('assetID').exec(function(err, users) {
                /*jshint camelcase: false */
                if (err) {
                    return callback(err);
                } else {
                    var formattedUser;
                    for (var i = 0; i < users.length; i++) {
                        formattedUser = {
                            id: users[i]._id,
                            name: users[i].name
                        };
                        preppedUsers[users[i]._id] = formattedUser;
                    }
                    for (var j = 0; j < records.length; j++) {
                        //if asset id changes reset record array
                        if (records[j - 1] && !records[j - 1].assetID.equals(records[j].assetID)) {
                            formattedRecords = [];
                        }
                        if (records[j].type !== 'checked_in') {

                            var formattedRecord = {
                                id: records[j]._id,
                                start: records[j].pickup_date,
                                end: records[j].return_date,
                                borrower: preppedUsers[records[j].userID]
                            };

                            //If there is more than one record check to see
                            //If the record after record[j] is of type checked_in,
                            //do not add it to the array
                            //This makes sure a checked_out record will not be added to the active
                            //reservations if the device was checked back in
                            formattedRecords.push(formattedRecord);
                            preppedRecords[records[j].assetID] = formattedRecords;
                        }

                    }
                    for (var k = 0; k < assets.length; k++) {
                        var activeReservations = [];
                        if (preppedRecords[assets[k]._id] !== undefined) {
                            activeReservations = preppedRecords[assets[k]._id];
                        }
                        var returnedAsset;
                        if (condensed) {
                            returnedAsset = {
                                id: assets[k]._id,
                                name: assets[k].name,
                                state: assets[k].status,
                                categories: assets[k].categories,
                                active_reservations: activeReservations
                            };
                        } else {
                            returnedAsset = {
                                id: assets[k]._id,
                                name: assets[k].name,
                                description: assets[k].description,
                                state: assets[k].status,
                                location: assets[k].location,
                                categories: assets[k].categories,
                                attributes: assets[k].attributes,
                                active_reservations: activeReservations,
                                image: assets[k].image
                            };
                        }
                        returnedAssets.push(returnedAsset);
                    }
                    return callback(null, returnedAssets);
                }
            });
        }
    });
};

var _getRecordPickupDate = function(recordID, callback) {
    /*jshint camelcase: false */
    Record.findOne({
        '_id': recordID
    }, {
        'pickup_date': 1
    }, function(err, record) {
        if (err) {
            return callback(new errors.MongooseError(err));
        } else {
            if (!record) {
                return callback(new errors.DefaultError(401, 'No record found with ID: ' + recordID));
            }
            return callback(null, record.pickup_date);
        }
    });
};

/**
 * Retrieves an asset when provided its id
 * @param  {string}   id       The asset's id
 * @param  {Function} callback The function to return upon completetion
 * @return {Function}            The callback function, callback(err, result)
 */
var _getAssetByID = function(id, callback) {
    Asset.findOne({
        '_id' : id
    }, {}, function(err, asset) {
        if (err) {
            return callback(err);
        } else {
            if (!asset) {
                return callback(new errors.DefaultError(401, 'No record found with ID: ' + id));
            }
            return callback(null, asset);
        }
    });
};

/**
 * Helper method to convert checkin, checkout, create, or remove actions into a message.
 * checkin : [User Name] + checked in the [Asset Name] (happyEmoji)
 * checkout : [User Name] + checked out the [Asset Name] (happyEmoji)
 * create : [Asset Name] was successfully added to CheckIT! (happyEmoji)
 * remove : [Asset Name] was removed from CheckIT! (removeEmoji)
 * 
 * @param  {string} userEmail  The email of the user completing the action.
 * @param  {string} adminEmail The email of the admin completeing the action.
 * @param  {object} recordData The data of the record, used for determing action type and
 *                             in some circumstances the asset name.
 * @param  {string} assetName  (Optional) The name of the asset
 * @return {string}            The message
 */
var _notificationHelper = function(userEmail, adminEmail, recordData, assetName) {
    console.log(assetName);

    var _createMessage = function(assetName, userName){
        var msg = '';
        switch (recordData.type) {
        case 'checked_in':
            msg = userName.first + ' ' + userName.last + ' checked in the ' + assetName + '.'; 
            break;
        case 'checked_out':
            msg = userName.first + ' ' + userName.last + ' checked out the ' + assetName + '.';
            break;
        case 'created':
            msg = assetName + ' was successfully added to CheckIT.'; 
            break;
        case 'deleted':
            msg = assetName + ' was removed from CheckIT.'; 
            break;
        }
        return msg;
    };

    _usersService.getUserByEmail(userEmail, function(err, user){
        if (err) {
            _logger(new errors.MongooseError(err));
        } else {
            var userName;
            if (user) {
                userName = user.name;
            } else {
                userName = '';
            }
            if (assetName !== undefined) {
                _notificationService.notify(_createMessage(assetName, userName));
            } else {
                _getAssetByID(recordData.assetID, function(err, asset){
                    if (err) {
                        _logger(new errors.MongooseError(err));
                    } else {
                        assetName = asset.name;
                        _notificationService.notify(_createMessage(assetName, userName));
                    }
                });
            }
        }
    });
    // if (adminEmail) {
    //     var adminName;
    //     _usersService.getUserNameByEmail(adminEmail, function(err, name){
    //         if (err) {
    //             _logger(new errors.MongooseError(err));
    //         } else {
    //             adminName = name;
    //         }
    // });
    // }
};

/*
successfull _createRecord should:
locate the user doing the operation,
create a record with the userID and recordData
TODO FINISH

*/

var _createRecord = function(userEmail, recordData, callback) {
    //locate user doing the operation
    User.findOne({
        'email': userEmail
    }, {
        '_id': 1
    }).exec(function(err, user) {
        if (err) {
            return callback(new errors.MongooseError(err));
        } else {
            if (!user) {
                return callback(new errors.DefaultError(401, 'No user found when creating record. Not signed in?'));
            } else {
                recordData.userID = user._id;
                var _record = new Record(recordData);
                _record.save(function(err) {
                    if (err) {
                        return callback(err);
                    } else { //successful save of record
                        _notificationHelper(userEmail, null, recordData);
                        return callback(null);
                    }
                });
            }
        }
    });
};

/*
then changeAssetState
create a writelock while the asset state is changed

*/
var _changeAssetStatus = function(assetID, status, callback) {
    Asset.findOne({
        '_id': assetID
    }).exec(function(err, asset) {
        if (err) {
            return callback(new errors.MongooseError(err));
        } else if (!asset) {
            var error = {
                message: 'Processing not completed. Someone else is currently processing this asset.',
                status: 202
            };
            //Get details so the most recent is returned
            getAssetDetails(assetID, function(err, asset) {
                if (err) {
                    return callback(new errors.MongooseError(err));
                } else {
                    return callback(error, asset);
                }
            });
        } else {
            Asset.update({
                '_id': assetID
            }, {
                status: status
            }, null, function(err, result) {
                if (err) {
                    return callback(new errors.MongooseError(err));
                } else {
                    getAssetDetails(assetID, function(err, asset) {
                        if (err) {
                            return callback(new errors.MongooseError(err));
                        } else {
                            return callback(null, asset);
                        }
                    });
                }
            });
        }
    });
};

/**
 * Retrieves the correct image URL from the AWS S3 bucket.
 * These URLs are temporary, lasting 15 minutes
 * NOTE: if the image does not exist, this method still returns a URL!
 * Invalid URLs are caught on client-side, in the HTML altimg directive
 *
 * @param name the name of the asset for retrieving the URL
 * @returns a URL of the image.
 */
/*function getAssetImageUrl(name) {
        name += '.png';
        AWS.config.region = 'us-east-1';
        AWS.config.loadFromPath('./awsconfig.json');

        var s3 = new AWS.S3();
        var params = {
            Bucket: 'pscheckit',
            Key: name
        };
        var url = s3.getSignedUrl('getObject', params);
        return url;
}*/

/**
 * Gets all assets from the mongoDB and returns them in the following format:
 * {
 *      "id": Object id from mongo,
 *      "name": name of the asset,
 *      "state": the current availability of an asset (in use, reserved, available, etc.),
 *      "categories": {
 *          "type": type of asset (laptop, watch, phone, etc.),
 *          "os": {
 *          "version": the version of OS,
 *          "name": the name of the OS
 *          }
 *      },
 *      "active_reservations": any current reservations that are either occurring now or will occur in the future
 * }
 * @param {array} query - Query parameter from GET request.
 */
function getAssets(query, callback) {


    var filter = (query.filter) ? query.filter : 'categories.type'; // defaults to filtering categories
    //TODO put this data in a config?
    var allTypes = 'phone tablet laptop webcam camera projector watch misc'.split(' ');
    //var type = [query.type];
    var type = (query.type) ? [query.type] : allTypes;
    Asset.find({}, {
            'categories': 1,
            'name': 1,
            'status': 1
        })
        .sort(filter + '').where(filter)
        .equals({
            $in: type
        }).exec(function(err, assets) {
            if (err) {
                return callback(new errors.MongooseError(err));
            } else {
                _formatAssets(assets, true, function(err, formattedAssets) {
                    if (err) {
                        return callback(
                            new errors.DefaultError(500, 'Error getting assets from server: could not format assets.'));
                    } else {
                        if (assets.length === 0) {
                            return callback(new errors.DefaultError(404, 'No assets found for type: ' + type));
                        } else {
                            return callback(null, formattedAssets);

                        }
                    }
                });
            }
        });
}

/**
 * Gets an asset's details from the mongoDB and returns them in the following non-condensed format:
 * {
 *      "id": Object id from mongo,
 *      "name": name of the asset,
 *      "description": a short (140 characters) description of the asset,
 *      "state": the current availability of an asset (in use, reserved, available, etc.),
 *      "location": the locale of the asset (Raleigh, Chicago, etc),
 *      "categories": {
 *          "type": type of asset (laptop, watch, phone, etc.),
 *          "os": {
 *          "version": the version of OS,
 *          "name": the name of the OS
 *          }
 *      },
 *      "attributes": the attributes associated with this asset
 *      "active_reservations": any current reservations that are either occurring now or will occur in the future
 *      "image": the temporary image URL associated with the asset. The URL will last 15 minutes.
 * }
 * @param {string} assetID - Unique identifier from mongoDB in order to find this specific asset
 */
function getAssetDetails(assetID, callback) {
    Asset.find({
        _id: assetID
    }).exec(function(err, asset) {
        if (err) {
            return callback(new errors.MongooseError(err));
        } else {
            _formatAssets(asset, false, function(err, formattedAssets) {
                if (err) {
                    return callback(new errors.MongooseError(err));
                } else {
                    if (asset.length === 0) {
                        return callback(new errors.DefaultError(404, 'No asset found with the ID: ' + assetID));
                    } else {
                        return callback(null, formattedAssets[0]);
                    }
                }
            });
        }
    });
}

/**
 * Checks out an asset and updates the 'status' value of an asset in the database. This function also
 *      creates a new record document in the database.
 * @param {object} requestBody - The body of the request form the client. This must be in the format:
 *      {
 *          pickup_date: Date, -ISO formatted Dates
 *          return_date: Date
 *      }
 * @param {string} assetID - Unique identifier from mongoDB in order to find this specific asset
 * @param {string} userEmail - The currently signed in user's email. Used for getting the UserID and
 *      adding it to the newly created record. This way the record can be associated with a user and
 *      be added to the user's list of reservations. (See users/me/reservations endpoint)
 */
function checkoutAsset(requestBody, userEmail, callback) {
    /*jshint camelcase: false */



    var recordData = {
        assetID: requestBody.assetID,
        type: 'checked_out',
        pickup_date: requestBody.pickup_date,
        return_date: requestBody.return_date
    };

    lock.writeLock(function(release) {
        _createRecord(userEmail, recordData, function(err) {
            if (err) {
                release();
                return callback(new errors.MongooseError(err));
            } else {
                _changeAssetStatus(requestBody.assetID, 'in_use', function(error, asset) {
                    release();
                    if (error) {
                        return callback(error);
                    } else {
                        return callback(null, asset);
                    }
                });
            }
        });
    });
}

/**
 * Checks in an asset and updates the 'status' value of an asset in the database. This function also
 *      updates the preexisting record document in the database.
 * @param {string} assetID - Unique identifier from mongoDB in order to find this specific asset
 * @param {string} recordID - Unique identifier from mongoDB in order to find the preexisting record to update
 */
function checkinAsset(requestBody, userEmail, callback) {
    /*jshint camelcase: false */

    //Gets the pickup date of the record that related to the previous checked_out record
    _getRecordPickupDate(requestBody.recordID, function(err, pickupDate) {
        if (err) {
            return callback(err);
        } else {
            var recordData = {
                assetID: requestBody.assetID,
                type: 'checked_in',
                pickup_date: pickupDate,
                return_date: requestBody.return_date
            };
            lock.writeLock(function(release) {
                _createRecord(userEmail, recordData, function(err) {
                    if (err) {
                        release();
                        return callback(new errors.MongooseError(err));
                    } else {
                        _changeAssetStatus(requestBody.assetID, 'available', function(error, asset) {
                            release();
                            if (error) {
                                return callback(error);
                            } else {
                                return callback(null, asset);
                            }
                        });
                    }
                });
            });
        }
    });




    /*Record.update({
        '_id': recordID
    }, {
        type: 'checked_in'
    }, null, function(err, result) {
        if (err) {
            return callback(new errors.MongooseError(err));
        } else {
            if (result.ok !== 1) {
                return callback(new errors.DefaultError(500, 'Error updating the record'));
            } else {
                Asset.update({
                    '_id': assetID
                }, {
                    status: 'available'
                }, null, function(err, result) {
                    if (err) {
                        return callback(new errors.MongooseError(err));
                    } else {
                        getAssetDetails(assetID, function(err, asset) {
                            if (err) {
                                return callback(new errors.MongooseError(err));
                            } else {
                                return callback(null, asset);
                            }
                        });
                    }
                });
            }
        }
    });*/
}
/*

TODO ADD COMMENT
*/
adminServices.checkoutAssetForUser = function(requestBody, adminEmail, callback) {
    var recordData = {
        assetID: requestBody.assetID,
        type: 'checked_out',
        pickup_date: requestBody.pickup_date,
        return_date: requestBody.return_date
    };
    lock.writeLock(function(release) {

        _usersService.checkForNewUser(requestBody.userInfo, function(err, checkOutForUser){
            if (err) {
                release();
                return callback(new errors.MongooseError(err));
            } else {
                User.findOne({ //get the admin user's userID
                    'email': adminEmail
                }, {
                    '_id': 1
                }).exec(function(err, user) {
                    if (err) {
                        release();
                        return callback(new errors.MongooseError(err));
                    } else {
                        if (!user) { //if it couldnt find the admin user
                            release();
                            return callback(new errors.DefaultError(401, 'No user found for checkedOutFor with email ' +
                                adminEmail));
                        } else {
                            recordData.checkedOutByID = user._id;
                            _createRecord(checkOutForUser.email, recordData, function(err) {
                                if (err) {
                                    release();
                                    return callback(new errors.MongooseError(err));
                                } else {
                                    _changeAssetStatus(requestBody.assetID, 'in_use', function(error, asset) {
                                        release();
                                        if (error) {
                                            return callback(error);
                                        } else {
                                            return callback(null, asset);
                                        }
                                    });
                                }
                            });
                        }
                    }
                });
            }
            
        });

    });

};

/**
 * Removes an asset from the database
 * @param {string} assetID - Unique identifier from mongoDB in order to find this specific asset
 * If successful the now deleted asset's data will be returned
 */
adminServices.removeAsset = function(assetID, callback) {
    Record.find({
        'assetID': assetID
    }).remove(function(err, records) {
        if (err) {
            return callback(new errors.MongooseError(err));
        } else {
            Asset.findOneAndRemove({
                _id: assetID
            }, function(err, asset) {
                if (err) {
                    return callback(new errors.MongooseError(err));
                } else {
                    _notificationHelper(null, null, {assetID:assetID, type:'deleted'}, asset.name);
                    return callback(null, asset);
                }
            });
        }
    });
};

/**
 * Edit an existing asset in the database
 * @param {string} assetID - Unique identifier from mongoDB in order to find this specific asset
 * @param {object} newAsset - The object of the what the edited asset
 */
//db.assets.update({"_id": ObjectId("55e9aba6a2b279c3b7402602")}, {$set: {"type":"phone"}})
adminServices.editAsset = function(assetID, assetData, callback) {
    var find = {
            _id: assetID
        },
        update = {
            $set: assetData
        },
        options = {};
    Asset.update(find, update, options, function(err, result) {
        if (err) {
            return callback(new errors.MongooseError(err));
        } else {
            if (result.ok === 1) {

                getAssetDetails(assetID, function(err, asset) {
                    if (err) {
                        return callback(new errors.MongooseError(err));
                    } else {
                        return callback(null, asset);
                    }
                });

            } else {
                return callback(new errors.DefaultError(500, 'Modification of asset: ' + assetID + ' failed'));
            }
        }
    });
};

/*
A post to the /assets endpoint should have the following body

{
    "name": "iPhone 6p",
    "description": "The iPhone Sam broke.",
    "location": {
        "name": "Raleigh"
    },
    "categories": {
        "type": "phone",
        "os": "iOS 8.3"
    }
}
*/

adminServices.createAsset = function(requestBody, userEmail, callback) {
    var location;
    //TODO
    // Make modular for any location values
    /*   if (requestBody.location.name === 'Raleigh') {
           locationID = assetLocations['Raleigh'].id;
       } else {
           locationID = assetLocations['Chicago'].id;
       }*/
    if (requestBody.location) {
        location = {
            name: requestBody.location.name,
            id: 1
        };
    } else {
        location = {
            name: 'Raleigh',
            id: 1
        };
    }
    var _asset = new Asset({
        name: requestBody.name,
        description: requestBody.description,
        location: location,
        categories: requestBody.categories,
        attributes: requestBody.attributes,
        image: requestBody.image
    });

    _asset.save(function(err) {
        if (err) {
            //_logger.error(err);
            return callback(new errors.DefaultError(400, 'Error on persistence layer: ' + err.toString()));
        } else {
            _formatAssets([_asset], false, function(err, formattedAssets) {
                if (err) {
                    //_logger.error(err);
                    return callback(new errors.DefaultError(400, 'Error while getting list of assets.'));
                } else {
                    var recordData = {
                        assetID: formattedAssets[0].id,
                        type: 'created'
                    };
                    _createRecord(userEmail, recordData, function(err) {
                        if (err) {
                            return callback(new errors.MongooseError(err));
                        } else {
                            callback(null, formattedAssets[0]);
                        }
                    });
                }
            });
        }
    });

};


/*

*/
adminServices.getAllAssets = function(callback) {

    Asset.find({}).exec(function(err, assets) {
        if (err) {
            return callback(new errors.MongooseError(err));
        } else {
            return callback(null, assets);
        }
    });
};

exports.getAssets = getAssets;
exports.getAssetDetails = getAssetDetails;
exports.checkoutAsset = checkoutAsset;
exports.checkinAsset = checkinAsset;

exports.adminServices = adminServices;
