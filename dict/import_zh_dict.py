import json
import re
import os
from collections import defaultdict

input_file = "./cedict_ts.u8"
output_dir = "./split_dict"

# Ensure the output directory exists
os.makedirs(output_dir, exist_ok=True)

def parse_line(line):
    if line.startswith("#"):
        return None

    match = re.match(r"(\S+)\s+(\S+)\s+\[(.+?)\]\s+/(.+)/", line)
    if not match:
        return None

    simplified, traditional, pinyin_raw, definition_raw = match.groups()
    definition = definition_raw.strip().replace('/', '; ')
    return simplified, {
        "pinyin": pinyin_raw,
        "definition": definition
    }

# Dictionary grouped by first character
grouped = defaultdict(dict)

with open(input_file, 'r', encoding='utf-8') as f:
    for line in f:
        parsed = parse_line(line)
        if parsed:
            word, entry = parsed
            first_char = word[0]
            grouped[first_char][word] = entry

# Write each group to its own JSON file
for char, entries in grouped.items():
    filename = f"{output_dir}/{char}.json"
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(entries, f, ensure_ascii=False, indent=2)

print(f"Saved {len(grouped)} grouped dictionary files in '{output_dir}'")