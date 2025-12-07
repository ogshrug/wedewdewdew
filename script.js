document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const scoreElement = document.getElementById('score');
    const roundElement = document.getElementById('round');
    const skipsUsedElement = document.getElementById('skips-used');
    const snippetDurationElement = document.getElementById('snippet-duration');
    const playButton = document.getElementById('play-button');
    const skipButton = document.getElementById('skip-button');
    const songDropdown = document.getElementById('song-dropdown');
    const submitGuessButton = document.getElementById('submit-guess');
    const feedbackElement = document.getElementById('feedback');
    const nextRoundButton = document.getElementById('next-round');
    const audioPlayer = document.getElementById('audio-player');

    // Game State
    let score = 0;
    let round = 1;
    let songsData = [];
    let currentSong = null;
    let playedSongIds = new Set();
    let skipsUsed = 0;
    let snippetDuration = 3;
    let audioTimeout = null;

    // --- Game Initialization ---
    async function initializeGame() {
        try {
            const response = await fetch('songs.json');
            songsData = await response.json();
            populateDropdown();
            loadRound();
        } catch (error) {
            console.error('Error loading song data:', error);
            feedbackElement.textContent = 'Failed to load song data. Please try refreshing the page.';
        }
    }

    function populateDropdown() {
        songsData.forEach(song => {
            const option = document.createElement('option');
            option.value = song.id;
            option.textContent = `${song.title} - ${song.artist}`;
            songDropdown.appendChild(option);
        });
    }

    // --- Round Management ---
    function loadRound() {
        if (playedSongIds.size === songsData.length) {
            endGame();
            return;
        }

        // Select a random, unplayed song
        let randomSong;
        do {
            randomSong = songsData[Math.floor(Math.random() * songsData.length)];
        } while (playedSongIds.has(randomSong.id));

        currentSong = randomSong;
        playedSongIds.add(currentSong.id);
        audioPlayer.src = currentSong.audioPath;

        // Reset state for the new round
        skipsUsed = 0;
        snippetDuration = 3;

        // Update UI
        roundElement.textContent = round;
        skipsUsedElement.textContent = skipsUsed;
        snippetDurationElement.textContent = snippetDuration;
        feedbackElement.textContent = '';
        feedbackElement.className = '';
        songDropdown.disabled = false;
        submitGuessButton.disabled = false;
        skipButton.disabled = false;
        nextRoundButton.style.display = 'none';
    }

    // --- Gameplay Actions ---
    function playSnippet() {
        // Stop any previously playing snippet
        if (audioTimeout) {
            clearTimeout(audioTimeout);
        }
        audioPlayer.pause();
        audioPlayer.currentTime = 0;

        audioPlayer.play();

        // Stop the audio after the current snippet duration
        audioTimeout = setTimeout(() => {
            audioPlayer.pause();
        }, snippetDuration * 1000);
    }

    function useSkip() {
        if (skipsUsed < 6) {
            skipsUsed++;
            snippetDuration += 2;
            skipsUsedElement.textContent = skipsUsed;
            snippetDurationElement.textContent = snippetDuration;

            if (skipsUsed === 6) {
                skipButton.disabled = true;
            }
        }
    }

    function handleGuess() {
        // Disable controls after guess
        songDropdown.disabled = true;
        submitGuessButton.disabled = true;
        skipButton.disabled = true;
        if (audioTimeout) {
            clearTimeout(audioTimeout);
        }
        audioPlayer.pause();

        // Check the answer and calculate score
        const selectedSongId = parseInt(songDropdown.value, 10);
        if (selectedSongId === currentSong.id) {
            const points = 10 - (skipsUsed * 2);
            score += points;
            scoreElement.textContent = score;
            feedbackElement.textContent = `Correct! +${points} points`;
            feedbackElement.className = 'correct';
        } else {
            feedbackElement.textContent = `Incorrect. The answer was ${currentSong.title} by ${currentSong.artist}.`;
            feedbackElement.className = 'incorrect';
        }

        nextRoundButton.style.display = 'block';
    }

    function endGame() {
        feedbackElement.textContent = `Game Over! Your final score is ${score}.`;
        feedbackElement.className = 'correct';
        playButton.disabled = true;
        skipButton.disabled = true;
        songDropdown.disabled = true;
        submitGuessButton.disabled = true;
        nextRoundButton.style.display = 'none';
    }

    // --- Event Listeners ---
    playButton.addEventListener('click', playSnippet);
    skipButton.addEventListener('click', useSkip);
    submitGuessButton.addEventListener('click', handleGuess);
    nextRoundButton.addEventListener('click', () => {
        round++;
        loadRound();
    });

    // --- Start the game ---
    initializeGame();
});
