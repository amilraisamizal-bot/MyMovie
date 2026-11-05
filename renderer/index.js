{
// MyMovie - Movie Research: Electron + OMDb + Local Storage
// Uses fetch() for API, if...else, classes, and DOM events.
const searchForm = document.getElementById('searchForm');
const resultDiv = document.getElementById('result');
const detailsDiv = document.getElementById('details');
const message = document.getElementById('message');
const searchBtn = document.getElementById('searchBtn');
const recommendBtn = document.getElementById('recommendBtn');
const recommendMessage = document.getElementById('recommendMessage');
const recommendationsDiv = document.getElementById('recommendations');
const genreSelect = document.getElementById('genre');

const STORAGE_KEY = 'mymovie_watchlist';
const RECOMMENDATIONS_KEY = 'mymovie_recommendations';

// Insert only your OMDb API key here for local testing.


// =====================================================
// 1. OBJECT ORIENTED PROGRAMMING (OOP)
// Each saved movie is created as a MovieRecord object.
// =====================================================

class MovieRecord {

    constructor(movie, recommendation) {

        this.imdbID = movie.imdbID;
        this.Title = movie.Title;
        this.Year = movie.Year;
        this.Genre = movie.Genre;
        this.Poster = movie.Poster;
        this.imdbRating = movie.imdbRating;
        this.Runtime = movie.Runtime;
        this.recommendation = recommendation;
        this.status = 'Plan to Watch';
        this.notes = '';

    }
}

// =====================================================
// 2. READ MOVIES FROM LOCAL STORAGE
// =====================================================

function getMovies() {

    try {

        const movies = JSON.parse(
            localStorage.getItem(STORAGE_KEY)
        );

        return Array.isArray(movies) ? movies : [];

    } catch (error) {

        return [];

    }

}


// =====================================================
// 3. MOVIE SUGGESTION USING IF...ELSE
// =====================================================

function suggestMovie(genre) {

    const text = String(genre || '').toLowerCase();

    if (text.includes('horror')) {
        return 'Suitable for fans of suspense and scary stories.';

    } else if (text.includes('comedy')) {
        return 'Suitable for viewers who enjoy funny movies.';

    } else if (text.includes('romance')) {
        return 'Suitable for fans of romantic stories.';

    } else if (text.includes('sci-fi')) {
        return 'Suitable for science-fiction lovers.';

    } else if (text.includes('action')) {
        return 'Suitable for viewers who enjoy action scenes.';

    } else if (text.includes('drama')) {
        return 'Suitable for viewers who enjoy emotional stories.';

    } else {
        return 'No specific genre suggestion is available.';

    }
}

// =====================================================
// 4. MOVIE RUNTIME CALCULATION
// =====================================================

// Convert movie runtime from minutes into hours and minutes.

function runtimeLabel(runtime) {

    const minutes = parseInt(runtime, 10);

    if (!Number.isFinite(minutes) || minutes <= 0) {

        return 'Runtime unavailable';

    }

    const hours = Math.floor(minutes / 60);

    return `${minutes} minutes = ${hours} hour(s) ${minutes % 60} minute(s)`;

}

// =====================================================
// 5. FETCH MOVIE INFORMATION FROM OMDb API
// =====================================================

async function requestMovie(title, year = '') {

    if (!apiKey || apiKey === 'YOUR_OMDB_API_KEY') {

        throw new Error(
            'Add your OMDb API key in renderer/index.js first.'
        );

    }

    const url = `https://www.omdbapi.com/?apikey=${encodeURIComponent(apiKey)}&t=${encodeURIComponent(title)}&type=movie${year ? `&y=${encodeURIComponent(year)}` : ''}&plot=full`;

    let response;

    try {

        response = await fetch(url);

    } catch (error) {

        throw new Error(
            'Cannot reach OMDb. Check your Internet connection or Electron network settings.'
        );

    }

    if (!response.ok) {

        throw new Error(`OMDb HTTP error ${response.status}.`);

    }

    const data = await response.json();

    if (data.Response === 'False') {

        throw new Error(
            data.Error || 'Movie not found.'
        );

    }

    return data;

}

// =====================================================
// 6. DISPLAY MOVIE POSTER
// =====================================================

function addPoster(parent, movie) {

    if (movie.Poster && movie.Poster.startsWith('https://')) {

        const img = document.createElement('img');

        img.src = movie.Poster;
        img.alt = 'Poster for ' + movie.Title;
        img.loading = 'lazy';

        parent.appendChild(img);

    } else {

        parent.textContent = 'No poster available';

    }

}


// =====================================================
// 7. DISPLAY MOVIE SEARCH RESULT IN TABLE
// =====================================================

function showMovieInTable(movie) {

    resultDiv.replaceChildren();

    const row = document.createElement('tr');

    const posterCell = document.createElement('td');
    const titleCell = document.createElement('td');
    const yearCell = document.createElement('td');
    const actionCell = document.createElement('td');

    addPoster(posterCell, movie);

    titleCell.textContent = movie.Title;
    yearCell.textContent = movie.Year;

    const viewBtn = document.createElement('button');

    viewBtn.textContent = 'View Details';

    viewBtn.addEventListener('click', function() {

        showDetails(movie);

    });

    actionCell.appendChild(viewBtn);

    row.append(
        posterCell,
        titleCell,
        yearCell,
        actionCell
    );

    resultDiv.appendChild(row);

}


// =====================================================
// 8. SEARCH MOVIE EVENT
// =====================================================

searchForm.addEventListener('submit', async function(event) {

    event.preventDefault();

    const title = document.getElementById('movieTitle').value.trim();
    const year = document.getElementById('movieYear').value.trim();

    // Input validation

    if (!title) {

        message.textContent = 'Please enter a movie title.';
        return;

    }

    if (
        year &&
        (
            !/^\d{4}$/.test(year) ||
            Number(year) < 1888 ||
            Number(year) > 2100
        )
    ) {

        message.textContent = 'Please enter a valid release year.';
        return;

    }

    message.textContent = 'Searching for your movie...';

    resultDiv.replaceChildren();

    detailsDiv.hidden = true;

    searchBtn.disabled = true;

    try {

        const movie = await requestMovie(title, year);

        showMovieInTable(movie);

        message.textContent =
            `Found: ${movie.Title} (${movie.Year}).`;

    } catch (error) {

        message.textContent = error.message;

        const row = document.createElement('tr');
        const cell = document.createElement('td');

        cell.colSpan = 4;
        cell.className = 'empty';
        cell.textContent = 'No movie to display.';

        row.appendChild(cell);

        resultDiv.appendChild(row);

    } finally {

        searchBtn.disabled = false;

    }

});


// =====================================================
// 9. SHOW MOVIE DETAILS
// =====================================================

function showDetails(movie) {

    detailsDiv.replaceChildren();

    const layout = document.createElement('div');

    layout.className = 'details-layout';

    // Movie poster

    if (movie.Poster && movie.Poster.startsWith('https://')) {

        const poster = document.createElement('img');

        poster.src = movie.Poster;
        poster.alt = `Poster for ${movie.Title}`;
        poster.className = 'details-poster';

        layout.appendChild(poster);

    }

    // Movie information

    const info = document.createElement('div');

    info.className = 'details-info';

    const heading = document.createElement('h2');

    heading.textContent = `${movie.Title} (${movie.Year})`;

    info.appendChild(heading);

    const fields = [

        ['Genre', movie.Genre],
        ['Director', movie.Director],
        ['Actors', movie.Actors],

        [
            'IMDb rating',
            movie.imdbRating === 'N/A'
                ? 'N/A'
                : movie.imdbRating + ' / 10'
        ],

        [
            'Runtime calculation',
            runtimeLabel(movie.Runtime)
        ],

        ['Language', movie.Language],
        ['Country', movie.Country],
        ['Plot', movie.Plot],

        [
            'Suggestion',
            suggestMovie(movie.Genre)
        ]

    ];

    fields.forEach(function(field) {

        const paragraph = document.createElement('p');
        const label = document.createElement('strong');

        label.textContent = field[0] + ': ';

        paragraph.append(
            label,
            document.createTextNode(field[1] || 'N/A')
        );

        info.appendChild(paragraph);

    });

    // Save movie button

    const saveBtn = document.createElement('button');

    saveBtn.textContent = 'Save to Wishlist';

    saveBtn.addEventListener('click', function() {

        saveMovie(movie);

    });

    info.appendChild(saveBtn);

    layout.appendChild(info);

    detailsDiv.appendChild(layout);

    detailsDiv.hidden = false;

    detailsDiv.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
    });

}


// =====================================================
// 10. SAVE MOVIE TO LOCAL STORAGE (CREATE)
// =====================================================

function saveMovie(movie) {

    const movies = getMovies();

    // Prevent duplicate movie records

    if (movies.some(item => item.imdbID === movie.imdbID)) {

        message.textContent =
            'This movie is already in your wishlist.';

        return;

    }

    // Create new movie object

    const newMovie = new MovieRecord(
        movie,
        suggestMovie(movie.Genre)
    );

    movies.push(newMovie);

    try {

        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(movies)
        );

        message.textContent =
            `${movie.Title} saved! Open My Wishlist to view it.`;

        // Refresh dashboard after saving

        updateDashboard();

    } catch (error) {

        message.textContent =
            'Unable to save movie to Local Storage.';

    }

}


// =====================================================
// 11. MOVIE GENRES - RECOMMENDATION LIST
// =====================================================

// Select candidate movies using if...else.

function titlesForGenre(genre) {

    if (genre === 'Action') {

        return ['John Wick', 'Mad Max: Fury Road'];

    } else if (genre === 'Comedy') {

        return ['The Grand Budapest Hotel', 'Superbad'];

    } else if (genre === 'Drama') {

        return ['Forrest Gump', 'The Shawshank Redemption'];

    } else if (genre === 'Horror') {

        return ['The Conjuring', 'Get Out'];

    } else if (genre === 'Romance') {

        return ['The Notebook', 'Pride & Prejudice'];

    } else if (genre === 'Sci-Fi') {

        return ['Interstellar', 'The Matrix'];

    } else {

        return [];

    }

}


// =====================================================
// 12. VERIFY MOVIE GENRE
// =====================================================

function genreMatches(movieGenre, chosenGenre) {

    const genre = String(movieGenre || '').toLowerCase();

    if (chosenGenre === 'Sci-Fi') {

        return genre.includes('sci-fi');

    } else {

        return genre.includes(chosenGenre.toLowerCase());

    }

}


// =====================================================
// 13. HIGHLIGHT SELECTED GENRE IN SIDEBAR
// =====================================================

function highlightGenre(genre) {

    document.querySelectorAll('.genre-link').forEach(function(button) {

        button.classList.toggle(
            'selected',
            button.dataset.genre === genre
        );

    });

}


// =====================================================
// 14. DISPLAY MOVIE RECOMMENDATION CARDS
// =====================================================

function displayRecommendations(movies) {

    recommendationsDiv.replaceChildren();

    movies.forEach(function(movie) {

        const card = document.createElement('article');

        card.className = 'movie-card';

        // Poster

        addPoster(card, movie);

        // Movie title

        const title = document.createElement('h3');

        title.textContent = `${movie.Title} (${movie.Year})`;

        // Movie information

        const info = document.createElement('p');

        info.textContent =
            `Genre: ${movie.Genre} | IMDb: ${movie.imdbRating} / 10`;

        // View Details button

        const viewBtn = document.createElement('button');

        viewBtn.textContent = 'View Details';

        viewBtn.addEventListener('click', function() {

            showDetails(movie);

        });

        // Save to Wishlist button

        const saveBtn = document.createElement('button');

        saveBtn.textContent = 'Save to Wishlist';

        saveBtn.addEventListener('click', function() {

            saveMovie(movie);

        });

        card.append(
            title,
            info,
            viewBtn,
            saveBtn
        );

        recommendationsDiv.appendChild(card);

    });

}


// =====================================================
// 15. GENERATE MOVIE GENRE RECOMMENDATIONS
// =====================================================

async function generateRecommendations() {

    const genre = genreSelect.value;

    const titles = titlesForGenre(genre);

    recommendationsDiv.replaceChildren();

    highlightGenre(genre);

    // Check if a genre is selected

    if (titles.length === 0) {

        recommendMessage.textContent =
            'Please choose a genre first.';

        return;

    }

    recommendMessage.textContent =
        'Looking up movie suggestions...';

    recommendBtn.disabled = true;

    const suggested = [];

    let failedRequests = 0;

    try {

        // Fetch candidate movie information

        for (let i = 0; i < titles.length; i++) {

            try {

                const movie = await requestMovie(titles[i]);

                if (genreMatches(movie.Genre, genre)) {

                    suggested.push(movie);

                }

            } catch (error) {

                failedRequests++;

                console.error(error.message);

            }

        }

        // Save recommendation results in Local Storage

        localStorage.setItem(
            RECOMMENDATIONS_KEY,
            JSON.stringify(suggested)
        );

        displayRecommendations(suggested);

        // Display response message

        if (suggested.length > 0) {

            recommendMessage.textContent =
                `${suggested.length} movie suggestion(s) found for ${genre}.`;

        } else if (failedRequests === titles.length) {

            recommendMessage.textContent =
                'Cannot load suggestions. Check your OMDb API key or connection.';

        } else {

            recommendMessage.textContent =
                'No matching movies found for this genre.';

        }

    } catch (error) {

        recommendMessage.textContent =
            'Unable to save suggestions to Local Storage.';

    } finally {

        recommendBtn.disabled = false;

    }

}


// =====================================================
// 16. MOVIE GENRES BUTTON EVENTS
// =====================================================

// Suggest Movies button

recommendBtn.addEventListener(
    'click',
    generateRecommendations
);

// Genre dropdown

genreSelect.addEventListener('change', function() {

    highlightGenre(genreSelect.value);

});

// Sidebar genre buttons

document.querySelectorAll('.genre-link').forEach(function(button) {

    button.addEventListener('click', function() {

        genreSelect.value = button.dataset.genre;

        generateRecommendations();

    });

});


// =====================================================
// 17. MOVIE DASHBOARD STATISTICS
// =====================================================

// Calculate statistics from movies saved in Local Storage.

function updateDashboard() {

    const movies = getMovies();

    // Total watched movies

    const watched = movies.filter(function(movie) {

        return movie.status === 'Watched';

    }).length;

    // Total planned movies

    const planned = movies.filter(function(movie) {

        return movie.status === 'Plan to Watch' || !movie.status;

    }).length;

    // Calculate average IMDb rating

    const ratings = movies
        .map(function(movie) {

            return Number(movie.imdbRating);

        })
        .filter(function(rating) {

            return Number.isFinite(rating) &&
                   rating > 0 &&
                   rating <= 10;

        });

    let average = 'N/A';

    if (ratings.length > 0) {

        const totalRating = ratings.reduce(function(total, rating) {

            return total + rating;

        }, 0);

        average = (totalRating / ratings.length).toFixed(1);

    }

    // Calculate total runtime

    const totalMinutes = movies.reduce(function(total, movie) {

        const minutes = parseInt(movie.Runtime, 10);

        if (Number.isFinite(minutes) && minutes > 0) {

            return total + minutes;

        } else {

            return total;

        }

    }, 0);

    // Calculate percentage of watched movies

    let completed = 0;

    if (movies.length > 0) {

        completed = Math.round(
            (watched / movies.length) * 100
        );

    }

    // Update dashboard information

    document.getElementById('totalSaved').textContent =
        movies.length;

    document.getElementById('watchedCount').textContent =
        watched;

    document.getElementById('plannedCount').textContent =
        planned;

    document.getElementById('avgRating').textContent =
        average;

    document.getElementById('totalRuntime').textContent =
        `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`;

    document.getElementById('completionText').textContent =
        completed + '%';

    document.getElementById('completionBar').style.width =
        completed + '%';

}


// =====================================================
// 18. ELECTRON DESKTOP KEYBOARD SHORTCUTS
// =====================================================

// Ctrl + 1 = Movie Research
// Ctrl + 2 = My Wishlist
// Ctrl + K = Focus movie search

document.addEventListener('keydown', function(event) {

    if (!event.ctrlKey && !event.metaKey) {

        return;

    }

    const key = event.key.toLowerCase();

    if (key === '1') {

        event.preventDefault();

        window.location.href = 'index.html';

    } else if (key === '2') {

        event.preventDefault();

        window.location.href = 'wishlist.html';

    } else if (key === 'k') {

        event.preventDefault();

        document.getElementById('movieTitle').focus();

        document.getElementById('research').scrollIntoView({
            behavior: 'smooth'
        });

    }

});


// =====================================================
// 19. GENRE LINK FROM WISHLIST PAGE
// =====================================================

// Automatically choose genre if passed in the page URL.

const chosenGenre = new URLSearchParams(
    window.location.search
).get('genre');

if (titlesForGenre(chosenGenre).length > 0) {

    genreSelect.value = chosenGenre;

    highlightGenre(chosenGenre);

    generateRecommendations();

}


// =====================================================
// 20. INITIALIZE DASHBOARD
// =====================================================

// Load movie statistics when application opens.

updateDashboard();

// Refresh if browser storage changes from another window.

window.addEventListener('storage', updateDashboard);
}
