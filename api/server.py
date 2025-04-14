from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
import json
import os

app = Flask(__name__)
CORS(app)  # This enables CORS for all routes

DB_PATH = 'lexicon.db'

# Initialize the database if it doesn't exist
def init_db():
    if not os.path.exists(DB_PATH):
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()

        # Create morphemes table
        c.execute('''
        CREATE TABLE morphemes (
            id INTEGER PRIMARY KEY,
            morpheme TEXT,
            type TEXT,
            pos TEXT,
            gloss TEXT,
            ipa TEXT,
            notes TEXT,
            affix_properties TEXT,
            allomorphs TEXT
        )
        ''')

        # Create words table
        c.execute('''
        CREATE TABLE words (
            id INTEGER PRIMARY KEY,
            word TEXT,
            gloss TEXT,
            pos TEXT,
            ipa TEXT,
            notes TEXT
        )
        ''')

        conn.commit()
        conn.close()
        print("Database initialized.")

# Convert JSON string to Python object and vice versa
def json_or_none(value):
    if value is None:
        return None
    return json.loads(value)

# Get all morphemes
@app.route('/api/morphemes', methods=['GET'])
def get_morphemes():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()

    c.execute('SELECT * FROM morphemes')
    rows = c.fetchall()

    result = []
    for row in rows:
        morpheme = dict(row)
        morpheme['affix_properties'] = json_or_none(morpheme['affix_properties'])
        morpheme['allomorphs'] = json_or_none(morpheme['allomorphs'])
        result.append(morpheme)

    conn.close()
    return jsonify(result)

# Add a new morpheme
@app.route('/api/morphemes', methods=['POST'])
def add_morpheme():
    data = request.json

    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    affix_props = json.dumps(data.get('affixProperties')) if data.get('affixProperties') else None
    allomorphs = json.dumps(data.get('allomorphs')) if data.get('allomorphs') else None

    c.execute('''
    INSERT INTO morphemes (morpheme, type, pos, gloss, ipa, notes, affix_properties, allomorphs)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        data.get('morpheme'),
        data.get('type'),
        data.get('pos'),
        data.get('gloss'),
        data.get('ipa'),
        data.get('notes'),
        affix_props,
        allomorphs
    ))

    conn.commit()
    morpheme_id = c.lastrowid
    conn.close()

    return jsonify({"id": morpheme_id, "message": "Morpheme added successfully"})

# Get all words
@app.route('/api/words', methods=['GET'])
def get_words():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()

    c.execute('SELECT * FROM words')
    rows = c.fetchall()

    result = [dict(row) for row in rows]

    conn.close()
    return jsonify(result)

# Add a new word
@app.route('/api/words', methods=['POST'])
def add_word():
    data = request.json

    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    c.execute('''
    INSERT INTO words (word, gloss, pos, ipa, notes)
    VALUES (?, ?, ?, ?, ?)
    ''', (
        data.get('word'),
        data.get('gloss'),
        data.get('pos'),
        data.get('ipa'),
        data.get('notes')
    ))

    conn.commit()
    word_id = c.lastrowid
    conn.close()

    return jsonify({"id": word_id, "message": "Word added successfully"})

# Search lexicon
@app.route('/api/search', methods=['GET'])
def search_lexicon():
    query = request.args.get('query', '').lower()

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()

    # Search morphemes
    c.execute('''
    SELECT * FROM morphemes
    WHERE lower(morpheme) LIKE ? OR lower(gloss) LIKE ?
    ''', (f'%{query}%', f'%{query}%'))

    morpheme_rows = c.fetchall()
    morphemes = []
    for row in morpheme_rows:
        morpheme = dict(row)
        morpheme['affix_properties'] = json_or_none(morpheme['affix_properties'])
        morpheme['allomorphs'] = json_or_none(morpheme['allomorphs'])
        morphemes.append(morpheme)

    # Search words
    c.execute('''
    SELECT * FROM words
    WHERE lower(word) LIKE ? OR lower(gloss) LIKE ?
    ''', (f'%{query}%', f'%{query}%'))

    word_rows = c.fetchall()
    words = [dict(row) for row in word_rows]

    conn.close()

    return jsonify({
        "morphemes": morphemes,
        "words": words
    })

if __name__ == '__main__':
    init_db()
    app.run(host='0.0.0.0', port=5000, debug=True)
