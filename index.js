const constants = require('./lib/constants.js');
const request = require("request");
const CronJob = require('cron').CronJob;
const moment = require('moment');
const util = require('util');
const mysql = require('mysql');
const FTPS = require('ftps');
require('moment-timezone');
moment.tz.setDefault("Asia/Seoul");


const BIGDATA_DIR='/home/kbell/kbell_package/bigdata_package/'
var deviceIds = constants.deviceIds;
var config = constants.config;
var format = constants.format;

var ftps = new FTPS({
    host: '192.168.3.199', // required
    username: 'root', // Optional. Use empty username for anonymous access.
    password: 'kbroot', // Required if username is not empty, except when requiresPassword: false
    protocol: 'sftp', // Optional, values : 'ftp', 'sftp', 'ftps', ... default: 'ftp'
    // protocol is added on beginning of host, ex : sftp://domain.com in this case
    port: 22, // Optional
    // port is added to the end of the host, ex: sftp://domain.com:22 in this case
    //escape: true, // optional, used for escaping shell characters (space, $, etc.), default: true
    //retries: 2, // Optional, defaults to 1 (1 = no retries, 0 = unlimited retries)
    //timeout: 10, // Optional, Time before failing a connection attempt. Defaults to 10
    //retryInterval: 5, // Optional, Time in seconds between attempts. Defaults to 5
    //retryMultiplier: 1, // Optional, Multiplier by which retryInterval is multiplied each time new attempt fails. Defaults to 1
    //requiresPassword: true, // Optional, defaults to true
    //autoConfirm: true, // Optional, is used to auto confirm ssl questions on sftp or fish protocols, defaults to false
    cwd:'/home/kbell/subscriber',
    //cwd: BIGDATA_DIR+'/tmp/sensor_data_dir', // Optional, defaults to the directory from where the script is executed

    //additionalLftpCommands: '', // Additional commands to pass to lftp, splitted by ';'
    //requireSSHKey:  true, //  Optional, defaults to false, This option for SFTP Protocol with ssh key authentication
    //sshKeyPath: '/home1/phrasee/id_dsa' // Required if requireSSHKey: true , defaults to empty string, This option for SFTP Protocol with ssh key authentication
});

const pool = mysql.createPool({
    host: '192.168.3.199',
    port: 3306,
    user: 'smartcity',
    password: '*smartcity*',
    database: 'smartcity',
    waitForConnections: true,
    connectionLimit: 1000,
    queueLimit: 0
});


(function () {
    ftps.put('./package.json','package.json').exec(function(err,rep){
        console.log(err);
        
    });
    //requestMobius(10002);
    // deviceIds.forEach(deviceId => {
       
    // });
})()

async function requestMobius(bike_id) {


    var options = {
        'method': 'GET',
        'url': 'http://' + config.MOBIUS_IP + ':' + config.MOBIUS_PORT + '/Mobius/' + util.format(format.BIKE_NAME, bike_id) + '/sensor/latest',
        'headers': {
            'X-M2M-RI': '12345',
            'X-M2M-Origin': 'S20170717074825768bp2l'
        },
        'json': true
    }

    request(options, function (error, response) {
        if (error) throw new Error(error);

        var obj = response.body['m2m:cin'];

        if (!!!obj) { // 데이터가 없을 경우 retrun
           return;
        }
        if(true){
        //if(isSameDay(obj.ct)){ // 현재날짜와 ct 날짜가 같으면 
            pool.getConnection(function (err, con) {
              
                if (err) {
                    console.error(err);
                    return;
                }

                var table = util.format(format.MYSQL_TABLE, now('YYYYMMDD'));
                var values = util.format("%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s"
                    , now('YYYYMMDDHHmmss')
                    , bike_id
                    , util.format(format.BIKE_NAME, bike_id)
                    , 0
                    , 'sensor'
                    , obj.pi
                    , obj.ri
                    , obj.ty
                    , obj.ct
                    , obj.st
                    , obj.rn
                    , obj.lt
                    , obj.et
                    , obj.cs
                    , obj.cr
                    , obj.con);

                console.log(table);
                console.log(values);

                var query = util.format(" INSERT INTO " + table + " values(" + values + ")")

                // pool.query(query, function (err, rows) {
                //     if (err) {
                //         console.error(err);
                //         return;
                //     }

                //     //console.log(rows);
                // });

                // pool.releaseConnection(con);
            })
        }
    });

}

function isSameDay(ct){
    return  moment().isSame(moment(ct, 'YYYYMMDDTHHmmss').add(9,'hours'),'day');
}

function now(format) {
    //moment(timestamp, 'YYYYMMDDHHmmss').format('YYYY-MM-DD HH:mm:ss')
    //return moment().format('YYYY-MM-DD HH:mm:ss')
    return moment().format(format)
}