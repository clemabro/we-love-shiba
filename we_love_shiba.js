var twit = require('twit');
var config = require('./config.js');
var schedule = require('node-schedule');
var throng = require('throng');
var giphy = require('giphy-api')('doyfDKYfROgpVGx7qdWwc0A4h8rCAFo3');
var fs = require('fs');
const Path = require('path');
const Listr = require('listr');
const Axios = require('axios');

const search_terms = ['shiba', 'shiba inu', 'shiba chien', 'shiba inu chien', 'chien', 'dog', 'dogs', 'chiens', 'shibas', 'shibe'];
const search_gif = ['shiba', 'shiba inu', 'shibas', 'shibe'];
const hashtag = ['#Shiba', '#Shibe', '#ShibaInu'];

var twitter = new twit(config);

throng({
  workers: 1,
  lifetime: Infinity
}, start);

function start() {
  
  var randomList = getRandom(search_terms);
  var randomGif = getRandom(search_gif);

  // test du job
  
  var j = schedule.scheduleJob('*/30 * * * *', function(){
    findUserByTopic(randomList).then( function(value){
      addToFollow(value);
    });
  });

  var ruleDownload = new schedule.RecurrenceRule();
  ruleDownload.hour = 8;
  ruleDownload.minute = 20;

  var h = schedule.scheduleJob(ruleDownload, function(){
    giphy.random(randomGif).then(function (res){
      console.log("Téléchargement de cette video : " + res.data.image_mp4_url);
      downloadImg(res.data.image_mp4_url);
    })
  });
  
  var rule = new schedule.RecurrenceRule();
  rule.hour = 8;
  rule.minute = 35;
  
  var g = schedule.scheduleJob(rule, function(){
      console.log("Execution de l'upload de l'image sur twitter")
      uploadImg();
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

function downloadImg(img_url) {
  var tasks = [{
    title: 'Downloading',
    task: async (ctx, task) => {
      const url = img_url;
      const path = Path.resolve(__dirname, 'images', 'imgpost.mp4')

      const response = await Axios({
        method: 'GET',
        url: url,
        responseType: 'stream'
      })

      response.data.pipe(fs.createWriteStream(path))

      return new Promise((resolve, reject) => {
        response.data.on('end', () => {
          resolve()
        })

        response.data.on('error', err => {
          reject(err)
        })
      })
    }
  }]


  new Listr(tasks).run().then(tasks = null);
};

const splitFile = require('split-file')
const Twitter = require('twitter')
const Promise = require('bluebird')

const client = new Twitter({
  consumer_key: process.env.CONSUMER_KEY,  
  consumer_secret: process.env.CONSUMER_SECRET,
  access_token_key: process.env.ACCESS_TOKEN,  
  access_token_secret: process.env.ACCESS_TOKEN_SECRET
});

function uploadImg() {
  console.log("Uploading")
  const pathToMovie = 'images/imgpost.mp4';
  const mediaType = 'video/mp4' // `'video/mp4'` is also supported
  
  let Names
  const mediaSize = fs.statSync(pathToMovie).size
  /* Twitter support Maximum  15MB video files. So we need to split this 
  file in to three files */
  splitFile.splitFile(pathToMovie, 3)
  .then((names) => {
    Names = names
    return init()
  })
  .catch((err) => {
  console.log('Error: ', err)
  })

  const init = () => {
    initTweetUpload(mediaSize, mediaType) // Declare that you wish to upload some media
    .then(appendTweetUpload) // Send the data for the media
    .then(appendTweetUpload) // Send the data for the media
    .then(appendTweetUpload) // Send the data for the media
    .then(finalizeTweetUpload) // Declare that you are done uploading chunks
  // eslint-disable-next-line promise/always-return
    .then((data) => {
      const status = {
        media_ids: data,
        status: getRandom(hashtag),
    }

    client.post('statuses/update', status, (error, tweet, response) => {
      console.log("Tweet OK : " + tweet.created_at);
    })
  }).catch((err) => {
    console.log('Error: ', err)
    })
  }

  const initTweetUpload = (mediaSize, mediaType) => makePost('media/upload', 
  {
  command: 'INIT',
  total_bytes: mediaSize,
  media_type: mediaType,
  }).then((data) => data.media_id_string)

  let i = 0

  const appendTweetUpload = (mediaId) => {
  const p = Names.shift()
  /* mediaData is the  raw binary file content being uploaded ,It must be 
  <= 5 MB */
  const mediaData = fs.readFileSync(p)
  return makePost('media/upload', {
    command: 'APPEND',
    media_id: mediaId,
    media: mediaData,
    segment_index: i++,
  }).then((data) => mediaId)
  }

  const finalizeTweetUpload = (mediaId) => makePost('media/upload', {
  command: 'FINALIZE',
  media_id: mediaId,
  }).then((data) => mediaId)

  const makePost = (endpoint, params) =>
  // params.media_category = 'tweet_video';
  new Promise((resolve, reject) => {
  client.post(endpoint, params, (error, data, response) => {
    if (error) {
      reject(error)
    } else {
      resolve(data)
    }
  })
  })
}
