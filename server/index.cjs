const { env } = require('process');
require('dotenv').config();
const { Server } = require('colyseus');
const { monitor } = require('@colyseus/monitor');
const { WebSocketTransport } = require('@colyseus/ws-transport');
const http = require('http');
const express = require('express');
const cors = require('cors');
const { TicTacToe } = require('./rooms/TicTacToeRoom.cjs');

const port = Number(env.PORT || 2567);

const app = express();
app.use(cors({origin: '*'}));
const gameServer = new Server({
	transport: new WebSocketTransport({
		server: http.createServer(app)
	})
});

// register your room handlers
gameServer.define('tictactoe', TicTacToe);

app.use("/colyseus", monitor());

gameServer.listen(port);
console.log(`Listening on ws://localhost:${port}`);
