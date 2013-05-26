var http  = require('./post'),
    util  = require('util'),
    debug = false,
    meta    = { 
        "module" : "statsd-http.post",
        "pid"    : process.pid,
    };

function emitter(post, ts, metrics) {
    var body = {
        "timestamp" : ts
    };
    
    ['gauges','timers','counters'].forEach(function (key) {
        body[key] = metrics[key] || {};
    });
    
    post(body, function (err, res) {
        if (err) {
            util.log(meta.module + '|ERROR|' + util.inspect(err));
        }
    });
}

exports.init = function (startup_time, config, events) {
    debug = config.debug;
    
    if (!config.httpPostURL) {
        util.log(meta.module + '|ERROR|config|MISSING|httpPostURL');
        return false;
    }
    
    var post = http(config.httpPostURL);
    if (!post) {
        util.log(meta.module + '|ERROR|config|INVALID|httpPostURL=' + config.httpPostURL);
        return false;
    }
    
    events.on('flush', function (ts, metric) {
        emitter(post, ts, metric);
    });

    return true;
};
