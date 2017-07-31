/*
 * Copyright (c) 2015-2016 PointSource, LLC.
 * MIT Licensed
 */

var _app, _logger, _assetsService;

module.exports = {
    init: function(app, logger, assetsService) {
        _app = app;
        _logger = logger;
        _assetsService = assetsService;
    },
    getAssets: function(req, res, next) {
        _logger.info('GETing from /api/v1/assets');
        _assetsService.getAssets(req.query, function(err, result) {
            if (err) {
                next(err);
            } else {
                res.status(200).send(result);
            }
        });
    },
    getSingleAsset: function(req, res, next) {
        _logger.info('GETing from /api/v1/assets/{assetID}');

        var assetID = req.params.assetID;

        _assetsService.getAssetDetails(assetID, function(err, result) {
            if (err) {
                next(err);
            } else {
                res.status(200).send(result);
            }
        });
    },
    checkoutAsset: function(req, res, next) {
        _logger.info('POSTing to /api/v1/assets/checkout for ', req.session.email);

        _assetsService.checkoutAsset(req.body, req.session.email, function(err, result) {
            if (err) {
                if (err.status === 202) {
                    res.status(err.status).send(result);
                } else {
                    next(err);
                }
            } else {
                res.status(200).send(result);
            }
        });
    },
    checkinAsset: function(req, res, next) {
        _logger.info('POSTing to /api/v1/assets/checkin');
        _assetsService.checkinAsset(req.body, req.session.email, function(err, result) {
            if (err) {
                if (err.status === 202) {
                    res.status(err.status).send(result);
                } else {
                    next(err);
                }
            } else {
                res.status(200).send(result);
            }
        });
    },
    checkoutAssetForUser: function(req, res, next) {
        _logger.info('POSTing to /api/v1/admin/assets/checkout for ', req.body.userInfo.email);
        _assetsService.adminServices.checkoutAssetForUser(req.body, req.session.email, function(err, result) {
            if (err) {
                if (err.status === 202) {
                    res.status(err.status).send(result);
                } else {
                    next(err);
                }
            } else {
                res.status(200).send(result);
            }
        });
    },
    checkinAssetForUser: function(req, res, next) {
        _logger.info('POSTing to /api/v1/admin/assets/checkin for ', req.body.userInfo.email);
        _assetsService.adminServices.checkinAssetForUser(req.body, req.session.email, function(err, result) {
            if (err) {
                if (err.status === 202) {
                    res.status(err.status).send(result);
                } else {
                    next(err);
                }
            } else {
                res.status(200).send(result);
            }
        });
    },
    createAsset: function(req, res, next) {
        _logger.info('POSTing to /api/v1/admin/assets');

        _assetsService.adminServices.createAsset(req.body, req.session.email, function(err, result) {
            if (err) {
                next(err);
            } else {
                res.status(201).send(result);
            }
        });
    },
    deleteAsset: function(req, res, next) {
        _logger.info('DELETEing from /api/v1/admin/assets/{assetID}');

        var assetID = req.params.assetID;

        _assetsService.adminServices.removeAsset(assetID, req.session.email, function(err, result) {
            if (err) {
                next(err);
            } else {
                res.status(200).send(result);
            }
        });
    },
    editAsset: function(req, res, next) {
        _logger.info('POSTing to /api/v1/admin/assets/{assetID}');

        var assetID = req.params.assetID;
        var assetData = req.body;

        _assetsService.adminServices.editAsset(assetID, assetData, function(err, result) {
            if (err) {
                next(err);
            } else {
                res.status(200).send(result);
            }
        });
    }

};
