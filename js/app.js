import { initializeMorphemeForm } from './modules/morpheme.js';
import { initializeWordForm } from './modules/word.js';
import { initializeSearch } from './modules/search.js';
import { initializePhonology } from './modules/phonology.js';

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

// Load HTML content into tabs
async function loadTabContent() {
    const tabs = ['morpheme', 'word', 'search', 'phonology'];

    for (const tab of tabs) {
        const response = await fetch(`views/${tab}.html`);
        const html = await response.text();
        document.getElementById(`${tab}-tab`).innerHTML = html;
    }
}

// Initialize application
document.addEventListener('DOMContentLoaded', async function() {
    // Load tab content first
    await loadTabContent();

    // Initialize all components
    initializeMorphemeForm();
    initializeWordForm();
    initializeSearch();
    initializePhonology();
});