const API_BASE_URL = 'http://localhost:5000/api';

export async function getMorphemes() {
    const response = await fetch(`${API_BASE_URL}/morphemes`);
    return response.json();
}

export async function addMorpheme(morphemeData) {
    const response = await fetch(`${API_BASE_URL}/morphemes`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(morphemeData)
    });
    return response.json();
}

export async function getWords() {
    const response = await fetch(`${API_BASE_URL}/words`);
    return response.json();
}

export async function addWord(wordData) {
    const response = await fetch(`${API_BASE_URL}/words`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(wordData)
    });
    return response.json();
}

export async function search(query) {
    const response = await fetch(`${API_BASE_URL}/search?query=${encodeURIComponent(query)}`);
    return response.json();
}

export async function getPhonology() {
    const response = await fetch(`${API_BASE_URL}/phonology`);
    return response.json();
}

export async function savePhonology(phonologyData) {
    const response = await fetch(`${API_BASE_URL}/phonology`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(phonologyData)
    });
    return response.json();
}

export async function deletePhonologyCategory(category) {
    const response = await fetch(`${API_BASE_URL}/phonology/${category}`, {
        method: 'DELETE'
    });
    return response.json();
}