const { Server } = require("colyseus");
const { WebSocketTransport } = require("@colyseus/ws-transport");
const http = require("http");
const express = require("express");
const { TicTacToe } = require('./rooms/TicTacToeRoom.cjs')

const port = 3000;

const app = express();
const gameServer = new Server({
    transport: new WebSocketTransport({
        server: http.createServer(app)
    })
});

// register your room handlers
gameServer.define("tictactoe", TicTacToe);

gameServer.listen(port);
console.log(`Listening on ws://localhost:${ port }`);
