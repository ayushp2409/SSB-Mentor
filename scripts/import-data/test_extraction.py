import fitz
import re
from pathlib import Path

# Test WAT PDF extraction
wat_pdf = Path("data/staging/WAT/800 WAT for Practice.pdf")
if wat_pdf.exists():
    doc = fitz.open(wat_pdf)
    print(f"WAT PDF pages: {len(doc)}")
    full_text = ""
    for page in doc[:3]:
        full_text += page.get_text()
    print("Sample WAT Text (first 300 chars):")
    print(repr(full_text[:300]))

# Test SRT extraction
srt_pdf = Path("data/staging/SRT/a. SRT 1.pdf")
if srt_pdf.exists():
    doc = fitz.open(srt_pdf)
    print(f"\nSRT PDF pages: {len(doc)}")
    sample_text = doc[0].get_text()
    print("Sample SRT Text (first 300 chars):")
    print(repr(sample_text[:300]))

# Test PPDT images extraction
ppdt_pdf = Path("data/staging/PPDT/50- ppdt practice pictures.pdf")
if ppdt_pdf.exists():
    doc = fitz.open(ppdt_pdf)
    print(f"\nPPDT PDF pages: {len(doc)}")
    total_images = sum(len(page.get_images()) for page in doc)
    print(f"Total images found in {ppdt_pdf.name}: {total_images}")

# Test TAT extraction
tat_pdf = Path("data/staging/TAT/1 AFSB DEHRADUN TAT.pdf")
if tat_pdf.exists():
    doc = fitz.open(tat_pdf)
    print(f"\nTAT PDF pages: {len(doc)}")
    total_images = sum(len(page.get_images()) for page in doc)
    print(f"Total images found in {tat_pdf.name}: {total_images}")

# Test Lecturette extraction
lec_pdf = Path("data/staging/LECTURETTE/1 AFSB DEHRADUN LECTURETTE.pdf")
if lec_pdf.exists():
    doc = fitz.open(lec_pdf)
    print(f"\nLecturette PDF pages: {len(doc)}")
    print("Sample Lecturette Text (first 300 chars):")
    print(repr(doc[0].get_text()[:300]))
