<script lang="ts">
	import * as Colyseus from 'colyseus.js';
	import { onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { writable } from 'svelte/store';

	const client = new Colyseus.Client("ws://" + import.meta.env.VITE_serverUrl);

	let name = '';
	let created = false;
	let roomId = '';
	let locked = false;
	const shoutOutMessage = writable('Waiting for players...');

	let board = [
		{
			player: '',
			symbol: ''
		},
		{
			player: '',
			symbol: ''
		},
		{
			player: '',
			symbol: ''
		},
		{
			player: '',
			symbol: ''
		},
		{
			player: '',
			symbol: ''
		},
		{
			player: '',
			symbol: ''
		},
		{
			player: '',
			symbol: ''
		},
		{
			player: '',
			symbol: ''
		},
		{
			player: '',
			symbol: ''
		}
	];

	type Room = Colyseus.Room<any> & {
		board: 'string';
		turn: 'string';
		message: 'string';
		winner: 'string';
		players: { map: Player };
		started: 'boolean';
	};
	let room: Room;

	type Player = {
		name: string;
		symbol: string;
		isTurn: boolean;
	};
	let player1: Player;
	let player2: Player;

	async function createRoom() {
		try {
			// @ts-ignore
			room = await client.create('tictactoe', { name: name }).then((room) => {
				roomId = room.id;
				created = true;
				room.onMessage('person left', (message) => {
					alert(`Person left: ${message}`);
					room.leave();
					goto('/');
				});
				room.onMessage('lobby players', (message) => {
					// console.log(message);
					player1 = message.player1;
					player2 = message.player2;
				});
				room.onMessage('locked', (message) => {
					locked = true;
					shoutOutMessage.set(message);
				});
				room.onMessage('board update', (message) => {
					board = message;
				});
				room.onMessage('gameover', (message) => {
					if (window.confirm('Winner:' + message.winner + '\n Do you want to play again?')) {
						room.send('restart', {});
					} else {
						room.leave();
						goto('/', { replaceState: true });
					}
				});
				room.onMessage('*', (message: any) => {
					shoutOutMessage.set(message);
				});
				return room;
			});
		} catch (error) {
			alert(error);
		}
	}

	function sendMoveCommand(index: number) {
		room.send('move', index);
	}

	function startGame() {
		room.send('start', {});
	}

	function leaveGame() {
		if (confirm('Are you sure you want to leave the game?')) {
			room.leave();
			goto('/', { replaceState: true });
		}
	}

	onDestroy(() => {
		if (room) {
			room.leave();
		}
	});
</script>

<div>
	{#if !created}
		<div class="w-screen h-screen flex justify-center items-center">
			<div class="flex flex-wrap max-w-lg gap-10">
				<label class="lg:text-5xl text-xl mx-auto font-bold text-white">
                    Name:
                    <input class="text-black" type="text" bind:value={name} />
                </label>
				<button class="text-white text-5xl font-bold bg-secondary-600 rounded-xl p-5 px-10 mx-auto" on:click={createRoom}>Create Game</button>
			</div>
		</div>
	{:else}
		<div class="grid grid-cols-12 px-8">
			<div class="lg:col-span-3 col-span-6 py-8 text-center">
				<h1 class="">Player 1</h1>
				{#if player1}
					<h1>{player1.name}</h1>
					<h2>{player1.symbol}</h2>
				{/if}
			</div>
			<div class="col-span-6 py-8 text-center lg:hidden">
				<h1 class="">Player 2</h1>
				{#if player2}
					<h1>{player2.name}</h1>
					<h2>{player2.symbol}</h2>
				{/if}
			</div>
			<div class="lg:col-span-6 col-span-12 lg:border-x-8 py-8">
				<div class="flex flex-wrap justify-between lg:px-16">
					<button class="bg-error-600 p-4 lg:px-8 rounded-xl max-sm:w-1/4 max-sm:text-sm max-sm:h-fit" on:click={leaveGame}>Leave Game</button>
					<h1 class="text-center max-sm:w-1/3 max-sm:!text-base h-fit my-auto">{roomId}</h1>
					<button class="bg-success-600 p-4 lg:px-8 rounded-xl max-sm:w-1/4 max-sm:text-sm max-sm:h-fit" on:click={startGame} disabled={!locked}>Start game</button>
					<p class="w-full text-center !text-3xl my-12 font-bold">{$shoutOutMessage}</p>
				</div>
				<div class="grid grid-cols-3 grid-rows-3 lg:p-40 !pt-10">
					{#each board as cell, index}
						<div
							class="border hover:border-8 border-white w-full aspect-square flex justify-center items-center"
						>
							<button
								disabled={cell.symbol == 'X' || cell.symbol == 'O' || !locked}
								class="w-full h-full lg:text-9xl text-6xl font-bold font-sans"
								on:click={() => {
									sendMoveCommand(index);
								}}>{cell.symbol}</button
							>
						</div>
					{/each}
				</div>
			</div>
			<div class="col-span-3 py-8 text-center max-sm:hidden">
				<h1 class="">Player 2</h1>
				{#if player2}
					<h1>{player2.name}</h1>
					<h2>{player2.symbol}</h2>
				{/if}
			</div>
		</div>
	{/if}
</div>
