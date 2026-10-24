import pymupdf
import json
import re
from pathlib import Path

def extract_srt_situations():
    srt_dir = Path("data/staging/SRT")
    all_situations = []
    seen = set()

    for srt_file in sorted(srt_dir.glob("*.pdf")):
        try:
            doc = pymupdf.open(srt_file)
            full_text = ""
            for page in doc:
                full_text += "\n" + page.get_text()

            # Split situations by number patterns like "\n1. " or "\n 1. " or "\n(1) "
            # Match lines starting with a number and dot or parenthesis
            raw_items = re.split(r"\n\s*(?:[0-9]{1,3}\.|\([0-9]{1,3}\))\s*", full_text)
            for item in raw_items:
                # Clean up whitespace and newlines
                cleaned = " ".join(item.split()).strip()
                # Must be a reasonable situation length (e.g. 25 - 500 chars)
                if len(cleaned) > 20 and not cleaned.lower().startswith("situation reaction test") and not cleaned.lower().startswith("page"):
                    # Check if ends with "He..." or "She..." or "You..." or "They..."
                    # Deduplicate
                    key = cleaned[:60].lower()
                    if key not in seen:
                        seen.add(key)
                        all_situations.append({
                            "source_file": srt_file.name,
                            "situation": cleaned
                        })
        except Exception as e:
            print(f"Error reading {srt_file.name}: {e}")

    return all_situations

situations = extract_srt_situations()
print(f"Total unique SRT situations extracted: {len(situations)}")
for i, s in enumerate(situations[:8]):
    print(f"\n[{i+1}] ({s['source_file']}):\n{s['situation']}")
