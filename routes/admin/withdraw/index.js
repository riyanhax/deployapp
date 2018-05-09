var express = require('express');
var router = express.Router();

var async = require('async');
var fse = require('fs-extra');
var fs = require('fs');
var md5 = require('md5');
var path = require('path');
var appRoot = require('app-root-path');
appRoot = appRoot.toString();
var moment = require('moment');
var nodemailer = require('nodemailer');
var hbs = require('nodemailer-express-handlebars');
var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();

var libAppCountry = require('../../../lib/country');
var libCountry = libAppCountry.country;
var withDrawModels = require('../../../models/withdraw');

router.get('/', (req, res) => {
    try {
        withDrawModels.find().sort({ dateCreate: -1 }).then((dataWithdraw) => {
            res.render('admin/withdraw/index', { dataWithdraw, moment, title: "Withdraw" });
        });

    } catch (error) {
        console.log(error);
        return res.render('error', { error, title: 'Page Error' });
    }
});
router.post('/changestatuswithdraw', (req, res) => {
    try {
        console.log(req.body);
        req.checkBody('id', 'ID Not Defined').notEmpty();
        req.checkBody('status', 'Status can not be empty').notEmpty();
        var errors = req.validationErrors();
        if (errors) {
            return res.json({ status: 2, msg: errors });
        } else {
            withDrawModels.findOne({ id: req.body.id }).then((dataWithdraw) => {
                if (dataWithdraw) {
                    dataWithdraw.statusWithdraw = req.body.status;
                    dataWithdraw.save().then(() => {
                        return res.json({ status: 1, msg: "Success." });
                    })
                } else {
                    return res.json({ status: 3, msg: "ID Not Defined." });
                }
            });

        }

        // 

        // withDrawModels.find().then((dataWithdraw) => {
        //     res.render('admin/withdraw/index', { dataWithdraw, moment, title: "Withdraw" });
        // });

    } catch (error) {
        console.log(error);
        return res.render('error', { error, title: 'Page Error' });
    }
});
module.exports = router;