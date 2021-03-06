var express = require('express');
var router = express.Router();
var session = require('express-session');
var path = require('path');
var fs = require('fs');
var bodyParser = require('body-parser');
var request = require('request');
var nodemailer = require('nodemailer');
var hbs = require('nodemailer-express-handlebars');
var md5 = require('md5');
var async = require('async');
var libSetting = require('../../lib/setting');
var hostServer = libSetting.hostServer;
var devMode = libSetting.devMode;

var Base64 = require('js-base64').Base64;
// var crypto = require('crypto-js');
// var promise = require("promise");
var app = express();
var User = require('../../models/user');
var infor_app_admin = require('../../models/inforappadmin');
var order_modal = require("../../models/order");
var promo_code = require("../../models/promocode");
var affiliate_withdrawal_modal = require("../../models/withdraw");
var affiliate_modal = require("../../models/affiliate");
var http = require('http');
var server = http.Server(app);
var paypal = require("paypal-rest-sdk");
var country = require("../../lib/country");



paypal.configure({
    'mode': 'sandbox', //sandbox or live
    'client_id': 'Ac1YRFBQMzjwaB6QGsMxW_Z321sYjpE7l9ngSQBoaIiTfRWC-ZHH2NKvRxbqKNtNkUi08Xgz7u5IDH5X',
    'client_secret': 'EHdNlc0ANRNjgyOOI3d-0QK5AOP-Y47W7ZqMS-Wvh3afOVHig5VsIlIUPumExqSbM4p5L8rIOMAiLZZB'
});

function checkAdmin(req, res, next) {
    if (req.session.iduser) {
        next();
    } else {
        res.redirect('/login');
    }
}

function checkcart(req, res, next) {
    if (req.session.cart.length > 0) {
        next();
    } else {
        res.redirect('/dashboard');
    }
}


function makeid() {
    var text = "";
    var possible = "0123456789";

    for (var i = 0; i < 7; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}

function filtercart(a) {
    var b = [];
    while (a.length > 0) {
        let c = a.filter(function (el) {
            return el == a[0]
        });
        b.push({
            id: c[0],
            count: c.length
        });
        a = a.filter(function (el) {
            return el != a[0]
        });
    }
    return b;
}


router.get("/affiliate/statements", checkAdmin, (req, res) => {
    affiliate_withdrawal_modal.find({
        idUser: req.session.iduser,
        status: true
    }).sort({
        dateCreate: -1
    }).then((data) => {
        if (data.length > 0) {
            res.render('./affiliate/statement', {
                title: 'Statements',
                money: data[0].blance,
                history: data,
                appuse: "",
            });
        } else {
            affiliate_modal.find({
                idUser: req.session.iduser,
                status: true
            }).sort({
                dateCreate: -1
            }).then((data_affiliate) => {
                if(data_affiliate){
                    if(data_affiliate.length > 0){
                        res.render('./affiliate/statement', {
                            title: 'Statements',
                            money: data_affiliate[0].blance,
                            history: data,
                            appuse: "",
                        });
                    }else{
                        res.render('./affiliate/statement', {
                            title: 'Statements',
                            money: 0,
                            history: data,
                            appuse: "",
                        });
                    }
                }else{
                    res.render('./affiliate/statement', {
                        title: 'Statements',
                        money: 0,
                        history: data,
                        appuse: "",
                    });
                }
               
            })
        }

    })

})

// 1 pendding  
// 2 complate  
// 3 cancel


router.post("/getdata/withdrawal", (req, res) => {
    affiliate_withdrawal_modal.find({
        idUser: req.session.iduser,
        status: true
    }).then((data) => {
        return res.json(data)
    })
})

router.get("/affiliate/statement/detail", checkAdmin, (req, res) => {
    try {
        if (req.query.idhistory) {
            affiliate_withdrawal_modal.findOne({
                id: req.query.idhistory,
                status: true
            }).then((data) => {
                if (data) {
                    res.render('./affiliate/detail', {
                        title: 'Detail Statements',
                        detail: data,
                        appuse: "",
                    });
                } else {
                    res.redirect("/404")
                }
            })
        } else {
            res.redirect("/404")
        }
    } catch (error) {
        console.log(error + "")
        res.render("error", {
            title: "Error",
            error: error + ""
        })
    }
})



module.exports = router;