"""
SSB Mentor - Source ZIP Inventory, Safe Extraction and Audit Pipeline
"""

import os
import zipfile
import hashlib
import json
import re
from pathlib import Path

SOURCE_DIR = Path("data/source-zips")
STAGING_DIR = Path("data/staging")
MANIFESTS_DIR = Path("data/manifests")
REPORTS_DIR = Path("data/import-reports")
DOCS_DIR = Path("docs")

ARCHIVE_CATEGORY_MAP = {
    "drive-download-20261024T144514Z-1-001.zip": {
        "category": "GTO",
        "subcategory": "GPE",
        "description": "Group Planning Exercise (GPE) scenarios and solutions"
    },
    "drive-download-20261024T144713Z-1-001.zip": {
        "category": "INTERVIEW",
        "subcategory": "PERSONAL_INTERVIEW",
        "description": "Personal Interview, CIQ, and technical questions"
    },
    "drive-download-20261024T144845Z-1-001.zip": {
        "category": "LECTURETTE",
        "subcategory": "TOPICS",
        "description": "Lecturette topic booklets and board-wise collections"
    },
    "drive-download-20261024T145407Z-1-001.zip": {
        "category": "SRT",
        "subcategory": "SITUATION_REACTION",
        "description": "Situation Reaction Test practice sets and booklets"
    },
    "drive-download-20261024T150103Z-1-001.zip": {
        "category": "TAT",
        "subcategory": "PICTURES_AND_STORIES",
        "description": "Thematic Apperception Test picture sets and board compilations"
    },
    "drive-download-20261024T150301Z-1-001.zip": {
        "category": "OIR",
        "subcategory": "DIPR_BOOKLETS",
        "description": "Officer Intelligence Rating (OIR) DIPR test booklets and question papers"
    },
    "drive-download-20261024T150456Z-1-001.zip": {
        "category": "PPDT",
        "subcategory": "PICTURE_PERCEPTION",
        "description": "Picture Perception & Description Test images and practice sets"
    },
    "drive-download-20261024T150622Z-1-001.zip": {
        "category": "WAT",
        "subcategory": "WORD_ASSOCIATION",
        "description": "Word Association Test practice words and PPT slide decks"
    }
}

ALLOWED_EXTENSIONS = {".pdf", ".ppt", ".pptx", ".jpg", ".jpeg", ".png", ".webp", ".txt", ".json", ".docx", ".xlsx", ".csv"}
EXECUTABLE_EXTENSIONS = {".exe", ".bat", ".cmd", ".sh", ".ps1", ".vbs", ".js", ".msi", ".jar", ".py"}

def sha256_file(filepath):
    h = hashlib.sha256()
    with open(filepath, "rb") as f:
        while chunk := f.read(65536):
            h.update(chunk)
    return h.hexdigest()

def sanitize_filename(filename):
    # Remove directory traversal patterns
    cleaned = filename.replace("\\", "/").strip()
    cleaned = re.sub(r"^\.+/+", "", cleaned)
    parts = [p for p in cleaned.split("/") if p and p != ".."]
    return "/".join(parts)

def inspect_archives():
    print("=== Step 1: Inspecting Archives ===")
    archives_info = []
    global_file_hashes = {}
    duplicates = []
    suspicious_entries = []
    extension_counts = {}

    for zip_path in sorted(SOURCE_DIR.glob("*.zip")):
        zip_name = zip_path.name
        archive_size = zip_path.stat().st_size
        cat_info = ARCHIVE_CATEGORY_MAP.get(zip_name, {
            "category": "UNCLASSIFIED",
            "subcategory": "UNKNOWN",
            "description": "Unclassified source archive"
        })

        archive_entry = {
            "archive_name": zip_name,
            "archive_size_bytes": archive_size,
            "archive_size_mb": round(archive_size / (1024 * 1024), 2),
            "category": cat_info["category"],
            "subcategory": cat_info["subcategory"],
            "description": cat_info["description"],
            "entries_count": 0,
            "files_count": 0,
            "uncompressed_bytes": 0,
            "files": []
        }

        try:
            with zipfile.ZipFile(zip_path, "r") as zf:
                for info in zf.infolist():
                    archive_entry["entries_count"] += 1
                    if info.is_dir():
                        continue

                    archive_entry["files_count"] += 1
                    archive_entry["uncompressed_bytes"] += info.file_size

                    # Check for path traversal or malicious names
                    safe_name = sanitize_filename(info.filename)
                    if safe_name != info.filename or ".." in info.filename:
                        suspicious_entries.append({
                            "archive": zip_name,
                            "raw_filename": info.filename,
                            "sanitized": safe_name,
                            "reason": "Potential path traversal or suspicious characters"
                        })

                    ext = Path(safe_name).suffix.lower()
                    extension_counts[ext] = extension_counts.get(ext, 0) + 1

                    if ext in EXECUTABLE_EXTENSIONS:
                        suspicious_entries.append({
                            "archive": zip_name,
                            "raw_filename": info.filename,
                            "reason": f"Dangerous executable extension: {ext}"
                        })

                    # Track CRC duplicates
                    crc = f"{info.CRC:08x}"
                    if crc in global_file_hashes:
                        duplicates.append({
                            "crc": crc,
                            "file_size": info.file_size,
                            "file1": global_file_hashes[crc],
                            "file2": {"archive": zip_name, "filename": safe_name}
                        })
                    else:
                        global_file_hashes[crc] = {"archive": zip_name, "filename": safe_name}

                    archive_entry["files"].append({
                        "raw_filename": info.filename,
                        "safe_filename": safe_name,
                        "file_size": info.file_size,
                        "compress_size": info.compress_size,
                        "crc": crc,
                        "extension": ext
                    })

        except Exception as e:
            archive_entry["error"] = str(e)

        archives_info.append(archive_entry)

    return archives_info, extension_counts, duplicates, suspicious_entries

def extract_and_stage(archives_info):
    print("=== Step 2: Safe Extraction to Staging ===")
    manifest = []
    extraction_errors = []

    for item in archives_info:
        zip_path = SOURCE_DIR / item["archive_name"]
        cat = item["category"]
        cat_staging_dir = STAGING_DIR / cat
        cat_staging_dir.mkdir(parents=True, exist_ok=True)

        with zipfile.ZipFile(zip_path, "r") as zf:
            for file_meta in item["files"]:
                safe_name = file_meta["safe_filename"]
                ext = file_meta["extension"]

                # Security check
                if ext in EXECUTABLE_EXTENSIONS:
                    print(f"Skipping dangerous file: {safe_name}")
                    continue

                if ext not in ALLOWED_EXTENSIONS:
                    print(f"Flagging unsupported format for review: {safe_name}")

                # Destination path
                # Flatten or preserve base filename to prevent deep nesting issues
                base_name = Path(safe_name).name
                dest_path = cat_staging_dir / base_name

                # If duplicate name in same category directory, make unique
                counter = 1
                while dest_path.exists():
                    # Check if identical file
                    if dest_path.stat().st_size == file_meta["file_size"]:
                        break
                    stem = Path(base_name).stem
                    suffix = Path(base_name).suffix
                    dest_path = cat_staging_dir / f"{stem}_{counter}{suffix}"
                    counter += 1

                try:
                    with zf.open(file_meta["raw_filename"], "r") as source_stream:
                        with open(dest_path, "wb") as dest_file:
                            dest_file.write(source_stream.read())

                    sha256 = sha256_file(dest_path)

                    manifest.append({
                        "id": f"{cat.lower()}_{hashlib.md5(f'{item['archive_name']}_{safe_name}'.encode()).hexdigest()[:12]}",
                        "category": cat,
                        "subcategory": item["subcategory"],
                        "title": Path(safe_name).stem.replace("_", " ").title(),
                        "original_filename": safe_name,
                        "staged_path": str(dest_path.as_posix()),
                        "file_size": dest_path.stat().st_size,
                        "file_extension": ext,
                        "sha256": sha256,
                        "source_archive": item["archive_name"],
                        "verification_status": "unverified",
                        "publication_status": "draft",
                        "supported_format": ext in {".pdf", ".jpg", ".jpeg", ".png", ".webp", ".txt", ".json"},
                        "requires_manual_review": ext in {".ppt", ".pptx"} or "handwritten" in safe_name.lower() or "mixed" in safe_name.lower()
                    })
                except Exception as e:
                    extraction_errors.append({
                        "archive": item["archive_name"],
                        "filename": safe_name,
                        "error": str(e)
                    })

    return manifest, extraction_errors

def main():
    archives_info, extension_counts, duplicates, suspicious_entries = inspect_archives()
    manifest, extraction_errors = extract_and_stage(archives_info)

    # Save manifest
    manifest_path = MANIFESTS_DIR / "initial_extracted_manifest.json"
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)

    # Save import audit report
    audit_report = {
        "timestamp": "2026-10-24T20:53:00+05:30",
        "archive_count": len(archives_info),
        "total_source_archives": [
            {
                "archive": a["archive_name"],
                "category": a["category"],
                "subcategory": a["subcategory"],
                "size_mb": a["archive_size_mb"],
                "files_count": a["files_count"],
                "uncompressed_mb": round(a["uncompressed_bytes"] / (1024 * 1024), 2)
            }
            for a in archives_info
        ],
        "extension_breakdown": extension_counts,
        "duplicate_count": len(duplicates),
        "duplicates": duplicates,
        "suspicious_entries_count": len(suspicious_entries),
        "suspicious_entries": suspicious_entries,
        "total_manifest_items": len(manifest),
        "extraction_errors": extraction_errors,
        "items_requiring_manual_review": [m for m in manifest if m["requires_manual_review"]]
    }

    report_path = REPORTS_DIR / "data_audit_report.json"
    with open(report_path, "w", encoding="utf-8") as f:
        json.dump(audit_report, f, indent=2)

    print(f"Extraction & audit complete!")
    print(f"Archives inspected: {len(archives_info)}")
    print(f"Manifest items created: {len(manifest)}")
    print(f"Duplicates identified: {len(duplicates)}")
    print(f"Extraction errors: {len(extraction_errors)}")
    print(f"Items requiring review: {len(audit_report['items_requiring_manual_review'])}")

if __name__ == "__main__":
    main()
