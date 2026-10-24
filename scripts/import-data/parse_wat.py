import pymupdf
import json
import re
from pathlib import Path

def extract_wat_words():
    wat_path = Path("data/staging/WAT/800 WAT for Practice.pdf")
    if not wat_path.exists():
        return []
    doc = pymupdf.open(wat_path)
    words = []
    # Pattern to match numbers followed by words, e.g. "1. Easy" or "10. Comfort" or "25. Pursue"
    for page in doc:
        text = page.get_text()
        lines = text.split("\n")
        for line in lines:
            line = line.strip()
            # Match formats like: "1. Easy", "25. Pursue", "150. Responsibility"
            m = re.match(r"^(\d+)[\.\s]+([A-Za-z\s\(\)\-\/]+)$", line)
            if m:
                word = m.group(2).strip()
                # filter out headers like "S/No Word Use" or "WAT"
                if word and word.lower() not in ["word", "s/no", "use", "wat", "page", "sr"]:
                    words.append(word)
            elif re.match(r"^[A-Za-z]{3,}$", line) and line.lower() not in ["word", "practice", "pehlakadam", "ssb"]:
                # Sometimes words appear on their own lines following numbers
                words.append(line)

    # Deduplicate while preserving order
    seen = set()
    cleaned = []
    for w in words:
        w_clean = re.sub(r"[^A-Za-z\s]", "", w).strip().upper()
        if len(w_clean) >= 3 and w_clean not in seen and w_clean not in ["SNO", "WORD", "USE", "TEST", "PRACTICE", "SSB", "AFSB", "PAGE"]:
            seen.add(w_clean)
            cleaned.append(w_clean)
    return cleaned

words = extract_wat_words()
print(f"Extracted {len(words)} WAT words from 800 WAT PDF.")
print("First 20 words:", words[:20])
print("Last 10 words:", words[-10:])
