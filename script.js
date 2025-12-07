document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const scoreElement = document.getElementById('score');
    const roundElement = document.getElementById('round');
    const skipsUsedElement = document.getElementById('skips-used');
    const snippetDurationElement = document.getElementById('snippet-duration');
    const playButton = document.getElementById('play-button');
    const skipButton = document.getElementById('skip-button');
    const songSearchInput = document.getElementById('song-search');
    const searchResultsContainer = document.getElementById('search-results');
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
    let selectedSongId = null;

    // --- Game Initialization ---
    async function initializeGame() {
        try {
            const response = await fetch('songs.json');
            songsData = await response.json();
            loadRound();
        } catch (error) {
            console.error('Error loading song data:', error);
            feedbackElement.textContent = 'Failed to load song data. Please try refreshing the page.';
        }
    }

    // --- Round Management ---
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

        skipsUsed = 0;
        snippetDuration = 3;
        selectedSongId = null;

        roundElement.textContent = round;
        skipsUsedElement.textContent = skipsUsed;
        snippetDurationElement.textContent = snippetDuration;
        feedbackElement.textContent = '';
        feedbackElement.className = '';
        songSearchInput.value = '';
        songSearchInput.disabled = false;
        submitGuessButton.disabled = true; // Disable by default
        skipButton.disabled = false;
        nextRoundButton.style.display = 'none';
    }

    // --- Gameplay Actions ---
    function playSnippet() {
        if (audioTimeout) clearTimeout(audioTimeout);
        audioPlayer.pause();
        audioPlayer.currentTime = 0;
        audioPlayer.play();
        audioTimeout = setTimeout(() => audioPlayer.pause(), snippetDuration * 1000);
    }

    function useSkip() {
        if (skipsUsed < 6) {
            skipsUsed++;
            snippetDuration += 2;
            skipsUsedElement.textContent = skipsUsed;
            snippetDurationElement.textContent = snippetDuration;
            if (skipsUsed === 6) skipButton.disabled = true;
        }
    }

    function handleGuess() {
        songSearchInput.disabled = true;
        submitGuessButton.disabled = true;
        skipButton.disabled = true;
        if (audioTimeout) clearTimeout(audioTimeout);
        audioPlayer.pause();
        searchResultsContainer.style.display = 'none';

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

    // --- Search Functionality ---
    function filterSongs(searchText) {
        selectedSongId = null;
        submitGuessButton.disabled = true; // Disable while searching
        if (!searchText) {
            searchResultsContainer.innerHTML = '';
            searchResultsContainer.style.display = 'none';
            return;
        }
        const lowerCaseSearchText = searchText.toLowerCase();
        const filteredSongs = songsData.filter(song =>
            song.title.toLowerCase().includes(lowerCaseSearchText) ||
            song.artist.toLowerCase().includes(lowerCaseSearchText)
        );
        renderSearchResults(filteredSongs);
    }

    function renderSearchResults(filteredSongs) {
        searchResultsContainer.innerHTML = '';
        if (filteredSongs.length > 0) {
            filteredSongs.forEach(song => {
                const resultItem = document.createElement('div');
                resultItem.className = 'result-item';
                resultItem.textContent = `${song.title} - ${song.artist}`;
                resultItem.dataset.songId = song.id;
                resultItem.addEventListener('click', () => selectSong(song));
                searchResultsContainer.appendChild(resultItem);
            });
            searchResultsContainer.style.display = 'block';
        } else {
            searchResultsContainer.style.display = 'none';
        }
    }

    function selectSong(song) {
        selectedSongId = song.id;
        songSearchInput.value = `${song.title} - ${song.artist}`;
        searchResultsContainer.innerHTML = '';
        searchResultsContainer.style.display = 'none';
        submitGuessButton.disabled = false; // Enable after selection
    }

    function endGame() {
        feedbackElement.textContent = `Game Over! Your final score is ${score}.`;
        feedbackElement.className = 'correct';
        playButton.disabled = true;
        skipButton.disabled = true;
        songSearchInput.disabled = true;
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
    songSearchInput.addEventListener('input', () => filterSongs(songSearchInput.value));
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-container')) {
            searchResultsContainer.style.display = 'none';
        }
    });

    initializeGame();
});
