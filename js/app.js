// Handle tab switching
window.switchTab = function(tabName) {
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => tab.classList.remove('active'));
    tabContents.forEach(content => content.classList.remove('active'));

    document.querySelector(`.tab:nth-child(${tabName === 'morpheme' ? 1 : tabName === 'word' ? 2 : 3})`).classList.add('active');
    document.getElementById(`${tabName}-tab`).classList.add('active');
}

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

    // Form submission handling
    document.getElementById('morpheme-form').addEventListener('submit', function(e) {
        e.preventDefault();
        // Here you would handle form submission, likely with AJAX
        alert('Morpheme submission would be processed here');
        // Reset form
        this.reset();
        document.getElementById('affix-options').style.display = 'none';
    });

    document.getElementById('word-form').addEventListener('submit', function(e) {
        e.preventDefault();
        // Here you would handle form submission, likely with AJAX
        alert('Word submission would be processed here');
        // Reset form
        this.reset();
    });

    document.getElementById('search-form').addEventListener('submit', function(e) {
        e.preventDefault();
        // Here you would handle search, likely with AJAX
        const resultsDiv = document.getElementById('search-results');
        resultsDiv.innerHTML = '<p>Search results would appear here.</p>';
    });
});