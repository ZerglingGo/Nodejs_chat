var DEBUG_MODE = true;

var express = require('express');
var app = express();
var server = app.listen(1337);
var router = require('./router/main')(app);

console.log('Server has started on port 1337');

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.engine('html', require('ejs').renderFile);
 

var io = require('socket.io')(server); 

// 채팅중인 유저 목록 배열
var userlist = [];

function User(socket, nickname, token, clientIp) {
   this.getSocket = function() {
       	return socket;
   }
   this.getNickname = function() {
       	return nickname;
   }
   this.getToken = function() {
       	return token;
   }
   this.getClientIp = function() {
   		return clientIp;
   }
}

io.on('connection', function(socket) {
	var clientIp = socket.handshake.headers['x-forwarded-for'];
	console.log('A user connected. from ' + clientIp);
	
	socket.on('send handshake', function(data){
		var flagExist = false;
		userlist.forEach(function(item) {
			if(item.getNickname() == data.nickname_key) {
				// 닉네임 중복
				console.log("exist nickname_key: " + data.nickname_key);
				socket.emit('exist nickname_key');
				socket.disconnect();
				flagExist = true;
				return;
			}
		});

		if(flagExist) return;
		var user = new User(socket, data.nickname_key, data.token_key, clientIp);
		userlist.push(user);
		io.emit('join', {user: data.nickname_key, ip: clientIp});

		if(DEBUG_MODE) {
			console.log(user.getSocket().id + "|" + user.getNickname() + "|" + user.getToken() + "|" + user.getClientIp());
		}
	});

	socket.on('chat message', function(data){
		userlist.forEach(function(item) {
			// 토큰이 일치한다면
			if(item.getToken() == data.token_key)  {
				if(data.chat_message === "") return;
				// 채팅 내용을 전송해준다.
				data.ip = clientIp;
				io.emit('chat message', data);
				if(DEBUG_MODE) {
					console.log('[DEBUG] Chat Message: ' + data.chat_message + ', IP : ' + clientIp);
				}
			} 
		});
	});


	socket.on('disconnect', function(){
		userlist.forEach(function(user, index) {
			if(user.getSocket() === socket) {
				userlist.splice(index, 1);
				console.log('User disconnected. Userlist : ' + userlist.length);
				io.emit('leave', {user: user.getNickname(), ip: clientIp});
			}
		});

		console.log('User disconnected. from ' + clientIp);
	});


});

app.use(express.static('public'));