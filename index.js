const constants = require('./lib/constants.js');
const request = require("request");
const CronJob = require('cron').CronJob;
const moment = require('moment');
const util = require('util');
const fs = require('fs');
require('moment-timezone');
moment.tz.setDefault("Asia/Seoul");

var deviceIds = constants.deviceIds;
var config = constants.config;
var format = constants.format;

(function () {
    //requestMobius(10002);
    deviceIds.forEach(deviceId => {
        requestMobius(deviceId);
    });
})()

function requestMobius(bike_id) {

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

        var data = util.format("%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s"
            , now('YYYYMMDDHHmmss')
            , bike_id
            , "'" + util.format(format.BIKE_NAME, bike_id) + "'"
            , 0
            , "'sensor'"
            , "'" + obj.pi + "'"
            , "'" + obj.ri + "'"
            , obj.ty
            , "'" + obj.ct + "'"
            , obj.st
            , "'" + obj.rn + "'"
            , "'" + obj.lt + "'"
            , "'" + obj.et + "'"
            , obj.cs
            , obj.cr
            , obj.con);

        console.log(bike_id,obj.ct,now('YYYYMMDDHHmmss'),isSameDay(obj.ct));
        
        if (isSameDay(obj.ct)) { // 현재날짜와 ct 날짜가 같으면 
            config.DEST.forEach(item=>{
                item.pool.getConnection(function (err, con) {
                    if (err) {
                        console.error(err);
                        return;
                    }
    
                    var table = util.format(format.MYSQL_TABLE, now('YYYYMMDD'));
                    var query = "INSERT INTO " + table + " values(" + data + ")"
    
                    item.pool.query(query, function (err, rows) {
                        if (err) {
                            console.error(err);
                            return;
                        }else{
                            var fileName = util.format(format.FILE_NAME, bike_id, bike_id, now('YYYYMMDDHHmmss'));
                            var filePath = './' + fileName;
                
                            fs.writeFile(filePath, data, (err) => {
                                try{
                                    if (err) {
                                        console.log(err);
                                    } else {
                                        item.ftps.put(filePath, config.BIGDATA_DIR + "/" + fileName).exec(function (err, rep) {
                                            if (err){
                                                console.log(err);
                                            } else{
                                                console.log(filePath);
                                            }
                                            fs.unlink(filePath,function(err,rsp){})
                                        });
                                    }
                                }catch(e){
                                    console.log(e);
                                    
                                }
                            });
                            console.log(query);
                        }
                    });
    
                    item.pool.releaseConnection(con);
    
                })

               
            })
        }
    });
}

function isSameDay(ct) {
    return moment().isSame(moment(ct, 'YYYYMMDDTHHmmss').add(9, 'hours'), 'day');
}

function now(format) {
    //moment(timestamp, 'YYYYMMDDHHmmss').format('YYYY-MM-DD HH:mm:ss')
    //return moment().format('YYYY-MM-DD HH:mm:ss')
    return moment().format(format)
}