import pymupdf
from pathlib import Path
import re

lec_dir = Path("data/staging/LECTURETTE")
for p in lec_dir.glob("*.pdf"):
    doc = pymupdf.open(p)
    text = ""
    for page in doc[:2]:
        text += page.get_text() + "\n"
    print(f"=== {p.name} (pages: {len(doc)}) ===")
    lines = [l.strip() for l in text.splitlines() if len(l.strip()) > 3]
    print("\n".join(lines[:10]))
    print("-----------------------------------")
