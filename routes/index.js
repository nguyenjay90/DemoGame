var express = require('express');

var router = express.Router();

gameList = [];

router.get('/', function(req, res) {
	res.render('partials/index',{
        footer_title:" How to play the game",
        footer_content:" You can join and exiting game - Click 'Join' with the Room Id,You can start a new game by clicking 'New-Game'"
    });
});

router.get('/game/:token/:user', function(req, res) {
	var token = req.params.token;
    var user = req.params.user;
    res.render('partials/game', {
        title: 'Demo Game',
        user: user,
        token: token,
        js: 'game.js',
		isHost: req.flash('isHost'),
		minPlayers: req.flash('minPlayers'),
    });
});

module.exports = router;