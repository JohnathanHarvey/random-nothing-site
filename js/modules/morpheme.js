import { addMorpheme } from './api.js';

export function initializeMorphemeForm() {
    const form = document.getElementById('morpheme-form');
    const typeSelect = document.getElementById('type');
    const affixOptions = document.getElementById('affix-options');
    const addAllomorphBtn = document.getElementById('add-allomorph');

    // Show/hide affix options based on morpheme type
    typeSelect.addEventListener('change', function() {
        affixOptions.style.display = this.value === 'root' ? 'none' : 'block';
    });

    // Add allomorph functionality
    addAllomorphBtn?.addEventListener('click', function() {
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

    // Form submission handler
    form?.addEventListener('submit', async function(e) {
        e.preventDefault();

        // Get form data
        const formData = {
            morpheme: document.getElementById('morpheme').value,
            type: typeSelect.value,
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

        try {
            await addMorpheme(formData);
            alert('Morpheme saved successfully!');
            form.reset();
            affixOptions.style.display = 'none';
            document.dispatchEvent(new Event('morphemeAdded'));
        } catch (error) {
            console.error('Error saving morpheme:', error);
            alert('Error saving morpheme. See console for details.');
        }
    });
}