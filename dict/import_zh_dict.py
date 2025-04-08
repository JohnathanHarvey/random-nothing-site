import json
import re
import os
from collections import defaultdict
from pypinyin import pinyin, Style

# Get the directory where the script is located
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

# File paths with absolute paths
INPUT_FILE = os.path.join(SCRIPT_DIR, "cedict_ts.u8")
OUTPUT_DIR = os.path.join(SCRIPT_DIR, "split_dict")

# Ensure output directory exists
os.makedirs(OUTPUT_DIR, exist_ok=True)

def to_tone_pinyin(hanzi):
    """Convert Chinese characters to pinyin with tone marks."""
    return ' '.join(word[0] for word in pinyin(hanzi, style=Style.TONE))

def parse_line(line):
    """Parse a single CC-CEDICT line into structured data."""
    if line.startswith("#"):
        return None

    # Format: simplified traditional [pinyin] /definitions/
    match = re.match(r"(\S+)\s+(\S+)\s+\[(.+?)\]\s+/(.+)/", line)
    if not match:
        return None

    simplified, traditional, pinyin_raw, definition_raw = match.groups()
    definition = definition_raw.strip().replace('/', '; ')
    tone_pinyin = to_tone_pinyin(simplified)

    return simplified, {
        "pinyin": tone_pinyin,
        "definition": definition
    }

# Grouped dictionary: { first_char: { word: {pinyin, definition} } }
grouped_entries = defaultdict(dict)

with open(INPUT_FILE, 'r', encoding='utf-8') as f:
    for line in f:
        parsed = parse_line(line)
        if parsed:
            word, entry = parsed
            first_char = word[0]
            grouped_entries[first_char][word] = entry

# Write each group to a separate JSON file
for char, entries in grouped_entries.items():
    filename = f"{OUTPUT_DIR}/{char}.json"
    with open(filename, 'w', encoding='utf-8') as out_file:
        json.dump(entries, out_file, ensure_ascii=False, indent=2)

print(f"✅ Successfully parsed and saved {len(grouped_entries)} dictionary files in '{OUTPUT_DIR}'")