import pymupdf
from pathlib import Path

int_dir = Path("data/staging/INTERVIEW")
for p in sorted(int_dir.glob("*.pdf"))[:8]:
    doc = pymupdf.open(p)
    text = ""
    for page in doc[:2]:
        text += page.get_text() + "\n"
    print(f"=== {p.name} (pages: {len(doc)}) ===")
    lines = [l.strip() for l in text.splitlines() if len(l.strip()) > 3]
    print("\n".join(lines[:8]))
    print("-----------------------------------")
