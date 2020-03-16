
const mysql = require('mysql2');
const FTPS = require('ftps');

module.exports.deviceIds = [
    10001, 10002, 10003, 10004, 10005,
    10006, 10007, 10008, 10009, 10010,
    10011, 10012, 10013, 10014, 10015,
    10016, 10017, 10018, 10019, 10020,
    10021, 10022, 10023, 10024,
    20001, 20002, 20003, 20004, 20005,
    20006, 20007, 20008, 20009, 20010,
    20011, 20012, 20013, 20014, 20015,
    30001, 30002, 30003, 30004, 30005,
    30006, 30007, 30008, 30009, 30010,
    30012,
    40001, 40002, 40003, 40004, 40005,
    40006, 40007, 40008, 40009, 40010,
    60001, 60002, 60003, 60004
];


var DAEJON = {
    ftps:new FTPS({
        host: '127.0.0.1', // required
        username: 'kbell', // Optional. Use empty username for anonymous access.
        password: 'kbell12!@', // Required if username is not empty, except when requiresPassword: false
        protocol: 'sftp', // Optional, values : 'ftp', 'sftp', 'ftps', ... default: 'ftp'
        port: 22, // Optional
        requireSSHKey: true, //  Optional, defaults to false, This option for SFTP Protocol with ssh key authentication
        sshKeyPath: '~/.ssh/known_hosts' // Required if requireSSHKey: true , defaults to empty string, This option for SFTP Protocol with ssh key authentication
    }),
    pool : mysql.createPool({
        host: '10.20.1.138',
        port: 3306,
        user: 'smartcity',
        password: '*smartcity*',
        database: 'smartcity',
        waitForConnections: true,
        connectionLimit: 1000,
        queueLimit: 0
    })
};

var KBELL = {
    ftps:new FTPS({
        host: '118.131.116.84', // required
        username: 'root', // Optional. Use empty username for anonymous access.
        password: 'kbroot', // Required if username is not empty, except when requiresPassword: false
        protocol: 'sftp', // Optional, values : 'ftp', 'sftp', 'ftps', ... default: 'ftp'
        port: 10022, // Optional
        requireSSHKey: true, //  Optional, defaults to false, This option for SFTP Protocol with ssh key authentication
        sshKeyPath: '~/.ssh/known_hosts' // Required if requireSSHKey: true , defaults to empty string, This option for SFTP Protocol with ssh key authentication
    }),
    pool : mysql.createPool({
        host: '118.131.116.84',
        port: 33306,
        user: 'smartcity',
        password: '*smartcity*',
        database: 'smartcity',
        waitForConnections: true,
        connectionLimit: 1000,
        queueLimit: 0
    })
}

module.exports.config = Object.freeze({
    MOBIUS_IP: '192.168.3.192',
    MOBIUS_PORT: '7579',
    BIGDATA_DIR: '/home/kbell/kbell_package/bigdata_package/tmp/sensor_data_dir',
    DEST: [
        DAEJON,KBELL
    ]
});

module.exports.format = Object.freeze({
    MYSQL_TABLE: 'iot_data_%s',
    BIKE_NAME: 'sc_bic_%s',
    FILE_NAME: 'bike_iot%s_sensor%s_%s.csv',
})

