var twit = require('twit');
var config = require('./config.js');

var twitter = new twit(config);

T.get('search/tweets', { q: 'shiba since:2011-07-11', count: 100 }, function(err, data, response) {
    console.log(data)
  })