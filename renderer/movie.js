// MyMovie - Wishlist (CRUD operations using Local Storage)

const STORAGE_KEY = 'mymovie_watchlist';
const RECOMMENDATIONS_KEY = 'mymovie_recommendations';
const savedMovies = document.getElementById('savedMovies');
const savedRecommendations = document.getElementById('savedRecommendations');
const stats = document.getElementById('stats');
const message = document.getElementById('message');

function getMovies() {
    try {
        const movies = JSON.parse(localStorage.getItem(STORAGE_KEY));
        return Array.isArray(movies) ? movies : [];
    } catch (error) {
        return [];
    }
}

// Store records in Local Storage AND keep the JSON file in sync.
async function saveMovies(movies) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(movies));
    } catch (error) {
        message.textContent = 'Unable to save changes to Local Storage.';
        return { saved: false, json: false };
    }

    try {
        await window.movieFiles.saveWatchlist(movies);
        return { saved: true, json: true };
    } catch (error) {
        console.error('JSON backup failed:', error);
        return { saved: true, json: false };
    }
}

// READ: Display movies saved through the Movie Research page.
function showMovies() {
    const movies = getMovies();
    savedMovies.replaceChildren();

    // Meaningful calculation: average numeric IMDb rating.
    const ratings = movies.map(movie => Number(movie.imdbRating))
        .filter(rating => Number.isFinite(rating) && rating > 0 && rating <= 10);
    const average = ratings.length
        ? (ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length).toFixed(2)
        : 'N/A';
    const watched = movies.filter(movie => movie.status === 'Watched').length;

    stats.textContent = `Total movies: ${movies.length} | Watched: ${watched} | Average IMDb rating: ${average}${average === 'N/A' ? '' : ' / 10'}`;

    if (movies.length === 0) {
        savedMovies.textContent = 'Your wishlist is empty. Save a movie from Movie Research.';
        return;
    }

    movies.forEach(function(movie) {
        const card = document.createElement('article');
        card.className = 'movie-card';

        if (movie.Poster && movie.Poster.startsWith('https://')) {
            const poster = document.createElement('img');
            poster.src = movie.Poster;
            poster.alt = 'Poster for ' + movie.Title;
            poster.loading = 'lazy';
            card.appendChild(poster);
        }

        const title = document.createElement('h3');
        title.textContent = `${movie.Title} (${movie.Year})`;
        const genre = document.createElement('p');
        genre.textContent = `Genre: ${movie.Genre}`;
        const rating = document.createElement('p');
        rating.textContent = `IMDb rating: ${movie.imdbRating === 'N/A' ? 'N/A' : movie.imdbRating + ' / 10'}`;
        const suggestion = document.createElement('p');
        suggestion.textContent = `Suggestion: ${movie.recommendation || 'N/A'}`;

        const statusLabel = document.createElement('label');
        statusLabel.textContent = 'Watch status';
        const select = document.createElement('select');
        ['Plan to Watch', 'Watching', 'Watched'].forEach(function(status) {
            const option = document.createElement('option');
            option.value = status;
            option.textContent = status;
            select.appendChild(option);
        });
        select.value = movie.status || 'Plan to Watch';
        statusLabel.appendChild(select);

        const notesLabel = document.createElement('label');
        notesLabel.textContent = 'My notes';
        const notes = document.createElement('textarea');
        notes.value = movie.notes || '';
        notes.maxLength = 500;
        notes.placeholder = 'Write a short note about this movie...';
        notesLabel.appendChild(notes);

        // UPDATE: Edit status or notes.

        const updateBtn = document.createElement('button');
        updateBtn.textContent = 'Update';
        updateBtn.addEventListener('click', async function() {
            const latest = getMovies();
            const record = latest.find(item => item.imdbID === movie.imdbID);
            if (!record) {
                message.textContent = 'Movie not found. Please reload the page.';
                showMovies();
                return;
            }
            if (notes.value.trim().length > 500) {
                message.textContent = 'Notes cannot exceed 500 characters.';
                return;
            }
            record.status = select.value;
            record.notes = notes.value.trim();
            const result = await saveMovies(latest);
            if (result.saved) {
                message.textContent = `${record.Title} updated successfully.` +
                    (result.json ? ' JSON file updated.' : ' JSON backup unavailable.');
                showMovies();
            }
        });

        // DELETE: Remove a saved movie.
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-button';
        deleteBtn.textContent = 'Delete';
        deleteBtn.addEventListener('click', async function() {
            if (!confirm(`Remove ${movie.Title} from your wishlist?`)) return;
            const latest = getMovies().filter(item => item.imdbID !== movie.imdbID);
            const result = await saveMovies(latest);
            if (result.saved) {
                message.textContent = `${movie.Title} removed from your wishlist.` +
                    (result.json ? ' JSON file updated.' : ' JSON backup unavailable.');
                showMovies();
            }
        });

        card.append(title, genre, rating, suggestion, statusLabel, notesLabel, updateBtn, deleteBtn);
        savedMovies.appendChild(card);
    });
}

function showRecommendations() {
    savedRecommendations.replaceChildren();
    let recommendations = [];
    try {
        const stored = JSON.parse(localStorage.getItem(RECOMMENDATIONS_KEY));
        if (Array.isArray(stored)) recommendations = stored;
    } catch (error) {
        recommendations = [];
    }

    if (recommendations.length === 0) {
        savedRecommendations.textContent = 'No saved suggestions yet. Choose a genre on Movie Research.';
        return;
    }

    recommendations.forEach(function(movie) {
        const card = document.createElement('article');
        card.className = 'movie-card';
        const heading = document.createElement('h3');
        heading.textContent = `${movie.Title} (${movie.Year})`;
        const genre = document.createElement('p');
        genre.textContent = `Genre: ${movie.Genre}`;
        const addBtn = document.createElement('button');
        addBtn.textContent = 'Add to Wishlist';
        addBtn.addEventListener('click', async function() {
            const movies = getMovies();
            if (movies.some(item => item.imdbID === movie.imdbID)) {
                message.textContent = 'This recommended movie is already in your wishlist.';
                return;
            }
            movies.push({
                imdbID: movie.imdbID,
                Title: movie.Title,
                Year: movie.Year,
                Genre: movie.Genre,
                Poster: movie.Poster,
                imdbRating: movie.imdbRating,
                Runtime: movie.Runtime,
                recommendation: `Suggested for your interest in ${movie.Genre}.`,
                status: 'Plan to Watch',
                notes: ''
            });
            const result = await saveMovies(movies);
            if (result.saved) {
                message.textContent = `${movie.Title} added to your wishlist.` +
                    (result.json ? ' JSON file updated.' : ' JSON backup unavailable.');
                showMovies();
            }
        });
        card.append(heading, genre, addBtn);
        savedRecommendations.appendChild(card);
    });
}

showMovies();
showRecommendations();

// If movies were saved before this feature was added, create the JSON backup
// when the user opens the Wishlist. Do not overwrite with an empty list.
if (getMovies().length > 0 && window.movieFiles) {
    window.movieFiles.saveWatchlist(getMovies()).catch(function(error) {
        console.warn('Could not sync existing movies to JSON:', error);
    });
}
