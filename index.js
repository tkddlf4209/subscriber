const constants = require('./lib/constants.js');
const request = require("request");
const rp = require('request-promise');
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
    config.DEST.forEach(item => {
        item.pool.getConnection(async function (err, con) {
            if (!err) {
                for(var i=0 ; i<deviceIds.length;i++){
                    await requestMobius(con,item.ftps,deviceIds[i]);
                 }
            }
        })
    });

    setTimeout(function () {
        process.exit(1);
    }, 20000)

})()

const sleep = (ms) =>{
    return new Promise(resolve=>{
            setTimeout(resolve,ms)
    })
}

async function requestMobius(con, ftps, bike_id) {

    var options = {
        'method': 'GET',
        'url': 'http://' + config.MOBIUS_IP + ':' + config.MOBIUS_PORT + '/Mobius/' + util.format(format.BIKE_NAME, bike_id) + '/sensor/latest',
        'headers': {
            'X-M2M-RI': '12345',
            'X-M2M-Origin': 'S20170717074825768bp2l'
        },
        'json': true
    }
    //console.log(bike_id, '@@@@');
    try{

        var response = await rp(options);
        
        var obj = response.body['m2m:cin'];
        if (!!!obj) { // 데이터가 없을 경우 retrun
            console.log(bike_id, 'null');
            return;
        }
    
        var mysql_data = util.format("%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s"
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
    
        var csv_data = util.format("%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s"
            , now('YYYYMMDDHHmmss')
            , bike_id
            , util.format(format.BIKE_NAME, bike_id)
            , 0
            , "sensor"
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
        //console.log(csv_data);
    
    
        //console.log(bike_id, obj.ct, now('YYYYMMDDHHmmss'), isSameDay(obj.ct));
    
        if (isSameDay(obj.ct)) { // 현재날짜와 ct 날짜가 같으면 
            var table = util.format(format.MYSQL_TABLE, now('YYYYMMDD'));
            var query = "INSERT INTO " + table + " values(" + mysql_data + ")"
            let rows = await con.query(query);
            try{
                var fileName = util.format(format.FILE_NAME, bike_id, bike_id, now('YYYYMMDDHHmmss'));
                    var filePath = './' + fileName;
    
                    fs.writeFile(filePath, csv_data, (err) => {
                        try {
                            if (err) {
                                console.log('file write error : ', err);
                            } else {
                                ftps.put(filePath, config.BIGDATA_DIR + "/" + fileName).exec(function (err, rep) {
                                    if (err) {
                                        console.log('ftps err : ', err);
                                    } else {
                                        console.log(filePath);
                                    }
                                    //console.log('test');
    
                                    fs.unlink(filePath, function (err, rsp) { })
                                });
                            }
                        } catch (e) {
                            console.log(e);
                        }
                    });
            }catch(e){
                console.log("mysql error : ", err);
            }
            
        } else {
            console.log(bike_id, 'is not same day', now('YYYYMMDDHHmmss'), obj.ct)
        }
    }catch(e){
        console.log(e);
    }

}

function isSameDay(ct) {
    return moment().isSame(moment(ct, 'YYYYMMDDTHHmmss').add(9, 'hours'), 'day');
}

function now(format) {
    //moment(timestamp, 'YYYYMMDDHHmmss').format('YYYY-MM-DD HH:mm:ss')
    //return moment().format('YYYY-MM-DD HH:mm:ss')
    return moment().format(format)
}
