var express = require('express');
var router = express.Router();
var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();
var Q = require('q');
var path = require('path');
var fs = require('fs');
var fse = require('fs-extra');
var extract = require('extract-zip');
var QRCode = require('qrcode');
var appRoot = require('app-root-path');
appRoot = appRoot.toString();

var crossSpawn = require('cross-spawn');
var async = require('async');
var AppSettingModels = require('../../../models/appsettings');
var AppVersionAdminModels = require('../../../models/appversionadmin');
var AppVersionUserModels = require('../../../models/appversionuser');
var listBuildingModels = require('../../../models/listbuilding');
var libSetting = require('../../../lib/setting');
var base64 = require('../../../lib/base64');
var Base64js = require('js-base64').Base64;
var sumBuild = libSetting.totalBuilding;



router.post('/build-android-dash', multipartMiddleware, async(req, res) => {
    try {
        //////////////////Declare Variable/////////////
        var mailCustomer, OU, CN, O, L, ST, C, keystore, keystore_again, alias, sKeyFolder;
        var sTypeApp, sPathRootApp, sAppName;
        var platformsApp, versionAppAdmin, idAppServerAdmin, nameFileCodeAdmin, idAppUser, idAppUserDecode;
        var packageID, nameApp, versionApp, descriptionApp, emailApp, hrefApp, authApp;
        var wordpressUrl, wordpressPerPage, requestTimeOut, targetBlank, dateFormat, onesignalID, ggAnalytic, adModAndroidBanner, adModeAndroidInterstitial, adModiOsBanner, adModiOSInterstitial;
        ////////////////Check Value Form///////////////
        req.check('platform', 'Platform is required').notEmpty();
        req.check('version', 'Version is required').notEmpty();
        req.check('idapp', 'ID App is required').notEmpty();
        req.check('idappuser', 'ID App User is required').notEmpty();
        req.check('confirmkeystore', 'Confirm keystore does not match the keystore.').equals(req.body.keystore);
        req.check('CN', 'First and last name is required').notEmpty();
        req.check('OU', 'Organizational unit is required').notEmpty();
        req.check('O', 'Organizational is required').notEmpty();
        req.check('L', 'City or location is required').notEmpty();
        req.check('ST', 'State or Province is required').notEmpty();
        req.check('C', 'Two-letter country is required').notEmpty();
        req.check('alias', 'Alias is required').notEmpty();
        var errors = req.validationErrors(); //req.getValidationResult();
        err = JSON.stringify(errors);
        console.log('errors check: ');
        if (errors) {
            console.log(errors);
            return res.json({ status: "2", content: errors });
        }
        //////////////Get Value Form////////////////
        platformsApp = req.body.platform;
        versionAppAdmin = req.body.version;
        idAppServerAdmin = req.body.idapp;
        idAppUser = req.body.idappuser;
        OU = req.body.OU;
        CN = req.body.CN;
        O = req.body.O;
        L = req.body.L;
        ST = req.body.ST;
        C = req.body.C;
        // keystore = req.body.keystore,
        keystore_again = req.body.confirmKeystore;
        alias = req.body.alias;
        /////////////////////////////////////
        // sKeyFolder = req.body.cKeyFolder;
        console.log(idAppServerAdmin);
        console.log(versionAppAdmin);
        idAppUserDecode = Base64js.decode(idAppUser);
        console.log(idAppUserDecode);
        //{ inforAppversion: { $elemMatch: { version: versionAppAdmin } }
        var dataAppVersionAdmin = await AppVersionAdminModels.findOne({ idApp: idAppServerAdmin }, { inforAppversion: { $elemMatch: { version: versionAppAdmin } } }).exec();
        console.log('dataAppVersionAdmin: ' + dataAppVersionAdmin);
        console.log('inforAppversion: ' + dataAppVersionAdmin.inforAppversion[0].version);
        console.log('nameFile: ' + dataAppVersionAdmin.inforAppversion[0].nameFile);
        //////////////
        nameFileCodeAdmin = dataAppVersionAdmin.inforAppversion[0].nameFile;
        ///////////Get Value AppSettings//////////////////
        var dataSettings = await AppSettingModels.findOne({ idApp: idAppUser }).exec();
        console.log('dataSettings: ' + dataSettings);
        packageID = Base64js.decode(dataSettings.idApp);
        console.log(packageID);
        nameApp = dataSettings.nameApp;
        versionApp = dataSettings.version;
        descriptionApp = dataSettings.description;
        emailApp = dataSettings.emailApp;
        hrefApp = dataSettings.authHref;
        authApp = dataSettings.auth;

        wordpressUrl = dataSettings.wpUrl;
        wordpressPerPage = dataSettings.wpPerPage;
        requestTimeOut = dataSettings.requestTimeout;
        targetBlank = dataSettings.targetBlank;
        dateFormat = dataSettings.dateFormat;
        onesignalID = dataSettings.oneSignalID;
        ggAnalytic = dataSettings.ggAnalytic;
        adModAndroidBanner = dataSettings.adModAndroidBanner;
        adModeAndroidInterstitial = dataSettings.adModeAndroidInterstitial;
        adModiOsBanner = dataSettings.adModeIosBaner;
        adModiOSInterstitial = dataSettings.adModeIosInterstitial;
        //////////////////////////////
        ////////////////////////////////////////////////FUNCTION PROCESS////////////////////////////////////////////////////
        let checkBuilding = (totalBuild, fKeyFolder) => {
            return new Promise(async(resolve, reject) => {
                try {
                    let listBuild = new listBuildingModels({
                        keyFolder: fKeyFolder,
                        dateStartBuild: Date.now()
                    });
                    listBuild.save((err, result) => {
                        if (err) {
                            console.log('err save list build: ' + err);
                            reject(err);
                        }
                        // resolve('Insert building success.');
                        listBuildingModels.find({}).sort({ dateStartBuild: 1 }).limit(totalBuild).exec((err, result) => {
                            if (err) {
                                console.log('Error find building: ' + err);
                                reject(err);
                            }
                            async.each(result, function(key) {
                                console.log('Check key: ' + key.keyFolder);
                                if (fKeyFolder == key.keyFolder) {
                                    return resolve('Key success ');
                                }
                            });
                            var CheckKeyFolderInterval = setInterval(function() {
                                listBuildingModels.find({}).sort({ dateStartBuild: 1 }).limit(totalBuild).exec((err, result) => {
                                    if (err) {
                                        console.log('Error find building: ' + err);
                                        reject(err);
                                    }
                                    async.each(result, function(key) {
                                        console.log('Check key interval: ' + key.keyFolder);
                                        console.log('Key check: ' + fKeyFolder);
                                        if (fKeyFolder == key.keyFolder) {
                                            clearInterval(CheckKeyFolderInterval);
                                            return resolve('Key success');
                                        }
                                    });
                                });
                            }, 3000)
                        });
                    });
                } catch (error) {
                    console.log('Error total check build: ' + error);
                    reject(error);
                }
            })
        }

        let commandLine = (cmd, optionList) => {
            return new Promise((resolve, reject) => {
                try {
                    var commandLine = crossSpawn.spawn(cmd, optionList);
                    commandLine.stdout.on('data', function(data) {
                        console.log('data out: ' + data.toString());
                        if (data instanceof Error) {
                            //console.log(chalk.bold(data.toString()));
                            reject(data);
                        }
                    });
                    commandLine.stderr.on('data', function(data) {
                        console.log('data error: ' + data.toString());
                        if (data instanceof Error) {
                            //console.log(chalk.bold(data.toString()));
                            reject(data);
                        }
                        if (data.toString().toLowerCase().indexOf('error') >= 0) {
                            // console.log(chalk.bold(data.toString()));
                            reject(data);
                        }
                        if (data.toString().toLowerCase().indexOf('err') >= 0) {
                            // console.log(chalk.bold(data.toString()));
                            reject(data);
                        }
                    });
                    // commandLine.on('error',function(err){
                    //     reject(err);
                    // });
                    commandLine.on('close', function(code) {
                        if (code > 0) {
                            reject(new Error(code));
                        }
                        resolve('Success commandline.');
                    });
                } catch (error) {
                    console.log(error);
                    reject(error);
                }
            })
        }
        let copyFileApkDebugDash = (pathProjectApp, pathBackupAPK, fIdAppUser, fVerApp, fApp) => {
            return new Promise((resolve, reject) => {
                try {
                    var path_BackupApk = path.join(pathBackupAPK, fIdAppUser);
                    if (!fs.existsSync(path_BackupApk)) {
                        fs.mkdirSync(path_BackupApk);
                    }
                    var path_BackupApkVerion = path.join(pathBackupAPK, fIdAppUser, fVerApp);
                    if (!fs.existsSync(path_BackupApkVerion)) {
                        fs.mkdirSync(path_BackupApkVerion);
                    }
                    var path_Unsigned = path.join(pathBackupAPK, fIdAppUser, fVerApp, 'unsigned');
                    if (!fs.existsSync(path_Unsigned)) {
                        fs.mkdirSync(path_Unsigned);
                    }
                    var rFile = "";
                    // path.join(pathProjectApp, 'platforms', 'android', 'build', 'outputs', 'apk', 'android-debug.apk');
                    if (fs.existsSync(path.join(pathProjectApp, 'platforms', 'android', 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk'))) {
                        rFile = path.join(pathProjectApp, 'platforms', 'android', 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk');
                    } else if (fs.existsSync(path.join(pathProjectApp, 'platforms', 'android', 'build', 'outputs', 'apk', 'debug', 'android-debug.apk'))) {
                        rFile = path.join(pathProjectApp, 'platforms', 'android', 'build', 'outputs', 'apk', 'debug', 'android-debug.apk');
                    } else {
                        rFile = path.join(pathProjectApp, 'platforms', 'android', 'build', 'outputs', 'apk', 'android-debug.apk');
                    }
                    var wFile = path.join(path_Unsigned, fApp + '-debug.apk');

                    fse.copy(rFile, wFile, { replace: true }, (err) => {
                        if (err) return reject(err + '');
                        resolve('Copy file apk unsign success.');
                    });

                } catch (error) {
                    reject(error);
                }
            });
        }
        let copyFileApkToSignDash = (pathProjectApp, pathBackupAPK, fIdAppUser, fVersionApp) => {
            return new Promise((resolve, reject) => {
                try {
                    var path_OutPuts = path.join(pathBackupAPK, fIdAppUser);
                    if (!fs.existsSync(path_OutPuts)) {
                        fs.mkdirSync(path_OutPuts);
                    }
                    var path_BackupApkVerion = path.join(pathBackupAPK, fIdAppUser, fVersionApp);
                    if (!fs.existsSync(path_BackupApkVerion)) {
                        fs.mkdirSync(path_BackupApkVerion);
                    }
                    var path_Signed = path.join(pathBackupAPK, fIdAppUser, fVersionApp, 'signed');
                    if (!fs.existsSync(path_Signed)) {
                        fs.mkdirSync(path_Signed);
                    }
                    var rFile = "";
                    var wFile = "";
                    if (fs.existsSync(path.join(pathProjectApp, 'platforms', 'android', 'app', 'build', 'outputs', 'apk', 'release', 'app-release-unsigned.apk'))) {
                        rFile = path.join(pathProjectApp, 'platforms', 'android', 'app', 'build', 'outputs', 'apk', 'release', 'app-release-unsigned.apk');
                    } else if (fs.existsSync(path.join(pathProjectApp, 'platforms', 'android', 'build', 'outputs', 'apk', 'release', 'android-release-unsigned.apk'))) {
                        rFile = path.join(pathProjectApp, 'platforms', 'android', 'build', 'outputs', 'apk', 'release', 'android-release-unsigned.apk');
                    } else {
                        rFile = path.join(pathProjectApp, 'platforms', 'android', 'build', 'outputs', 'apk', 'android-release-unsigned.apk');
                    }
                    console.log('r: ' + rFile);
                    wFile = path.join(path_Signed, 'android-release-unsigned.apk');
                    console.log('w: ' + wFile);

                    fse.copy(rFile, wFile, { replace: true }, (err) => {
                        if (err) return reject(err + '');
                        resolve('Copy file apk unsign success.');
                    });
                    // const outAplication = fs.createWriteStream(path.join(path_signed, 'android-release-unsigned.apk'));
                    // fs.createReadStream(path.join(pathProjectApp, 'platforms', 'android', 'build', 'outputs', 'apk', 'android-release-unsigned.apk'))
                    //     .pipe(outAplication);
                    // outAplication.on("end", resolve("copy success."));
                    // outAplication.on("error", reject('Error copy file apk.'));
                } catch (error) {
                    reject(error);
                }
            });
        }
        let generatesKeyStore = (pathBackupAPK, fIdAppUser, fVersionApp, CN, OU, O, L, ST, C, keystore, alias) => {

            var deferred = Q.defer();
            var path_Signed = path.join(pathBackupAPK, fIdAppUser, fVersionApp, 'signed');
            if (!fs.existsSync(path_Signed)) {
                fs.mkdirSync(path_Signed);
            }
            // var path_BackupApkVerion = path.join(pathBackupAPK, fIdAppUser, fVersionApp);
            // if (!fs.existsSync(path_BackupApkVerion)) {
            //     fs.mkdirSync(path_BackupApkVerion);
            // }
            if (fs.existsSync(path.join(path_Signed, 'my-release-key.keystore'))) {
                fs.unlinkSync(path.join(path_Signed, 'my-release-key.keystore'));
            }
            const child = spawn('keytool', ['-genkey', '-v', '-dname', '"CN=' + CN + ', OU=' + OU + ', O=' + O + ', L=' + L + ', ST=' + ST + ', C=' + C + '"', '-alias', alias, '-keypass', '"' + keystore + '"', '-keystore', path.join(path_Signed, 'my-release-key.keystore'), '-storepass', '"' + keystore + '"', '-keyalg', 'RSA', '-keysize', '2048', '-validity', '10000'], { stdio: 'inherit', shell: true, silent: true });
            child.on('data', function(data) {
                console.log('data renkey out: ' + data.toString());
            });
            child.on('close', function(code) {
                if (code > 0) {
                    return deferred.reject(code);
                }
                return deferred.resolve();
            });
            return deferred.promise;
        }
        let genKeyStoreText = (pathWriteFile, fIdAppUser, fVersionApp, fKeyStore, fCN, fOU, fO, fL, fST, fC, fAlias) => {
                return new Promise((resolve, reject) => {
                    try {
                        var pathBackupKey = path.join(pathWriteFile, fIdAppUser);
                        if (!fs.existsSync(pathBackupKey)) {
                            fs.mkdirSync(pathBackupKey);
                        }
                        var pathBackupKeyVersion = path.join(pathWriteFile, fIdAppUser, fVersionApp);
                        if (!fs.existsSync(pathBackupKey)) {
                            fs.mkdirSync(pathBackupKey);
                        }
                        var pathBackSigned = path.join(pathWriteFile, fIdAppUser, fVersionApp, 'signed');
                        if (!fs.existsSync(pathBackSigned)) {
                            fs.mkdirSync(pathBackSigned);
                        }
                        var dataFile = 'Password: ' + fKeyStore + '\r\nFirst and last name: ' + fCN + '\r\nOrganizational unit: ' + fOU + '\r\nOrganizational: ' + fO + '\r\nCity or location: ' + fL + '\r\nState or Province: ' + fST + '\r\nTwo-letter country: ' + fC + '\r\nAlias name: ' + fAlias;
                        fs.writeFile(path.join(pathBackSigned, 'keystore.txt'), dataFile, function(err) {
                            if (err) {
                                console.log('err: ' + err);
                                return reject(err);
                            }
                            resolve('Generate file keystore success.');
                        })
                    } catch (error) {
                        console.log(error);
                        reject(error);
                    }

                })

            }
            ///////////////////////////////////////////////////////////////////////////////////////////////////////
        var pathSourceCodeAdmin = path.join(appRoot, 'public', 'sourcecodeapp', nameFileCodeAdmin);
        if (fs.existsSync(pathSourceCodeAdmin)) {
            /////// Extract File Source from admin////////////////
            console.log('..........Extracting file source code admin........');
            extract(pathSourceCodeAdmin, { dir: path.join(appRoot, 'public', 'project', idAppUser) }, async function(err, zipdata) {
                if (err) {
                    console.log('Extract fail: ' + err);
                    return res.json({ status: 3, content: "Error extract file: " + err + '' });
                } else {
                    ////////Check Replace File In Setting App///////////////
                    //////Create file config.xml/////////////
                    var pathFileConfigExample = path.join(appRoot, 'public', 'project', idAppUser, 'config-example.xml');
                    var pathFileConfigMain = path.join(appRoot, 'public', 'project', idAppUser, 'config.xml');
                    if (fs.existsSync(pathFileConfigExample)) {
                        console.log('check config.');
                        var dataConfig = fs.readFileSync(pathFileConfigExample);
                        console.log(dataConfig);
                        console.log(packageID);
                        var resultConfig = dataConfig.toString().replace('PACKAGE_ID', packageID);
                        resultConfig = resultConfig.replace('APP_VERSION', versionApp);
                        resultConfig = resultConfig.replace('APP_NAME', nameApp);
                        resultConfig = resultConfig.replace('APP_DESCRIPTION', descriptionApp);
                        resultConfig = resultConfig.replace('APP_EMAIL', emailApp);
                        resultConfig = resultConfig.replace('AUTH_HREF', hrefApp);
                        resultConfig = resultConfig.replace('APP_AUTHOR', authApp);
                        console.log(resultConfig);
                        fse.writeFileSync(pathFileConfigMain, resultConfig);
                        // fse.copySync(pathFileConfigExample, pathFileConfigMain);
                    }
                    ///////////////Create file setting.js///////////////////
                    var pathFileSettingExample = path.join(appRoot, 'public', 'project', idAppUser, 'src', 'assets', 'js', 'settings-example.js');
                    var pathFileSettingsMain = path.join(appRoot, 'public', 'project', idAppUser, 'src', 'assets', 'js', 'settings.js');
                    if (fs.existsSync(pathFileSettingExample)) {
                        console.log('check setting.');
                        var dataSettings = fs.readFileSync(pathFileSettingExample);
                        console.log(dataSettings);
                        var result = dataSettings.toString().replace('WORDPRESS_URL', wordpressUrl);
                        result = result.replace('WORDPRESS_PER_PAGE', wordpressPerPage);
                        result = result.replace('REQUEST_TIMEOUT', requestTimeOut);
                        result = result.replace('OPEN_TARGET_BLANK', targetBlank);
                        result = result.replace('DATE_FORMAT', dateFormat);
                        result = result.replace('ONESIGNAL_APP_ID', onesignalID);
                        result = result.replace('GOOGLE_ANALYTICS', ggAnalytic);
                        result = result.replace('ADMOB_ANDROID_BANNER', adModAndroidBanner);
                        result = result.replace('ADMOB_ANDROID_INTERSTITIAL', adModeAndroidInterstitial);
                        result = result.replace('ADMOB_IOS_BANNER', adModiOsBanner);
                        result = result.replace('ADMOB_IOS_INTERSTITIAL', adModiOSInterstitial);
                        // console.log(result);
                        fse.writeFileSync(pathFileSettingsMain, result);

                        // var outFile = fs.writeFileSync(pathFilePrimary, result);
                    }
                    try {
                        console.log('--------------------------------------------------------');
                        console.log('============== Deployapp App From Source Code Admin =============');
                        console.log('--------------------------------------------------------');
                        console.log('-------Checking Build-------');
                        return checkBuilding(sumBuild, idAppUser)
                            // .then(() => {
                            //     process.chdir(path.join(appRoot, 'public', 'project', idAppUser));
                            //     console.log('...Access file...');
                            //     commandLine('chmod', ['-R', '777', './']);
                            // })
                            .then(() => {
                                process.chdir(path.join(appRoot, 'public', 'project', idAppUser));
                                console.log('Start rebuild...');
                                return commandLine('npm', ['rebuild', 'node-sass']);
                            }).then(() => {
                                console.log('...Add platform...');
                                var cmdRelease = 'ionic';
                                var argv;
                                argv = ['platform', 'add', 'android'];
                                process.chdir(path.join(appRoot, 'public', 'project', idAppUser));
                                return commandLine(cmdRelease, argv);
                            }).then(() => {
                                var cmd = 'ionic';
                                // var cmd = 'cordova';
                                var argvBuild = ['build', 'android', '--prod'];
                                process.chdir(path.join(appRoot, 'public', 'project', idAppUser));
                                return commandLine(cmd, argvBuild);
                            }).then(() => {
                                console.log('...Copy File Apk Unsign...');
                                return copyFileApkDebugDash(path.join(appRoot, 'public', 'project', idAppUser), path.join(appRoot, 'public', 'backupapk'), idAppUser, versionApp, nameApp);
                            }).then(() => {
                                console.log('...Build project release...');
                                var cmdRelease = 'ionic';
                                // var cmdRelease = 'cordova';
                                var argv = ['build', 'android', '--release', '--prod'];
                                process.chdir(path.join(appRoot, 'public', 'project', idAppUser));
                                return commandLine(cmdRelease, argv);
                            }).then(() => {
                                console.log('...Copy  File Apk Sign....');
                                return copyFileApkToSignDash(path.join(appRoot, 'public', 'project', idAppUser), path.join(appRoot, 'public', 'backupapk'), idAppUser);
                            }).then(() => {
                                console.log('...Generate Key...');
                                return generatesKeyStore(path.join(appRoot, 'public', 'backupapk'), idAppUser, versionApp, CN, OU, O, L, ST, C, keystore, alias);
                            }).then(() => {
                                console.log('...Generate Keystore File txt...');
                                return genKeyStoreText(path.join(appRoot, 'public', 'backupapk'), idAppUser, versionApp, keystore, CN, OU, O, L, ST, C, alias);
                            }).then(() => {
                                console.log('...Sign App.....');
                                // res.send('Sign app...');
                                return jarSignerApp(path.join(appRoot, 'public', 'backupapk'), idAppUser, versionApp, keystore, alias);
                            }).then(() => {
                                console.log('...Zip File....');
                                console.log(path.join(appRoot, 'public', 'backupapk', idAppUser));
                                return zipAlignApp(path.join(appRoot, 'public', 'backupapk'), idAppUser, versionApp, nameApp);
                            })
                            .then(() => {
                                console.log('Success');
                                return res.json({ status: 1, content: "Success." });
                            });

                    } catch (error) {
                        return res.json({ status: 3, content: error + '' });
                    }
                    // return res.json({ status: 1, content: 'success' });
                }
            });

        } else {
            return res.json({ status: 3, content: "Can't find source code from admin." });
        }


        // nameFileCodeAdmin = dataAppVersionAdmin.inforAppversion[0];
        // console.log('nameFileCodeAdmin: ' + nameFileCodeAdmin);

        // AppSettingModels.findOne({ idApp: idAppServerAdmin }).then((dataSettings) => {
        //     console.log(dataSettings);
        //     return res.json({ status: 1, content: 'success' });
        // });


    } catch (error) {
        console.log(error);
        res.json({ status: 3, content: error + '' });
    }
});
module.exports = router;