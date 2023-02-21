<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import * as Colyseus from 'colyseus.js';
	import { writable } from 'svelte/store';

	let roomId: string = $page.url.searchParams.get('room') || '';
	let locked: boolean = true;
	const shoutOutMessage = writable('Waiting for host to start game...');

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

	async function connect() {
		const client = new Colyseus.Client('ws://localhost:3000');
		const roomId = $page.url.searchParams.get('room');
		const name = $page.url.searchParams.get('name');
		try {
			// @ts-ignore
			room = await client.joinById(roomId, { name: name }).then((room) => {
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

				room.onMessage('board update', (message) => {
					board = message;
				});
				room.onMessage('gameover', (message) => {
					alert('Winner: ' + message.winner);
				});
				room.onMessage('*', (message: any) => {
					shoutOutMessage.set(message);
				});
				return room;
			});
		} catch (error) {
			alert(error);
			goto('/');
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

	onMount(() => {
		if (browser) {
			connect();
		}
	});

	onDestroy(() => {
		if (room) {
			room.leave();
		}
	});
</script>

<div>
	{#if room}
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
					<button
						class="bg-error-600 p-4 lg:px-8 rounded-xl max-sm:w-1/4 max-sm:text-sm max-sm:h-fit"
						on:click={leaveGame}>Leave Game</button
					>
					<h1 class="text-center max-sm:w-1/3 max-sm:!text-base h-fit my-auto">{roomId}</h1>
					<button
						class="bg-success-600 p-4 lg:px-8 rounded-xl max-sm:w-1/4 max-sm:text-sm max-sm:h-fit"
						on:click={startGame}
						disabled={!locked}>Start game</button
					>
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
