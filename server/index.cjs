const { env } = require('process');
require('dotenv').config();
const { Server } = require('colyseus');
const { monitor } = require('@colyseus/monitor');
const { WebSocketTransport } = require('@colyseus/ws-transport');
const https = require('https');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const { TicTacToe } = require('./rooms/TicTacToeRoom.cjs');

const port = Number(env.PORT || 2567);

const options = {
	key: fs.readFileSync("./server.key"),
	cert: fs.readFileSync("./server.crt"),
}

const app = express();
app.use(express.json(),cors({origin: '*'}));
const gameServer = new Server({
	transport: new WebSocketTransport({
		server: https.createServer(options, app)
	})
});

// register your room handlers
gameServer.define('tictactoe', TicTacToe);

function getFileOrDirectory(file, path) {
	if (fs.existsSync(path + file) && fs.lstatSync(path + file).isDirectory()) {
		const newPath = path + file + '/';
		return {
			name: file,
			type: 'folder',
			path: newPath,
			children: fs.readdirSync(`${path}/${file}`).map((file) => {
				return getFileOrDirectory(file, newPath);
			})
		};
	} else {
		return {
			name: file,
			type: 'file'
		};
	}
}

app.get('/data', (req, res) => {
	// send back all the files in base directory
	// const data = fs.readdirSync('./').forEach((file) => {
	// 	if (file === 'node_modules') return;
	// 	getFileOrDirectory(file, './');
	// });
	const data = fs.readdirSync('./').map((file) => {
		if (file === 'node_modules') return;
		return getFileOrDirectory(file, './');
	});
	res.json(data);
});

app.use("/colyseus", monitor());

gameServer.listen(port);
console.log(`Listening on ws://localhost:${port}`);
