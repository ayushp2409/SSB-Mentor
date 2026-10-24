import json

with open('data/import-reports/data_audit_report.json', encoding='utf-8') as f:
    report = json.load(f)

print("Source Archives Breakdown:")
for a in report['total_source_archives']:
    print(f"- {a['archive']}: {a['category']} ({a['subcategory']}) - {a['size_mb']} MB, {a['files_count']} files, {a['uncompressed_mb']} MB uncompressed")

print("\nExtension Breakdown:", report['extension_breakdown'])
print(f"Duplicates Found: {len(report['duplicates'])}")
for d in report['duplicates']:
    print(f"  Duplicate CRC {d['crc']}: '{d['file1']['filename']}' in {d['file1']['archive']} <==> '{d['file2']['filename']}' in {d['file2']['archive']}")

print(f"\nItems Requiring Manual Review ({len(report['items_requiring_manual_review'])}):")
for r in report['items_requiring_manual_review']:
    print(f"- [{r['category']}] {r['original_filename']} | ext: {r['file_extension']} | staged: {r['staged_path']}")
