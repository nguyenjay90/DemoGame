
(function(){
	
	$(document).ready(function(){
		var socket = io();
		var seqNum;		
		var token,user,color,isHost;
		token = $('#mainScreen').attr('data-token'); 
		user = $('#mainScreen').attr('data-user');
		isHost = $('#mainScreen').attr('data-host');
		$('#startGame').click(startGame);
		if(isHost){
			minPlayers = $('#gameInfo').attr('data-minPlayers');
			
			socket.emit('join',{
				'name' : user,
				'token' : token,
				'minPlayers' : minPlayers,
			});
		}
		else{
			socket.emit('join',{
				'name' : user,
				'token' : token
			});
		}
		
		socket.on('wait',function(data){
			displayData(data);
		});
		
		socket.on('missed',function(data){
			displayData(data);
		});
		
		socket.on('player-joined',function(data){
			displayDataScreenR(data);
		});
		
		socket.on('no_players',function(data){
			displayData(data);
		});
		socket.on('fullRoom',function(data){
			refreshPage(data);
		});
		
		socket.on('start',function(data){
			var players_info = data.players_info;
			seqNum = 0;
			var color = players_info[user].color;
			$('#mainScreen').html('');
			$('#startGame').text('Game has Started');
			$('#startGame').prop('disabled',true);
			$('#mainScreen').append('<div class="grid_cell" style=".ui-grid-solo { text-align:center; }"><button id="btn1" type="submit"  >Hit Me</button></div>');
			$('.grid_cell').hover(
				function(e){
					var cellId = e.target.id;
					console.log("sending onHoverOn");
						socket.emit('cell_hoverOn',{
							'token' : token,
							'cellId' : cellId,
							'color' : color
						});
				},
				function(e){
					var cellId = e.target.id;
					console.log("sending onHoverOff");
						socket.emit('cell_hoverOff',{
							'token' : token,
							'cellId' : cellId,
							'color' : color
						});
				}
			);
			
			$('.grid_cell').click(function(e){
				var cellId = e.target.id;
				if(!$('#'+cellId).hasClass("done")){
					console.log("sending click");
					socket.emit('cell_click',{
						'token' : token,
						'user' : user,
						'color' : color,
						'cellId' : cellId,
						'seqNum' : seqNum
					});
					console.log("Overlay showing in client");
				}
			});
		});
		
		socket.on('freeze',function(data){
			console.log("freeze");
			console.log("Overlay showing after server");
		});
		socket.on('unfreeze',function(data){
			console.log("unfreeze");
			seqNum = data.counter;
		});
		
		socket.on('onHoverOn',function(data){
			var cellId = data.cellId;
			$('#'+cellId).css("background-color",data.color);
		});
		socket.on('onHoverOff',function(data){
			var cellId = data.cellId;
			console.log("background-color : change to #fff");
			if(!$('#'+cellId).hasClass("done")){
				$('#'+cellId).css("background-color","#fff");
			}
		});
		socket.on('onClick',function(data){
			console.log("onClick - color : "+data.color);
			var cellId = data.cellId;
			$('#'+cellId).css("background-color",data.color);

		});
		
		socket.on('score_update',function(data){
			displayDataScreenL(data);
		});
		
		socket.on('game_done',function(data){
			gameDone(data);
		});
		socket.on('timer', function(data){
			$('#timeCountDown').html(data.countdown);
		  });
		socket.on('player-disconnected',function(data){
			displayDataScreenR(data);
		});
		socket.on('abort',function(data){
			displayData(data);
		});
		
		function startGame(){
			socket.emit('start_game',{
				'token' : token
			});
		}
		
		function displayData(data){
			if('display_data' in data){
				$('#mainScreen').html(data.display_data);
			}
		}
		function refreshPage(){
			alert("Full room,Please choose another room")
			window.location.replace("http://localhost:8000/");
			
		}
		function displayDataScreenR(data){
			if('display_data' in data){
				$('#sideScreenR').append('<li class="list-group-item"><font color="'+(("color"in data)? data.color : color)+'">'+data.display_data+'</font></li>');
			}
		}
		
		function displayDataScreenL(data){
			var html = '<ul class="list-group">';
			for(var player in data){
				html += '<li class="list-group-item"><span class="badge">'+data[player].score+'</span><b>'+player+'</b><div class="color" style="width:20px;height:20px;background-color:'+data[player].color+';display: inline-block;float: right;margin-right: 10px;"></div></li>';
			}
			html += '</ul>';
			$('#sideScreenL').html(html);
		}
		
		function gameDone(data){
			displayData(data);
			var html = '<p><h6>Winners :</h6></p>';
				for(var i=0;i<data.winners.length;i++){
					html += '<p>'+data.winners[i].name+' : '+data.winners[i].score+'</p>';
				}
				$('#mainScreen').append(html);
			
		}
		
	});
})();