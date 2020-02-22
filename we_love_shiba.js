var twit = require('twit');
var config = require('./config.js');
var schedule = require('node-schedule');
var log4js = require('log4js');
var dateTime = require('node-datetime');
var throng = require('throng');

throng({
  workers: 1,
  lifetime: Infinity
}, start);

function start() {

  // Configuration du logger
  log4js.configure({
    appenders: { shiba: { type: 'file', filename: 'shiba.log' } },
    categories: { default: { appenders: ['shiba'], level: 'debug' } }
  });

  // Recuperation du logger shiba
  const logger = log4js.getLogger('shiba');

  var twitter = new twit(config);

  twitter.get('search/tweets', { q: 'shiba since:2011-07-11', count: 1 }, function(err, data, response) {
      logger.debug("Recherche de tweets ...");
      console.log(data)
  })

  // test du job
  var j = schedule.scheduleJob('* * * * *', function(){
    var dt = dateTime.create();
    var formatted = dt.format('Y-m-d H:M:S');
    logger.debug(formatted);
  });

}