import pymupdf
import io
from PIL import Image
from pathlib import Path

ppdt_out = Path("public/assets/ppdt")
tat_out = Path("public/assets/tat")
ppdt_out.mkdir(parents=True, exist_ok=True)
tat_out.mkdir(parents=True, exist_ok=True)

def extract_images_from_pdf(pdf_path, out_dir, prefix, max_images=30):
    doc = pymupdf.open(pdf_path)
    count = 0
    for page_idx, page in enumerate(doc):
        image_list = page.get_images(full=True)
        for img_info in image_list:
            xref = img_info[0]
            base_image = doc.extract_image(xref)
            image_bytes = base_image["image"]
            image_ext = base_image["ext"]

            # Load in PIL to verify and filter out tiny logos/icons
            try:
                img = Image.open(io.BytesIO(image_bytes))
                width, height = img.size
                if width >= 250 and height >= 200: # only real scene pictures
                    count += 1
                    save_path = out_dir / f"{prefix}_{count:03d}.{image_ext}"
                    with open(save_path, "wb") as f:
                        f.write(image_bytes)
                    if count >= max_images:
                        return count
            except Exception as e:
                pass
    return count

ppdt_pdf = Path("data/staging/PPDT/50- ppdt practice pictures.pdf")
tat_pdf = Path("data/staging/TAT/1 AFSB DEHRADUN TAT.pdf")

if ppdt_pdf.exists():
    n_ppdt = extract_images_from_pdf(ppdt_pdf, ppdt_out, "ppdt", 25)
    print(f"Extracted {n_ppdt} PPDT images to {ppdt_out}")

if tat_pdf.exists():
    n_tat = extract_images_from_pdf(tat_pdf, tat_out, "tat", 15)
    print(f"Extracted {n_tat} TAT images to {tat_out}")
