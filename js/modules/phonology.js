import { getPhonology, savePhonology, deletePhonologyCategory } from './api.js';

function updateSelectedSounds() {
    const consonantChart = document.getElementById('consonant-chart');
    const vowelChart = document.getElementById('vowel-chart');
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

function getPlaceOfArticulation(index) {
    const places = [
        'bilabial', 'labiodental', 'dental', 'alveolar',
        'postalveolar', 'retroflex', 'palatal', 'velar',
        'uvular', 'glottal'
    ];
    return places[index - 1] || 'unknown';
}

function getVowelBackness(index) {
    return ['front', 'central', 'back'][index] || 'unknown';
}

function displayPhonologyData(data) {
    const display = document.getElementById('phonology-display');

    if (!data.inventory || data.inventory.length === 0) {
        display.innerHTML = '<p>No phonology data stored yet.</p>';
        return;
    }

    const consonants = data.inventory.filter(item => item.type === 'consonant');
    const vowels = data.inventory.filter(item => item.type === 'vowel');
    let html = '';

    if (consonants.length > 0) {
        html += `
            <div class="phonology-category">
                <h4>Consonants</h4>
                <div class="sound-list">${consonants.map(c => c.sound).join(', ')}</div>
                <table class="features-table">
                    ${consonants.map(c => `
                        <tr>
                            <td>${c.sound}</td>
                            <td>${c.manner || ''}</td>
                            <td>${c.place || ''}</td>
                            <td>${c.features ? Object.entries(JSON.parse(c.features))
                                .filter(([_, value]) => value)
                                .map(([key, _]) => `<span class="feature-tag">${key}</span>`)
                                .join('') : ''}</td>
                        </tr>
                    `).join('')}
                </table>
            </div>
        `;
    }

    if (vowels.length > 0) {
        html += `
            <div class="phonology-category">
                <h4>Vowels</h4>
                <div class="sound-list">${vowels.map(v => v.sound).join(', ')}</div>
                <table class="features-table">
                    ${vowels.map(v => `
                        <tr>
                            <td>${v.sound}</td>
                            <td>${v.height || ''}</td>
                            <td>${v.backness || ''}</td>
                            <td>${v.features ? Object.entries(JSON.parse(v.features))
                                .filter(([_, value]) => value)
                                .map(([key, _]) => `<span class="feature-tag">${key}</span>`)
                                .join('') : ''}</td>
                        </tr>
                    `).join('')}
                </table>
            </div>
        `;
    }

    if (data.phonotactics) {
        html += `
            <div class="phonology-category">
                <h4>Phonotactics</h4>
                ${data.phonotactics.syllable_structure ? `
                    <div class="feature-group">
                        <strong>Syllable Structure:</strong> ${data.phonotactics.syllable_structure}
                    </div>
                ` : ''}
                ${data.phonotactics.cluster_constraints ? `
                    <div class="feature-group">
                        <strong>Cluster Constraints:</strong>
                        <pre>${data.phonotactics.cluster_constraints}</pre>
                    </div>
                ` : ''}
                ${data.phonotactics.processes ? `
                    <div class="feature-group">
                        <strong>Phonological Processes:</strong>
                        <pre>${data.phonotactics.processes}</pre>
                    </div>
                ` : ''}
            </div>
        `;
    }

    display.innerHTML = html;
}

function initializeCharts() {
    const consonantChart = document.getElementById('consonant-chart');
    const vowelChart = document.getElementById('vowel-chart');

    [consonantChart, vowelChart].forEach(chart => {
        if (!chart) return;

        const cells = chart.querySelectorAll('td[data-sounds]');
        cells.forEach(cell => {
            const sounds = cell.getAttribute('data-sounds').split(' ');

            cell.innerHTML = sounds.map(sound =>
                `<button class="sound-btn" data-sound="${sound}">${sound}</button>`
            ).join(' ');

            cell.querySelectorAll('.sound-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    this.classList.toggle('selected');
                    updateSelectedSounds();
                });
            });
        });
    });
}

export function initializePhonology() {
    const form = document.getElementById('phonology-form');

    // Initialize IPA charts
    initializeCharts();

    // Set up diacritic buttons
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

    // Form submission handler
    form?.addEventListener('submit', async function(e) {
        e.preventDefault();

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

        try {
            await savePhonology(phonologyData);
            alert('Phonology system saved successfully!');
            loadPhonologyData();
        } catch (error) {
            console.error('Error saving phonology:', error);
            alert('Error saving phonology system. See console for details.');
        }
    });

    // Load initial data
    loadPhonologyData();
}

async function loadPhonologyData() {
    try {
        const data = await getPhonology();
        displayPhonologyData(data);
    } catch (error) {
        console.error('Error loading phonology data:', error);
        document.getElementById('phonology-display').innerHTML =
            '<p class="error">Error loading phonology data. See console for details.</p>';
    }
}

// Export function to delete phonology category for external use
export async function deleteCategory(category) {
    if (confirm(`Are you sure you want to delete the ${category} category?`)) {
        try {
            await deletePhonologyCategory(category);
            alert('Category deleted successfully.');
            loadPhonologyData();
        } catch (error) {
            console.error('Error deleting category:', error);
            alert('Error deleting category. See console for details.');
        }
    }
}