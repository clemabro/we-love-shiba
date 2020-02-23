var twit = require('twit');
var config = require('./config.js');
var schedule = require('node-schedule');
var throng = require('throng');

const search_terms = ['shiba', 'shiba inu', 'shiba chien', 'shiba inu chien', 'chien', 'dog', 'dogs', 'chiens', 'shibas'];

var twitter = new twit(config);

throng({
  workers: 1,
  lifetime: Infinity
}, start);

function start() {
  
  var randomList = getRandom(search_terms);

  // test du job
  var j = schedule.scheduleJob('*/30 * * * *', function(){
    findUserByTopic(randomList).then( function(value){
      addToFollow(value);
    });
  });

}

function addToFollow(idUser) {
  console.log('Following ' + idUser);
  twitter.post('friendships/create', {
      name: 'test',
      screen_name: idUser,
      follow: true
    })
    .then(({ data }) => {
      if (!data.id) {
        throw data.errors;
      } else {
        console.log(`Followed`);
      }
    })
    .catch(console.error);
}

function findUserByTopic(list) {
  console.log(`Finding a user tweeting about ${list}...`);
  return twitter.get('search/tweets', {
      q: `${list}`,
      count: 100
    })
    .then(({ data }) => {
      if (!data.statuses) throw data.errors;
      var idUser = data.statuses.filter((status) => !status.user.following).map((status) => status.user.screen_name).filter(unique);
      return idUser;
    })
    .then(getRandom)
    .catch(console.error);
}

function getRandom(arr) {
  return arr[ Math.floor(arr.length * Math.random()) ];
}

function unique(value, index, self) { 
  return self.indexOf(value) === index;
}
