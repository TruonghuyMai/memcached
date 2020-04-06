var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var port = process.env.PORT || 3000;
const responseTime = require('response-time')
const axios = require('axios');
const redis = require('redis');
const client = redis.createClient();

// Print redis errors to the console
client.on('error', (err) => {
  console.log("Error " + err);
});


app.use(responseTime());

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});




io.on('connection', function(socket){
  socket.on('chat message', function(msg){
  	console.log(msg);
  	var query = msg;
 	var url = `https://en.wikipedia.org/w/api.php?action=parse&format=json&section=0&page=${query}`;

 	//check if key already in cache if yes emit finish if no fech key and emit finish
  	client.get(`wikipedia:${query}`, (err, result) => {
    if (result) {
      const resultJSON = JSON.parse(result);
       socket.emit('finish');
    } else { 
      return axios.get(url)
        .then(response => {
          const responseJSON = response.data;
          client.setex(`wikipedia:${query}`, 3600, JSON.stringify({ source: 'Redis Cache', ...responseJSON, }));
          socket.emit('finish');

        })
        .catch(err => {
          return res.json(err);
        });
    }
  });







  });
});

http.listen(port, function(){
  console.log('listening on *:' + port);
});










