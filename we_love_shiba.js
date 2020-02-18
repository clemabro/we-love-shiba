var twit = require('twit');
var config = require('./config.js');
var schedule = require('node-schedule');
var log4js = require('log4js');
var dateTime = require('node-datetime');

// Configuration du logger
log4js.configure({
  appenders: [
    { type: 'console' },
    { type: 'file', filename: 'shiba.log', category: 'shiba' }
  ]
});

// Recuperation du logger shiba
var logger = log4js.getLogger('shiba');

var twitter = new twit(config);

twitter.get('search/tweets', { q: 'shiba since:2011-07-11', count: 100 }, function(err, data, response) {
    console.log(data)
  })

// test du job
var j = schedule.scheduleJob('0 1 * * *', function(){
  var formatted = dateTime.create().format('Y-m-d H:M:S');
  logger.debug(formatted);
});
