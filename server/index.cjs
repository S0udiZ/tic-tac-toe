const { env } = require('process');
require('dotenv').config();
const { Server } = require('colyseus');
const { monitor } = require('@colyseus/monitor');
const { WebSocketTransport } = require('@colyseus/ws-transport');
const https = require('http');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const { TicTacToe } = require('./rooms/TicTacToeRoom.cjs');

const port = Number(env.PORT || 2567);

// const options = {
// 	key: fs.readFileSync(env.KEY),
// 	cert: fs.readFileSync(env.CERT),
// 	ca: [
// 		fs.readFileSync(env.CAROOT),
// 		fs.readFileSync(env.CABUNDLE)
// 	]
// }

const app = express();
app.use(express.json(),cors({origin: '*'}));
const gameServer = new Server({
	transport: new WebSocketTransport({
		server: https.createServer(app)
	})
});

// register your room handlers
gameServer.define('tictactoe', TicTacToe);

app.get('/data', (req, res) => {
	// send back all the files in base directory
	res.json(fs.readdirSync('./'));
});

app.get('/data/:folder', (req, res) => {
	// send back the folder in requested directory
	res.json(fs.readdirSync(`./${req.params.folder}`));
});

app.use("/colyseus", monitor());

gameServer.listen(port);
console.log(`Listening on ws://localhost:${port}`);
