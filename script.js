document.addEventListener('DOMContentLoaded', () => {
    const scoreElement = document.getElementById('score');
    const roundElement = document.getElementById('round');
    const playButton = document.getElementById('play-button');
    const songDropdown = document.getElementById('song-dropdown');
    const submitGuessButton = document.getElementById('submit-guess');
    const feedbackElement = document.getElementById('feedback');
    const nextRoundButton = document.getElementById('next-round');
    const audioPlayer = document.getElementById('audio-player');

    let score = 0;
    let round = 1;
    let songsData = [];
    let currentSong = null;
    let playedSongIds = new Set();

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

    function loadRound() {
        if (playedSongIds.size === songsData.length) {
            endGame();
            return;
        }

        let randomSong;
        do {
            randomSong = songsData[Math.floor(Math.random() * songsData.length)];
        } while (playedSongIds.has(randomSong.id));

        currentSong = randomSong;
        playedSongIds.add(currentSong.id);

        audioPlayer.src = currentSong.audioPath;
        roundElement.textContent = round;
        feedbackElement.textContent = '';
        feedbackElement.className = '';
        songDropdown.disabled = false;
        submitGuessButton.disabled = false;
        nextRoundButton.style.display = 'none';
    }

    function handleGuess() {
        const selectedSongId = parseInt(songDropdown.value, 10);
        songDropdown.disabled = true;
        submitGuessButton.disabled = true;

        if (selectedSongId === currentSong.id) {
            score++;
            scoreElement.textContent = score;
            feedbackElement.textContent = 'Correct!';
            feedbackElement.className = 'correct';
        } else {
            feedbackElement.textContent = `Incorrect. The correct answer was ${currentSong.title} by ${currentSong.artist}.`;
            feedbackElement.className = 'incorrect';
        }

        nextRoundButton.style.display = 'block';
    }

    function endGame() {
        feedbackElement.textContent = `Game Over! Your final score is ${score} out of ${songsData.length}.`;
        feedbackElement.className = 'correct';
        playButton.disabled = true;
        songDropdown.disabled = true;
        submitGuessButton.disabled = true;
        nextRoundButton.style.display = 'none';
    }

    playButton.addEventListener('click', () => {
        audioPlayer.play();
    });

    submitGuessButton.addEventListener('click', handleGuess);

    nextRoundButton.addEventListener('click', () => {
        round++;
        loadRound();
    });

    initializeGame();
});
