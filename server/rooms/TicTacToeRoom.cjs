// Create a new room for a tic tac toe game that uses colyseus as the server.
const colyseus = require("colyseus");
const schema = require("@colyseus/schema");
const defineTypes = schema.defineTypes;

class Player extends schema.Schema {
}

defineTypes(Player, {
    name: "string",
    symbol: "string",
    isTurn: "boolean"
});

class State extends schema.Schema {
}

defineTypes(State, {
    board: "string",
    turn: "string",
    message: "string",
    winner: "string",
    players: { map: Player },
    started: "boolean",
    draw: "boolean"
});

exports.TicTacToe = class TicTacToe extends colyseus.Room {
    onCreate () {
        this.maxClients = 2;
        this.setState(new State());
        this.state.board = JSON.stringify([{
            player: "",
            symbol: ""
        }, {
            player: "",
            symbol: ""
        }, {
            player: "",
            symbol: ""
        }, {
            player: "",
            symbol: ""
        }, {
            player: "",
            symbol: ""
        }, {
            player: "",
            symbol: ""
        }, {
            player: "",
            symbol: ""
        }, {
            player: "",
            symbol: ""
        }, {
            player: "",
            symbol: ""
        }]);
        this.state.turn = "X";
        
        this.onMessage("move", (client, message) => {
            if (!this.state.started) {
                client.send("*","Game hasn't started yet!");
                return;
            }
            if (this.state.players[client.sessionId].isTurn) {
                const board = JSON.parse(this.state.board);
                if (!board[message].symbol === "") {
                    client.send("*","That space is already taken!");
                    return;
                }
                board[message].symbol = this.state.players[client.sessionId].symbol;
                board[message].player = this.state.players[client.sessionId].name;
                this.state.board = JSON.stringify(board);
                this.checkForWinner();
                if (this.state.winner) {
                    this.broadcast("gameover", {winner: this.state.winner});
                    this.broadcast("*", "Waiting for host to restart game...")
                    this.changeTurns();
                    return;
                }
                else {
                this.changeTurns();
                this.broadcast("board update", JSON.parse(this.state.board));
                if (this.state.draw) {
                    this.broadcast("*", "It's a draw!" + " " + "Restarting game..." + " " + "Your turn!", { except: client });
                    client.send("*", "It's a draw!" + " " + "Restarting game..." + " " + "Waiting for opponent...");
                    this.state.draw = false;
                    return;
                }
                this.broadcast("*", "Your turn", { except: client });
                client.send( "*","Waiting for opponent...");
                }
            }
            else {
                client.send("*","It's not your turn!");
            }})

        this.onMessage("start", (client) => {
            if (client.sessionId === this.clients[0].sessionId) {
                this.state.broadcast = "Game started!";
                this.state.players[client.sessionId].isTurn = true;
                this.state.started = true;
                this.broadcast("*", "Game started!" + " " + this.state.players[client.sessionId].name + " is first!", { except: client })
                client.send("*", "Your turn!");
                }
            else {
                client.send("*", "You're not the host!")
            }
            });

        this.onMessage("restart", (client) => {
            if (client.sessionId === this.clients[0].sessionId) {
                this.state.board = JSON.stringify([{
                    player: "",
                    symbol: ""
                }, {
                    player: "",
                    symbol: ""
                }, {
                    player: "",
                    symbol: ""
                }, {
                    player: "",
                    symbol: ""
                }, {
                    player: "",
                    symbol: ""
                }, {
                    player: "",
                    symbol: ""
                }, {
                    player: "",
                    symbol: ""
                }, {
                    player: "",
                    symbol: ""
                }, {
                    player: "",
                    symbol: ""
                }]);
                this.state.winner = "";
                this.state.draw = false;
                this.broadcast("board update", JSON.parse(this.state.board));
                this.broadcast("*", "Game restarted!" + " " + this.state.turn + " is first!");
            }
            else {
                client.send("*", "You're not the host!")
            }
        });
    }

    onJoin (client, options) {
        this.state.players = this.state.players || {};
        this.state.players[client.sessionId] = new Player();
        this.state.players[client.sessionId].name = options.name;
        this.state.players[client.sessionId].symbol = this.state.turn;
        this.state.players[client.sessionId].isTurn = false;

        if (this.clients.length === 2) {
        this.broadcast("lobby players", {player1: this.state.players[this.clients[0].sessionId], player2: this.state.players[this.clients[1].sessionId]});
        }
        else {
            this.broadcast("lobby players", {player1: this.state.players[this.clients[0].sessionId]});
        }
        
        if (this.state.turn === "X") {
            this.state.turn = "O";
            this.state.players[client.sessionId].isTurn = true;
            }
        
        if (this.clients > 2) {
            this.clients[0].send("*","Waiting for opponent to join...");
        }

        if (this.locked) {
            this.clients[0].send("locked", "Game is full! Ready to start?")
        }
    }

    onLeave (client, consented) {
        if (consented) {
        this.broadcast("person left", this.state.players[client.sessionId].name);
        } else {
        this.broadcast("person crashed", this.state.players[client.sessionId].name);
        }
    }

    onDispose () {
        
        }

    changeTurns () {
        for (let id in this.clients) {
            this.state.players[this.clients[id].sessionId].isTurn = !this.state.players[this.clients[id].sessionId].isTurn;
            }
        }

    checkForWinner () {
        const board = JSON.parse(this.state.board);
        const winningCombos = [
            [0, 1, 2],
            [3, 4, 5],
            [6, 7, 8],
            [0, 3, 6],
            [1, 4, 7],
            [2, 5, 8],
            [0, 4, 8],
            [2, 4, 6]
            ];
        
        for (let i = 0; i < winningCombos.length; i++) {
            const [a, b, c] = winningCombos[i];

            if (board[a].symbol === "" && board[b].symbol === "" && board[c].symbol === "") {
                continue;
                }
            else if (board[a].symbol && board[a].symbol === board[b].symbol && board[a].symbol === board[c].symbol) {
                this.state.winner = board[a].player;
                }
            }
        for (let i = 0; i < board.length; i++) {
            if (board[i].symbol === "") {
                return;
                }
            }
            this.state.draw = true;
            this.state.board = JSON.stringify([{
                player: "",
                symbol: ""
            }, {
                player: "",
                symbol: ""
            }, {
                player: "",
                symbol: ""
            }, {
                player: "",
                symbol: ""
            }, {
                player: "",
                symbol: ""
            }, {
                player: "",
                symbol: ""
            }, {
                player: "",
                symbol: ""
            }, {
                player: "",
                symbol: ""
            }, {
                player: "",
                symbol: ""
            }]);
        }
}

// module.exports = {
//     Player,
//     State
// }