// Handle tab switching
window.switchTab = function(tabName) {
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => tab.classList.remove('active'));
    tabContents.forEach(content => content.classList.remove('active'));

    document.querySelector(`.tab:nth-child(${
        tabName === 'morpheme' ? 1 :
        tabName === 'word' ? 2 :
        tabName === 'search' ? 3 : 4
    })`).classList.add('active');
    document.getElementById(`${tabName}-tab`).classList.add('active');
}

// API URL - configured for local server
const API_BASE_URL = 'http://localhost:5000/api';

// Document ready function
document.addEventListener('DOMContentLoaded', function() {
    // Show/hide affix options based on morpheme type
    document.getElementById('type').addEventListener('change', function() {
        const affixOptions = document.getElementById('affix-options');
        if (this.value === 'root') {
            affixOptions.style.display = 'none';
        } else {
            affixOptions.style.display = 'block';
        }
    });

    // Add allomorph functionality
    document.getElementById('add-allomorph').addEventListener('click', function() {
        const container = document.getElementById('allomorphs-container');
        const allomorphIndex = container.children.length;

        const allomorphDiv = document.createElement('div');
        allomorphDiv.className = 'allomorph';
        allomorphDiv.innerHTML = `
            <h5>Allomorph ${allomorphIndex + 1}</h5>
            <div class="form-group">
                <label for="allomorph-form-${allomorphIndex}">Form:</label>
                <input type="text" id="allomorph-form-${allomorphIndex}" name="allomorph-form-${allomorphIndex}" required>
            </div>
            <div class="form-group">
                <label for="allomorph-ipa-${allomorphIndex}">IPA:</label>
                <input type="text" id="allomorph-ipa-${allomorphIndex}" name="allomorph-ipa-${allomorphIndex}">
            </div>
            <div class="form-group">
                <label for="allomorph-condition-${allomorphIndex}">Condition:</label>
                <input type="text" id="allomorph-condition-${allomorphIndex}" name="allomorph-condition-${allomorphIndex}" placeholder="e.g., 'follows voiced C', 'elsewhere'">
            </div>
            <button type="button" onclick="this.parentElement.remove()">Remove</button>
        `;

        container.appendChild(allomorphDiv);
    });

    // Load data from server
    loadDataFromServer();

    // Form submission handling
    document.getElementById('morpheme-form').addEventListener('submit', function(e) {
        e.preventDefault();

        // Get form data
        const formData = {
            morpheme: document.getElementById('morpheme').value,
            type: document.getElementById('type').value,
            pos: document.getElementById('pos').value,
            gloss: document.getElementById('gloss').value,
            ipa: document.getElementById('ipa').value,
            notes: document.getElementById('notes').value
        };

        // If it's an affix, get the affix-specific data
        if (formData.type !== 'root') {
            formData.affixProperties = {
                attachesTo: [],
                slot: document.getElementById('slot').value,
                requires: document.getElementById('requires').value,
                prohibits: document.getElementById('prohibits').value
            };

            // Get checked parts of speech
            ['noun', 'verb', 'adj'].forEach(pos => {
                if (document.getElementById(`attach-${pos}`).checked) {
                    formData.affixProperties.attachesTo.push(pos);
                }
            });

            // Get allomorphs
            formData.allomorphs = [];
            const allomorphDivs = document.querySelectorAll('#allomorphs-container .allomorph');
            allomorphDivs.forEach((div, index) => {
                formData.allomorphs.push({
                    form: document.getElementById(`allomorph-form-${index}`).value,
                    ipa: document.getElementById(`allomorph-ipa-${index}`).value,
                    condition: document.getElementById(`allomorph-condition-${index}`).value
                });
            });
        }

        // Send to server
        fetch(`${API_BASE_URL}/morphemes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        })
        .then(response => response.json())
        .then(data => {
            alert('Morpheme saved successfully!');
            this.reset();
            document.getElementById('affix-options').style.display = 'none';
            loadDataFromServer(); // Refresh data
        })
        .catch(error => {
            console.error('Error saving morpheme:', error);
            alert('Error saving morpheme. See console for details.');
        });
    });

    document.getElementById('word-form').addEventListener('submit', function(e) {
        e.preventDefault();

        // Get form data
        const formData = {
            word: document.getElementById('word').value,
            gloss: document.getElementById('word-gloss').value,
            pos: document.getElementById('word-pos').value,
            ipa: document.getElementById('word-ipa').value,
            notes: document.getElementById('word-notes').value
        };

        // Send to server
        fetch(`${API_BASE_URL}/words`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        })
        .then(response => response.json())
        .then(data => {
            alert('Word saved successfully!');
            this.reset();
            loadDataFromServer(); // Refresh data
        })
        .catch(error => {
            console.error('Error saving word:', error);
            alert('Error saving word. See console for details.');
        });
    });

    // Phonology form submission handling
    document.getElementById('phonology-form').addEventListener('submit', function(e) {
        e.preventDefault();

        // Get selected features
        const selectedFeatures = [];
        document.querySelectorAll('#feature-grid input[type="checkbox"]:checked').forEach(checkbox => {
            selectedFeatures.push(checkbox.value);
        });

        // Get form data
        const formData = {
            category: document.getElementById('sound-category').value,
            sounds: document.getElementById('sounds').value.split(',').map(s => s.trim()),
            features: selectedFeatures,
            notes: document.getElementById('phonology-notes').value
        };

        // Send to server
        fetch(`${API_BASE_URL}/phonology`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        })
        .then(response => response.json())
        .then(data => {
            alert(data.message);
            this.reset();
            loadPhonologyData(); // Refresh display
        })
        .catch(error => {
            console.error('Error saving phonology:', error);
            alert('Error saving phonology. See console for details.');
        });
    });

    // Function to load phonology data
    function loadPhonologyData() {
        fetch(`${API_BASE_URL}/phonology`)
        .then(response => response.json())
        .then(categories => {
            const display = document.getElementById('phonology-display');
            if (categories.length === 0) {
                display.innerHTML = '<p>No phonology data stored yet.</p>';
                return;
            }

            let html = '';
            categories.forEach(category => {
                const sounds = JSON.parse(category.sounds);
                const features = JSON.parse(category.features);

                html += `
                    <div class="phonology-category">
                        <h4>${category.category.charAt(0).toUpperCase() + category.category.slice(1)}</h4>
                        <div class="sound-list">${sounds.join(', ')}</div>
                        ${features.length > 0 ? `
                            <div class="feature-tags">
                                ${features.map(f => `<span class="feature-tag">${f}</span>`).join('')}
                            </div>
                        ` : ''}
                        ${category.notes ? `<div class="notes">${category.notes}</div>` : ''}
                        <button onclick="deletePhonologyCategory('${category.category}')">Delete</button>
                    </div>
                `;
            });

            display.innerHTML = html;
        })
        .catch(error => {
            console.error('Error loading phonology data:', error);
            document.getElementById('phonology-display').innerHTML =
                '<p class="error">Error loading phonology data. See console for details.</p>';
        });
    }

    // Function to delete a phonology category
    window.deletePhonologyCategory = function(category) {
        if (confirm(`Are you sure you want to delete the ${category} category?`)) {
            fetch(`${API_BASE_URL}/phonology/${category}`, {
                method: 'DELETE'
            })
            .then(response => response.json())
            .then(data => {
                alert(data.message);
                loadPhonologyData(); // Refresh display
            })
            .catch(error => {
                console.error('Error deleting category:', error);
                alert('Error deleting category. See console for details.');
            });
        }
    }

    // Function to load data from server
    function loadDataFromServer() {
        // Get morphemes
        fetch(`${API_BASE_URL}/morphemes`)
        .then(response => response.json())
        .then(morphemes => {
            // Get words
            fetch(`${API_BASE_URL}/words`)
            .then(response => response.json())
            .then(words => {
                displayData(morphemes, words);
            });
        })
        .catch(error => {
            console.error('Error loading data:', error);
            // Display error message in search results
            document.getElementById('search-results').innerHTML =
                '<p class="error">Error connecting to server. Make sure your local server is running with "python3 api/server.py"</p>';
        });
    }

    // Display data in search results
    function displayData(morphemes, words) {
        let html = '<h3>Stored Morphemes</h3>';
        if (morphemes.length === 0) {
            html += '<p>No morphemes stored yet.</p>';
        } else {
            html += '<ul>';
            morphemes.forEach(m => {
                html += `<li><strong>${m.morpheme}</strong> - ${m.gloss} (${m.type})</li>`;
            });
            html += '</ul>';
        }

        html += '<h3>Stored Words</h3>';
        if (words.length === 0) {
            html += '<p>No words stored yet.</p>';
        } else {
            html += '<ul>';
            words.forEach(w => {
                html += `<li><strong>${w.word}</strong> - ${w.gloss} (${w.pos})</li>`;
            });
            html += '</ul>';
        }

        document.getElementById('search-results').innerHTML = html;
    }

    // Search functionality
    document.getElementById('search-form').addEventListener('submit', function(e) {
        e.preventDefault();

        const searchTerm = document.getElementById('search-term').value;

        // Search on server
        fetch(`${API_BASE_URL}/search?query=${encodeURIComponent(searchTerm)}`)
        .then(response => response.json())
        .then(data => {
            const morphemes = data.morphemes;
            const words = data.words;

            // Display results
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

            document.getElementById('search-results').innerHTML = html;
        })
        .catch(error => {
            console.error('Error searching:', error);
            alert('Error searching. See console for details.');
        });
    });

    // Phonology Builder functionality
    const consonantChart = document.getElementById('consonant-chart');
    const vowelChart = document.getElementById('vowel-chart');
    const saveButton = document.getElementById('save-phonology');

    // Handle clicking on chart cells
    function initializeCharts() {
        [consonantChart, vowelChart].forEach(chart => {
            if (!chart) return;

            const cells = chart.querySelectorAll('td[data-sounds]');
            cells.forEach(cell => {
                const sounds = cell.getAttribute('data-sounds').split(' ');

                // Create clickable buttons for each sound
                cell.innerHTML = sounds.map(sound =>
                    `<button class="sound-btn" data-sound="${sound}">${sound}</button>`
                ).join(' ');

                // Add click handlers
                cell.querySelectorAll('.sound-btn').forEach(btn => {
                    btn.addEventListener('click', function() {
                        this.classList.toggle('selected');
                        updateSelectedSounds();
                    });
                });
            });
        });
    }

    // Update the internal state of selected sounds
    function updateSelectedSounds() {
        const selectedConsonants = [];
        const selectedVowels = [];

        consonantChart?.querySelectorAll('.sound-btn.selected').forEach(btn => {
            selectedConsonants.push({
                sound: btn.dataset.sound,
                manner: btn.closest('tr').dataset.manner,
                place: btn.closest('td').cellIndex
            });
        });

        vowelChart?.querySelectorAll('.sound-btn.selected').forEach(btn => {
            selectedVowels.push({
                sound: btn.dataset.sound,
                height: btn.closest('tr').dataset.height,
                backness: Math.floor(btn.closest('td').cellIndex / 2)
            });
        });

        return { consonants: selectedConsonants, vowels: selectedVowels };
    }

    // Handle diacritic buttons
    const diacriticButtons = document.querySelectorAll('.diacritic-btn');
    diacriticButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const diacritic = this.dataset.diacritic;
            const selectedButtons = document.querySelectorAll('.sound-btn.selected');

            selectedButtons.forEach(soundBtn => {
                const currentSound = soundBtn.textContent;
                if (!currentSound.includes(diacritic)) {
                    soundBtn.textContent = currentSound + diacritic;
                }
            });
        });
    });

    // Save phonology system
    saveButton?.addEventListener('click', function(e) {
        e.preventDefault();

        // Get selected sounds and features
        const { consonants, vowels } = updateSelectedSounds();

        // Get additional features
        const features = {
            consonants: {
                gemination: document.querySelector('input[name="gemination"]').checked,
                aspirated: document.querySelector('input[name="aspirated"]').checked,
                palatalized: document.querySelector('input[name="palatalized"]').checked,
                labialized: document.querySelector('input[name="labialized"]').checked,
                pharyngealized: document.querySelector('input[name="pharyngealized"]').checked
            },
            vowels: {
                length: document.querySelector('input[name="length"]').checked,
                nasalization: document.querySelector('input[name="nasalization"]').checked,
                stress: document.querySelector('input[name="stress"]').checked,
                tone: document.querySelector('input[name="tone"]').checked
            }
        };

        // Get phonotactics
        const phonotactics = {
            syllableStructure: document.getElementById('syllable-structure').value,
            clusterConstraints: document.getElementById('cluster-constraints').value,
            phonologicalProcesses: document.getElementById('phonological-processes').value
        };

        // Prepare data for server
        const phonologyData = {
            consonants: consonants.map(c => ({
                sound: c.sound,
                manner: c.manner,
                place: getPlaceOfArticulation(c.place)
            })),
            vowels: vowels.map(v => ({
                sound: v.sound,
                height: v.height,
                backness: getVowelBackness(v.backness)
            })),
            features: features,
            phonotactics: phonotactics
        };

        // Send to server
        fetch(`${API_BASE_URL}/phonology`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(phonologyData)
        })
        .then(response => response.json())
        .then(data => {
            alert('Phonology system saved successfully!');
            loadPhonologyData(); // Refresh the display
        })
        .catch(error => {
            console.error('Error saving phonology:', error);
            alert('Error saving phonology system. See console for details.');
        });
    });

    // Helper function to get place of articulation name
    function getPlaceOfArticulation(index) {
        const places = [
            'bilabial', 'labiodental', 'dental', 'alveolar',
            'postalveolar', 'retroflex', 'palatal', 'velar',
            'uvular', 'glottal'
        ];
        return places[index - 1] || 'unknown';
    }

    // Helper function to get vowel backness
    function getVowelBackness(index) {
        return ['front', 'central', 'back'][index] || 'unknown';
    }

    // Initialize the charts when page loads
    initializeCharts();
    loadPhonologyData();
});