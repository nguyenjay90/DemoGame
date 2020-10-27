module.exports = function (server) {
	var io = require('socket.io').listen(server);
	console.log('Server started');
	var games = {};
	io.sockets.on('connection', function (socket) {
		socket.on('join', function (data) {
			console.log("data Hau Test", data);
			var username = data.name;
			var room = data.token;
			if (!(room in games)) {
				var minPlayers = data.minPlayers;
				var color = randomColour();
				var players = [{
					socket: socket,
					name: username,
					status: 'joined',
					score: 0,
					color: color
				}];
				games[room] = {
					room: room,
					creator: socket,
					status: 'waiting',
					minPlayers: minPlayers,
					createdAt: Date.now(),
					players: players,
					colors: [color],
					blocksDone: 0,
					root: username
				};

				socket.join(room);
				socket.emit('wait', {
					'display_data': 'Your Game room is : <b>' + data.token + '</b><br>Waiting for other players to join...'
				});
				console.log("fuck dsafdafdafdsaf",games.minPlayers);
				return;
			}
			var game = games[room];
			if (game.status == 'ready') {
				socket.emit('missed', {
					'display_data': 'Sorry...Game has already been started :('
				});
				return;
			}

			socket.join(room);
			var player = {};
			player.name = username;
			player.socket = socket;
			player.status = 'joined';
			player.score = 0;
			var color = randomColour();
			while (color in game.colors) {
				color = randomColour();
			}
			player.color = color;
			game.status = 'waiting';
			game.players.push(player);
			game.colors.push(color);
			if(game.players.length >game.minPlayers){
				socket.emit('fullRoom',{
					'display_data' : 'Full Room.Please choose another room.Thank you very much !',
					'status' : false
				});
				return;
			}
			io.sockets.to(room).emit('player-joined', {
				'display_data': username + ' has joined the game',
				'color': color
			});

		});
		socket.on('start_game', function (data) {
			var game = games[data.token];
			if (game.players.length < 2) {
				socket.emit('no_players', {
					'display_data': 'There are no other players.<br>Wait until atleast one player joins.<br>Send your token <b>' + data.token + '</b> to friends.',
					'status': false
				});
				return;
			}
			data.players_info = getPlayersInfo(game);
			data.freezeTime = game.freezeTime;
			game.status = 'ready';
			io.sockets.to(data.token).emit('start', data);
			io.sockets.to(data.token).emit('score_update', data.players_info);
			var countdown = 15;
			var countDownTime = setInterval(function () {
				countdown--;
				io.sockets.to(data.token).emit('timer', { countdown: 'Count Down Time :' + countdown });
				if (countdown == 0) {
					var user = data.user;
					var token = data.token;
					var game = games[token];
					var winners = getWinner(game);
					if (hasWinner(winners)) {
						io.sockets.to(data.token).emit('game_done', {
							'display_data': 'Game completed.<br>You can start a new game <a href="/">here</a>.<br>',
							'winners': winners
						});
					}
					else {
						io.sockets.to(data.token).emit('game_done', {
							'display_data': 'Game completed: Draw.<br>You can start a new game <a href="/">here</a>.<br>',

						});
					}

				}
				if (countdown === 0) {
					clearInterval(countDownTime);
				}
			}, 1000);

		});
		socket.on('cell_click', function (data) {
			var user = data.user;
			var token = data.token;
			var seqNum = data.seqNum;
			var game = games[token];
			if (seqNum != game.blocksDone)
				return;
			game.blocksDone += 1;
			var player = game.players.find(x => x.name === user);
			player.score += 1;
			io.sockets.to(token).emit('score_update', getPlayersInfo(game));
			io.sockets.to(token).emit('freeze', {
				'counter': game.blocksDone
			});
			io.sockets.to(token).emit('unfreeze', {
				'counter': game.blocksDone
			});
			io.sockets.to(token).emit('onClick', data);

		});
		socket.on('cell_hoverOn', function (data) {
			io.sockets.to(data.token).emit('onHoverOn', data);
		});
		socket.on('cell_hoverOff', function (data) {
			io.sockets.to(data.token).emit('onHoverOff', data);
		});
		socket.on('disconnect', function (data) {
			for (var token in games) {
				var game = games[token];
				for (var i = 0; i < game.players.length; i++) {
					var player = game.players[i];
					if (player.socket === socket) {
						socket.broadcast.to(token).emit('player-disconnected', {
							'color': player.color,
							'display_data': player.name + ' disconnected'
						});
						game.players.splice(i, 1);
						if (game.players.length > 0) {
							if (game.players.length == 1 && game.status === "ready") {
								console.log("game done");
								socket.broadcast.to(token).emit('abort', {
									'display_data': 'You are the Winner .Start another Game <a href="/">here</a>.'
								});
								game.players[0].socket.leave(token);
								delete game;
							}
						}
					}
				}
			}
		});

		function randomColour() {
			var colour = '#' + Math.floor(Math.random() * 16777215).toString(16);
			if (colour.length == 7)
				return colour;
			else
				return colour + '1';
		}
		function hasWinner(winner) {
			var found = true;
			for (var i = 0; i < winner.length; i++) {
				if (winner[i].score == 0) {
					found = false;
				}
			}
			return found
		}
		function getPlayersInfo(game) {
			players_info = {};
			for (var each in game.players) {
				players_info[game.players[each].name] = {
					'score': game.players[each].score,
					'color': game.players[each].color
				}
			}
			return players_info;
		}

		function getWinner(game) {
			var winners = [];
			var max = -1;
			for (var each in game.players) {
				console.log(game.players[each].score);
				if (game.players[each].score > max) {
					winners = [];
					winners.push({
						'name': game.players[each].name,
						'score': game.players[each].score
					});
					max = game.players[each].score;
				}
				else if (game.players[each].score == max) {
					winners.push({
						'name': game.players[each].name,
						'score': game.players[each].score
					});
				}
			}
			return winners;
		}
	});
};
