const express = require('express');
const bodyParser= require('body-parser')
const cookieParser = require('cookie-parser');
var session = require('express-session')
let config = require('./config');
const path = require('path');
const fs = require('fs'),
    http = require('http'),
    https = require('https')
var flash = require('connect-flash');
var md5 = require('md5');
var cors = require('cors')

var loginSystem = require('express-oauth-login-system-server')
loginSystem(config).then(function(login) {
    const loginRouter = login.router
    const authenticate = login.authenticate
    const csrf = login.csrf
    var router = express.Router();
    router.use('/',function(req,res,next) {
        csrf.setToken(req,res,next)
    });
    
    
    function checkMedia(req,res,next) {
        let cookie = req.cookies['media_token'] ? req.cookies['media_token']  : '';
        let parameter = req.query._media ? req.query._media : (req.body._media ? req.body._media : '')
        if (cookie && cookie === parameter) {
            next()
        } else {
            res.send({error:'media check failed'})
        }
    }

    // use media authentication with cookie and req parameter because media element cannot send auth in header.
    router.use('/api/protectedimage',cors(),csrf.checkToken, checkMedia,function (req,res) {
        const stream = fs.createReadStream(__dirname + '/lock.jpg')
        stream.pipe(res)
    });


    router.use('/api/csrfimage',cors(),csrf.checkToken,function (req,res) {
        const stream = fs.createReadStream(__dirname + '/protect.jpg')
        stream.pipe(res)
    });

    // An api endpoint that returns a short list of items
    router.use('/api/getlist',cors(), authenticate, (req,res) => {
        var list = ["item1", "item2", "item3"];
        res.send([{items:list}]);
    });

    router.use('/api',function (req,res) {
        console.log('API')
        res.send({error:'Invalid request'})
    });


    // SSL
    // allow self generated certs
    //process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
    //var options = {
        //key: fs.readFileSync('./key.pem'),
        //cert: fs.readFileSync('./certificate.pem'),
    //};

    //var webServer = https.createServer(options, app).listen(port, function(){
      //console.log("Express server listening on port " + port);
    //});
    const app = express();
    app.use(bodyParser.json());
    app.use(cookieParser());
    app.use(cors())
    // session required for twitter login
    app.use(session({ secret: config.sessionSalt ? config.sessionSalt : 'board GOAT boring do boat'}));
    app.use('/api/login',loginRouter);
    app.use(router);
    router.use('/',function(req,res,next) {
        console.log(['URL',req.url]); //,req.cookies,req.headers
        next()
    });

    router.get('/', (req, res) => {
      res.send('Hello World!')
    })


    app.use(function (err, req, res, next) {
        console.log('ERR');
        console.log(err);
    });
    var options = {}
    let port=config.authServerPort ? config.authServerPort  : '4000'
    app.listen(port, () => {
      console.log(`Login system example listening at http://localhost:${port}`)
    })
})

