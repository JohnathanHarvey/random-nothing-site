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

        # Create phonological_inventory table
        c.execute('''
        CREATE TABLE phonological_inventory (
            id INTEGER PRIMARY KEY,
            type TEXT,  -- 'consonant' or 'vowel'
            sound TEXT,
            manner TEXT,
            place TEXT,
            height TEXT,
            backness TEXT,
            features TEXT  -- JSON string of additional features
        )
        ''')

        # Create phonotactics table
        c.execute('''
        CREATE TABLE phonotactics (
            id INTEGER PRIMARY KEY,
            syllable_structure TEXT,
            cluster_constraints TEXT,
            processes TEXT,
            features TEXT  -- JSON string of system-wide features (gemination, tone, etc.)
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

# Get all phonology entries
@app.route('/api/phonology', methods=['GET'])
def get_phonology():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()

    # Get consonants and vowels
    c.execute('SELECT * FROM phonological_inventory')
    inventory_rows = c.fetchall()
    inventory = [dict(row) for row in inventory_rows]

    # Get phonotactics
    c.execute('SELECT * FROM phonotactics LIMIT 1')
    phonotactics_row = c.fetchone()
    phonotactics = dict(phonotactics_row) if phonotactics_row else {}

    # Format response
    result = {
        'inventory': inventory,
        'phonotactics': phonotactics
    }

    conn.close()
    return jsonify(result)

# Add or update phonology entry
@app.route('/api/phonology', methods=['POST'])
def add_phonology():
    data = request.json
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    try:
        # Start transaction
        c.execute('BEGIN TRANSACTION')

        # Handle phonological inventory
        if 'consonants' in data or 'vowels' in data:
            # Clear existing inventory
            c.execute('DELETE FROM phonological_inventory')

            # Add consonants
            for consonant in data.get('consonants', []):
                c.execute('''
                INSERT INTO phonological_inventory (type, sound, manner, place, features)
                VALUES (?, ?, ?, ?, ?)
                ''', (
                    'consonant',
                    consonant['sound'],
                    consonant['manner'],
                    consonant['place'],
                    json.dumps(consonant.get('features', {}))
                ))

            # Add vowels
            for vowel in data.get('vowels', []):
                c.execute('''
                INSERT INTO phonological_inventory (type, sound, height, backness, features)
                VALUES (?, ?, ?, ?, ?)
                ''', (
                    'vowel',
                    vowel['sound'],
                    vowel['height'],
                    vowel['backness'],
                    json.dumps(vowel.get('features', {}))
                ))

        # Handle phonotactics
        if 'phonotactics' in data:
            # Clear existing phonotactics
            c.execute('DELETE FROM phonotactics')

            phonotactics = data['phonotactics']
            c.execute('''
            INSERT INTO phonotactics (syllable_structure, cluster_constraints, processes, features)
            VALUES (?, ?, ?, ?)
            ''', (
                phonotactics.get('syllableStructure'),
                phonotactics.get('clusterConstraints'),
                phonotactics.get('phonologicalProcesses'),
                json.dumps(data.get('features', {}))
            ))

        # Commit transaction
        c.execute('COMMIT')
        message = "Phonology system updated successfully"

    except Exception as e:
        # Rollback on error
        c.execute('ROLLBACK')
        raise e

    finally:
        conn.close()

    return jsonify({"message": message})

# Delete phonology entry (now deletes by type and sound)
@app.route('/api/phonology/<type>/<sound>', methods=['DELETE'])
def delete_phonology(type, sound):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    c.execute('DELETE FROM phonological_inventory WHERE type = ? AND sound = ?', (type, sound))
    conn.commit()
    conn.close()

    return jsonify({"message": f"{type} sound {sound} deleted successfully"})

# Get phonological inventory
@app.route('/api/phonology/inventory', methods=['GET'])
def get_phonological_inventory():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()

    c.execute('SELECT * FROM phonological_inventory')
    rows = c.fetchall()
    result = [dict(row) for row in rows]

    # Parse JSON strings
    for item in result:
        item['features'] = json_or_none(item['features'])

    conn.close()
    return jsonify(result)

# Save phonological inventory
@app.route('/api/phonology/inventory', methods=['POST'])
def save_phonological_inventory():
    data = request.json

    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    # Clear existing inventory
    c.execute('DELETE FROM phonological_inventory')

    # Add consonants
    for consonant in data.get('consonants', []):
        c.execute('''
        INSERT INTO phonological_inventory (type, sound, manner, place, features)
        VALUES (?, ?, ?, ?, ?)
        ''', (
            'consonant',
            consonant['sound'],
            consonant['manner'],
            consonant['place'],
            json.dumps(consonant.get('features', {}))
        ))

    # Add vowels
    for vowel in data.get('vowels', []):
        c.execute('''
        INSERT INTO phonological_inventory (type, sound, height, backness, features)
        VALUES (?, ?, ?, ?, ?)
        ''', (
            'vowel',
            vowel['sound'],
            vowel['height'],
            vowel['backness'],
            json.dumps(vowel.get('features', {}))
        ))

    conn.commit()
    conn.close()

    return jsonify({"message": "Phonological inventory updated successfully"})

# Get phonotactics
@app.route('/api/phonology/phonotactics', methods=['GET'])
def get_phonotactics():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()

    c.execute('SELECT * FROM phonotactics LIMIT 1')
    row = c.fetchone()

    result = dict(row) if row else {}
    if result:
        result['features'] = json_or_none(result['features'])

    conn.close()
    return jsonify(result)

# Save phonotactics
@app.route('/api/phonology/phonotactics', methods=['POST'])
def save_phonotactics():
    data = request.json

    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    # Clear existing phonotactics
    c.execute('DELETE FROM phonotactics')

    c.execute('''
    INSERT INTO phonotactics (syllable_structure, cluster_constraints, processes, features)
    VALUES (?, ?, ?, ?)
    ''', (
        data.get('syllableStructure'),
        data.get('clusterConstraints'),
        data.get('phonologicalProcesses'),
        json.dumps(data.get('features', {}))
    ))

    conn.commit()
    conn.close()

    return jsonify({"message": "Phonotactics updated successfully"})

# Start the application
if __name__ == '__main__':
    init_db()
    app.run(host='0.0.0.0', port=5000, debug=True)
