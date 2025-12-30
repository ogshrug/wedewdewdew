document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const loginOverlay = document.getElementById('login-overlay');
    const usernameInput = document.getElementById('username-input');
    const startGameButton = document.getElementById('start-game-button');
    const timerElement = document.getElementById('timer');
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
    const submitScoreButton = document.getElementById('submit-score-button');
    const audioPlayer = document.getElementById('audio-player');
    const progressBar = document.getElementById('progress-bar');
    const timeDisplay = document.getElementById('time-display');
    const volumeSlider = document.getElementById('volume-slider');
    const volumePercentage = document.getElementById('volume-percentage');

    // Game State
    let skipsAllowed = 3;
    let endRound = 5;
    let score = 0;
    let round = 1;
    let songsData = [];
    let currentSong = null;
    let playedSongIds = new Set();
    let skipsUsed = 0;
    let snippetDuration = 3;
    let audioTimeout = null;
    let selectedSongId = null;
    let username = '';
    let timerInterval = null;
    let timeRemaining = 480; // 8 minutes in seconds


    //Game Initialization
    async function initializeGame() {
        try {
            const response = await fetch('songs.json');
            songsData = await response.json();
            loadRound();
            startTimer();
        } catch (error) {
            console.error('Error loading song data:', error);
            feedbackElement.textContent = 'Failed to load song data. Please try refreshing the page.';
        }
    }

    //Round Management
    function loadRound() {
        if (round === endRound + 1) {
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
        progressBar.style.width = '0%';
        timeDisplay.textContent = '0:00 / 0:00';
        songSearchInput.disabled = false;
        submitGuessButton.disabled = true; // Disable by default
        skipButton.disabled = false;
        nextRoundButton.style.display = 'none';
    }

    //Gameplay
    function playSnippet() {
        if (audioTimeout) clearTimeout(audioTimeout);
        audioPlayer.pause();
        audioPlayer.currentTime = 0;
        audioPlayer.play();
        audioTimeout = setTimeout(() => audioPlayer.pause(), snippetDuration * 1000);
    }

    function useSkip() {
        if (skipsUsed < skipsAllowed) {
            skipsUsed++;
            snippetDuration += 2;
            skipsUsedElement.textContent = skipsUsed;
            snippetDurationElement.textContent = snippetDuration;
            if (skipsUsed === skipsAllowed) skipButton.disabled = true;
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

    //Search Functionality
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

    function endGame(force = false) {
        if (force) {
            feedbackElement.textContent = "Time's up! Your final score is " + score + ".";
        } else {
            feedbackElement.textContent = `Game Over! Your final score is ${score}.`;
        }
        clearInterval(timerInterval);
        feedbackElement.className = 'correct';
        playButton.disabled = true;
        skipButton.disabled = true;
        songSearchInput.disabled = true;
        submitGuessButton.disabled = true;
        nextRoundButton.style.display = 'none';
        submitScoreButton.style.display = 'block';
    }

    // --- Audio Player Updates ---
    function updateProgressBar() {
        const percentage = (audioPlayer.currentTime / snippetDuration) * 100;
        progressBar.style.width = `${percentage}%`;
        timeDisplay.textContent = `${formatTime(audioPlayer.currentTime)} / ${formatTime(snippetDuration)}`;
    }

    function formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
    }


    // --- Timer Functions ---
    function startTimer() {
        timerInterval = setInterval(updateTimer, 1000);
    }

    function updateTimer() {
        timeRemaining--;
        const minutes = Math.floor(timeRemaining / 60);
        const seconds = timeRemaining % 60;
        timerElement.textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

        if (timeRemaining <= 0) {
            clearInterval(timerInterval);
            endGame(true); // Force end due to time
        }
    }

    // --- Login ---
    async function startGame() {
        username = usernameInput.value.trim();
        if (username === '') {
            alert('Please enter a username.');
            return;
        }

        const usernameTaken = await isUsernameTaken(username);
        if (usernameTaken) {
            alert('This username is already taken. Please choose another one.');
            return;
        }

        loginOverlay.style.display = 'none';
        initializeGame();
    }

    // --- Event Listeners ---
    volumeSlider.addEventListener('input', () => {
        const percentage = Math.round(volumeSlider.value * 100);
        audioPlayer.volume = volumeSlider.value;
        volumePercentage.textContent = `${percentage}%`;
    });
    startGameButton.addEventListener('click', startGame);
    playButton.addEventListener('click', playSnippet);
    skipButton.addEventListener('click', useSkip);
    audioPlayer.addEventListener('timeupdate', updateProgressBar);
    audioPlayer.addEventListener('loadedmetadata', () => {
        timeDisplay.textContent = `0:00 / ${formatTime(snippetDuration)}`;
    });
    submitGuessButton.addEventListener('click', handleGuess);
    nextRoundButton.addEventListener('click', () => {
        round++;
        loadRound();
    });
    // --- Firebase Submission ---
    function handleScoreSubmission() {
        const timeTaken = 480 - timeRemaining;
        submitScore(username, score, timeTaken);
        submitScoreButton.disabled = true;
    }

    submitScoreButton.addEventListener('click', handleScoreSubmission);
    songSearchInput.addEventListener('input', () => filterSongs(songSearchInput.value));
    songSearchInput.addEventListener('click', () => {
        if (songSearchInput.value === '') {
            renderSearchResults(songsData);
        }
    });
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-container')) {
            searchResultsContainer.style.display = 'none';
        }
    });

    // Don't initialize game immediately, wait for login
    // initializeGame();
});
