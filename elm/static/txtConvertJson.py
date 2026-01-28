#!/usr/bin/env python3
import json

# Read the file
with open("words.txt", "r", encoding="utf-8") as f:
    content = f.read()

# Split into words
words = [w for w in content.split() if w]

# Write into JSON
with open("words.json", "w", encoding="utf-8") as f:
    json.dump(words, f, indent=2)

print(f"Converted {len(words)} words.")

