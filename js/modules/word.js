import { addWord } from './api.js';

export function initializeWordForm() {
    const form = document.getElementById('word-form');

    form?.addEventListener('submit', async function(e) {
        e.preventDefault();

        const formData = {
            word: document.getElementById('word').value,
            gloss: document.getElementById('word-gloss').value,
            pos: document.getElementById('word-pos').value,
            ipa: document.getElementById('word-ipa').value,
            notes: document.getElementById('word-notes').value
        };

        try {
            await addWord(formData);
            alert('Word saved successfully!');
            form.reset();
            document.dispatchEvent(new Event('wordAdded'));
        } catch (error) {
            console.error('Error saving word:', error);
            alert('Error saving word. See console for details.');
        }
    });
}