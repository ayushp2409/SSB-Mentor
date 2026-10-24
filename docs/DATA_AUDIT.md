# SSB Mentor - Data Audit Report

**Date:** 2026-10-24  
**Workspace:** `SSBMentor`  
**Source Path Correction:** Original ZIP archives moved from workspace root to `data/source-zips/` to preserve data integrity and maintain strict separation between raw sources, staging, and processed application assets.

---

## 1. Discovered Source ZIP Archives

The workspace contains 8 primary ZIP archives downloaded from source Google Drive repositories representing comprehensive SSB preparation resources:

| Archive Name | Category | Subcategory | File Size (MB) | Total Entries | Uncompressed Size (MB) |
|---|---|---|---|---|---|
| `drive-download-20261024T144514Z-1-001.zip` | **GTO** | GPE (Group Planning Exercise) | 55.91 MB | 15 | 148.99 MB |
| `drive-download-20261024T144713Z-1-001.zip` | **INTERVIEW** | Personal Interview & CIQ | 33.78 MB | 21 | 35.52 MB |
| `drive-download-20261024T144845Z-1-001.zip` | **LECTURETTE** | Board-wise Topics & Booklets | 48.37 MB | 10 | 49.68 MB |
| `drive-download-20261024T145407Z-1-001.zip` | **SRT** | Situation Reaction Tests | 11.15 MB | 15 | 13.85 MB |
| `drive-download-20261024T150103Z-1-001.zip` | **TAT** | Thematic Apperception Test | 82.67 MB | 15 | 84.47 MB |
| `drive-download-20261024T150301Z-1-001.zip` | **OIR** | DIPR Screening Booklets | 243.83 MB | 53 | 256.43 MB |
| `drive-download-20261024T150456Z-1-001.zip` | **PPDT** | Picture Perception & Description | 82.44 MB | 4 | 85.57 MB |
| `drive-download-20261024T150622Z-1-001.zip` | **WAT** | Word Association Tests | 1.82 MB | 6 | 2.83 MB |
| **TOTAL** | — | — | **559.97 MB** | **139** | **677.34 MB** |

---

## 2. File Extensions Breakdown

| Extension | Count | Percentage | Primary Usage |
|---|---|---|---|
| `.pdf` | 134 | 96.4% | Test booklets, prompt sets, real board compilations, solved exercises |
| `.ppt` | 3 | 2.2% | Timed slide decks for WAT practice |
| `.pptx` | 2 | 1.4% | Timed slide decks for WAT and TAT picture sets |
| **Total** | **139** | **100%** | Approved document & presentation types |

> **Security Note:** Zero dangerous or executable extensions (`.exe`, `.bat`, `.cmd`, `.ps1`, `.sh`, `.vbs`, etc.) were detected. No ZIP path traversal attempts (`..` or root escaping) were identified.

---

## 3. Estimated Item Count Per Category

Based on manifest extraction and structural inspection of booklets:

| Category | Source Files | Estimated Individual Questions / Items | Description & Notes |
|---|---|---|---|
| **OIR (Screening)** | 53 PDFs | ~2,500+ questions | DIPR Booklets 34, 35, 52, 53, 54, 55, 75, 168, 169 (verbal and non-verbal reasoning). |
| **PPDT (Screening)** | 4 PDFs | ~550+ pictures | 50 PPDT practice pictures, 100 sample photos, 400+ practice images collection. |
| **TAT (Psychology)** | 14 PDFs, 1 PPTX | ~180+ picture prompts | 15 sets containing 10-12 picture slides each from Allahabad, Bhopal, Dehradun, Jalandhar boards. |
| **WAT (Psychology)** | 2 PDFs, 4 PPT/X | ~1,200+ words | 800 WAT practice booklet + four 60-word timed test decks. |
| **SRT (Psychology)** | 15 PDFs | ~900+ situations | 15 practice sets containing 60 situations each. |
| **GTO (GPE / Scenarios)** | 15 PDFs | ~25+ complete scenarios | Map-based narratives with multiple emergencies and model solution frameworks. |
| **LECTURETTE** | 10 PDFs | ~400+ curated topics | 4-topic cards covering international relations, national security, science & tech, social issues. |
| **INTERVIEW** | 21 PDFs | ~600+ questions | Comprehensive Information Questionnaire (CIQ), CSE technical questions, HR, personal background. |
| **TOTAL** | **139 files** | **~6,350+ items** | Comprehensive question bank potential across all 5 days of SSB. |

---

## 4. Extraction & Staging Status

All 139 files have been safely unpacked into `data/staging/` organized strictly by SSB category:

- `data/staging/OIR/` (53 files)
- `data/staging/PPDT/` (4 files)
- `data/staging/TAT/` (15 files)
- `data/staging/WAT/` (6 files)
- `data/staging/SRT/` (15 files)
- `data/staging/GTO/` (15 files)
- `data/staging/LECTURETTE/` (10 files)
- `data/staging/INTERVIEW/` (21 files)

**Status:** 100% extracted with 0 extraction errors. Each extracted asset has an MD5 and SHA-256 digest recorded in `data/manifests/initial_extracted_manifest.json`.

---

## 5. Duplicate Files Identified

Fourteen (14) files are exact binary duplicates (matching CRC32 and SHA-256 digests) originating from multiple Google Drive downloads or duplicate naming:

| Duplicate CRC | File 1 | Archive 1 | File 2 (Duplicate) | Archive 2 |
|---|---|---|---|---|
| `180f08d1` | `a. SRT 11.pdf` | SRT zip | `a. SRT 11 (1).pdf` | SRT zip |
| `338abf0e` | `TAT OF ALL BOARDS.pdf` | TAT zip | `TAT OF ALL BOARDS @Pehlakadamop.pdf` | TAT zip |
| `5abbb0a8` | `Booklet 34 - 2.pdf` | OIR zip | `Booklet 34 - 2 (2).pdf` | OIR zip |
| `525fd889` | `DIPR BOOKLET 53 WITH ANSEERS (1).pdf` | OIR zip | `DIPR BOOKLET 53 WITH ANSEERS (1)(1).pdf` | OIR zip |
| `041f8d71` | `Booklet 55.pdf` | OIR zip | `Booklet 55(1).pdf` | OIR zip |
| `d34b2135` | `Booklet 35 - 2.pdf` | OIR zip | `Booklet 35 - 2(1).pdf` | OIR zip |
| `d34b2135` | `Booklet 35 - 2.pdf` | OIR zip | `OIR BENGALURU AND KAPURTHALA.pdf` | OIR zip |
| `d34b2135` | `Booklet 35 - 2.pdf` | OIR zip | `OIR BENGALURU AND KAPURTHALA (1).pdf` | OIR zip |
| `81b4891f` | `OIR 54C.pdf` | OIR zip | `OIR 54C (1).pdf` | OIR zip |
| `bc5270b6` | `mixed oir of 201,202...pdf` | OIR zip | `SSB Bhopal Mock 1 (1).pdf` | OIR zip |
| `b3f1ba1f` | `IMPACT_OIR(1).pdf` | OIR zip | `IMPACT_OIR(1)(1).pdf` | OIR zip |
| `cc4f8041` | `OIR-1.pdf` | OIR zip | `OIR-1(1).pdf` | OIR zip |
| `2ca3e1e1` | `Bhopal Actual OIR.pdf` | OIR zip | `Bhopal Actual OIR(1).pdf` | OIR zip |
| `bc5270b6` | `mixed oir of 201,202...pdf` | OIR zip | `SSB Bhopal Mock 1.pdf` | OIR zip |

**Resolution in Importer:** Deduplication rule prevents uploading duplicate binaries into Firebase Storage and links question metadata deterministically to a single canonical asset ID.

---

## 6. Items Flagged for Manual Review

Eight (8) items require special parsing or administrative review:

1. **`Vi TAT set 1.pptx` (TAT)**: PowerPoint slide deck containing embedded picture slides. Requires PPTX slide/image extraction pipeline.
2. **`WAT 1 - PRACTICE TEST (F).ppt` (WAT)**: Legacy binary PowerPoint presentation. Requires conversion or extraction of text frames.
3. **`WAT 2 - PRACTICE TEST (F).ppt` (WAT)**: Legacy binary PPT.
4. **`WAT 3 - PRACTICE TEST (F).pptx` (WAT)**: PPTX presentation containing 60 timed word slides.
5. **`WAT 4 - PRACTICE TEST (F).ppt` (WAT)**: Legacy binary PPT.
6. **`GPE solution handwritten.pdf` (GTO)**: Handwritten notes. Needs OCR or administrative transcription to render as structured text, or can be presented as reference document PDF.
7. **`DIPR OIR 169 mixed(with answers).pdf` (OIR)**: Mixed compilation of verbal and non-verbal reasoning. Requires question boundary separation.
8. **`mixed oir of 201,202, bhopal oir , jalandhar mixed oir.pdf` (OIR)**: Multi-board composite booklet. Requires item-level indexing.

---

## 7. Next Steps for Data Ingestion Pipeline

1. **Text Extraction:** Extract question text and lists from text-based PDFs (WAT 800 booklet, SRT booklets, Lecturette compilations, Interview CIQ series).
2. **Image Extraction:** Extract high-resolution picture prompts from PPDT and TAT PDF/PPTX assets for the interactive test runner.
3. **Manifest Normalization:** Produce category-specific JSON question batches ready for admin preview and idempotent import into Firestore and Storage.
