var twit = require('twit');
var config = require('./config.js');
var schedule = require('node-schedule');
var throng = require('throng');
var giphy = require('giphy-api')('doyfDKYfROgpVGx7qdWwc0A4h8rCAFo3');
var fs = require('fs');
const Path = require('path');
const Listr = require('listr');
const Axios = require('axios');

const search_gif = ['shiba', 'shiba inu', 'shibas', 'shibe'];

var randomGif = getRandom(search_gif);

giphy.random(randomGif).then(function (res){
  console.log("Téléchargement de cette video : " + res.data.image_mp4_url);
  downloadImg(res.data.image_mp4_url);
})

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
