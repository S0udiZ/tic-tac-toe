<script>

	let name = '';
	let roomId = '';

</script>

<div class="w-screen h-screen flex justify-center items-center">
    <div class="flex max-w-sm flex-wrap gap-10 justify-center items-center">
        <label for="" class="lg:text-5xl text-xl font-bold text-white">
            name:
            <input class="text-black" type="text" bind:value={name} />
        </label>
        <label for="" class="lg:text-5xl text-xl font-bold text-white">
            roomId:
            <input class="text-black" type="text" bind:value={roomId} />
        </label>
        <a class="bg-secondary-600 p-5 px-12 rounded-xl text-5xl !text-white font-bold !no-underline" href="/play?room={roomId}&name={name}">Join Game</a>
    </div>
</div>
