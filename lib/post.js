var regex = /^(https|http):\/\/+([^:\/]*)(?::(\d+))?\/([^?]*)(?:\?(.*))?$/,
    winston = require('winston'),
    logger  = new (winston.Logger)({ transports: [
        new (winston.transports.Console)({
            "level"    : "debug",
            "json"     : false,
            "colorize" : true
        })
    ]}),
    meta    = { 
        "module" : "post",
        "pid"    : process.pid,
    };

module.exports = function (url) {
    var capture = regex.exec(url),
        proto   = capture[1],
        host    = capture[2],
        port    = capture[3] ? capture[3] : (proto === 'http' ? 80 : 443),
        path    = capture[4],
        query   = capture[5],
        http    = proto === 'http' ? require('http') : require('https');
        
    return function (bodyObject, callback) {
        var body = JSON.stringify(bodyObject),
            options = {
            'method'  : 'POST',
            'host'    : host,
            'port'    : port,
            'path'    : '/' + path + (query ? ('?' + query) : ''),
            'headers' : {
                'User-Agent'     : 'StatsD-http.poster',
                'Content-Type'   : 'application/json',
                'Content-Length' : Buffer.byteLength(body)
            }
        };
        logger.log('debug', '%s|request|option=%j|body=%j', meta.module, options, body, meta);
        var req = http.request(options, function(res) {
            var requestData = '';
            res.setEncoding('utf8');
            logger.log('debug', '%s|response|http-code=%s|headers=%j', meta.module, res.statusCode, res.headers, meta);
            
            res.on('data', function(data) {
                logger.log('debug', '%s|read|data=%s', meta.module, data, meta);
                requestData += data;
            });
            
            res.on('end', function(data) {
                if (data) requestData += data;
                logger.log('debug', '%s|end|data=%s', meta.module, requestData, meta);
                if (callback) callback(null, requestData);
            });
        });
        
        req.on('error', function(err) {
            logger.log('warn', '%s|response|error=%j', meta.module, err, meta);
            if (callback) callback(err, null);
        });
        
        req.end(body);
    };
};
