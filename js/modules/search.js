import { search, getMorphemes, getWords } from './api.js';

function displayResults(morphemes, words) {
    const resultsDiv = document.getElementById('search-results');
    let html = '';

    html += '<h3>Matching Morphemes</h3>';
    if (morphemes.length === 0) {
        html += '<p>No matching morphemes found.</p>';
    } else {
        html += '<ul>';
        morphemes.forEach(m => {
            html += `<li><strong>${m.morpheme}</strong> - ${m.gloss} (${m.type})</li>`;
        });
        html += '</ul>';
    }

    html += '<h3>Matching Words</h3>';
    if (words.length === 0) {
        html += '<p>No matching words found.</p>';
    } else {
        html += '<ul>';
        words.forEach(w => {
            html += `<li><strong>${w.word}</strong> - ${w.gloss} (${w.pos})</li>`;
        });
        html += '</ul>';
    }

    resultsDiv.innerHTML = html;
}

export function initializeSearch() {
    const form = document.getElementById('search-form');

    // Initial data load
    loadData();

    // Form submission handler
    form?.addEventListener('submit', async function(e) {
        e.preventDefault();
        const searchTerm = document.getElementById('search-term').value;

        try {
            const data = await search(searchTerm);
            displayResults(data.morphemes, data.words);
        } catch (error) {
            console.error('Error searching:', error);
            alert('Error searching. See console for details.');
        }
    });

    // Listen for updates from other components
    document.addEventListener('morphemeAdded', loadData);
    document.addEventListener('wordAdded', loadData);
}

async function loadData() {
    try {
        const [morphemes, words] = await Promise.all([
            getMorphemes(),
            getWords()
        ]);
        displayResults(morphemes, words);
    } catch (error) {
        console.error('Error loading data:', error);
        document.getElementById('search-results').innerHTML =
            '<p class="error">Error connecting to server. Make sure your local server is running.</p>';
    }
}