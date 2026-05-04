import contextlib
import io
import json
import math
import os
import textwrap
import zipfile
from pathlib import Path
from xml.sax.saxutils import escape

from PIL import Image, ImageDraw, ImageFont


ROOT = Path.cwd()
NOTEBOOK = ROOT / "lab7_student_decision_tree_comparison.ipynb"
OUT_DIR = ROOT / "lab7_report_assets"
DOCX_PATH = ROOT / "lab7_code_output_report.docx"


def load_notebook():
    return json.loads(NOTEBOOK.read_text(encoding="utf-8"))


def get_font(size=22, bold=False):
    candidates = []
    if bold:
        candidates.extend(
            [
                r"C:\Windows\Fonts\consolab.ttf",
                r"C:\Windows\Fonts\arialbd.ttf",
            ]
        )
    else:
        candidates.extend(
            [
                r"C:\Windows\Fonts\consola.ttf",
                r"C:\Windows\Fonts\arial.ttf",
            ]
        )
    for path in candidates:
        if Path(path).exists():
            return ImageFont.truetype(path, size=size)
    return ImageFont.load_default()


def wrap_line(line, width=92):
    return textwrap.wrap(line, width=width, replace_whitespace=False) or [""]


def make_text_image(title, body, out_path, body_width=92):
    OUT_DIR.mkdir(exist_ok=True)
    title_font = get_font(28, bold=True)
    body_font = get_font(21)

    body_lines = []
    for line in body.splitlines():
        body_lines.extend(wrap_line(line, body_width))

    dummy = Image.new("RGB", (100, 100))
    draw = ImageDraw.Draw(dummy)
    line_height = draw.textbbox((0, 0), "Ag", font=body_font)[3] + 8
    title_height = draw.textbbox((0, 0), title, font=title_font)[3] + 16

    width = 1500
    height = 70 + title_height + len(body_lines) * line_height + 60
    image = Image.new("RGB", (width, height), color=(248, 249, 251))
    draw = ImageDraw.Draw(image)

    pad = 40
    draw.rounded_rectangle(
        (20, 20, width - 20, height - 20),
        radius=24,
        fill=(255, 255, 255),
        outline=(210, 215, 223),
        width=2,
    )
    draw.text((pad, 35), title, font=title_font, fill=(28, 34, 45))
    y = 35 + title_height
    for line in body_lines:
        draw.text((pad, y), line, font=body_font, fill=(45, 52, 64))
        y += line_height

    image.save(out_path)


def extract_code_blocks(nb):
    code_cells = [cell for cell in nb["cells"] if cell["cell_type"] == "code"]
    labeled = []
    for idx, cell in enumerate(code_cells, start=1):
        code = "".join(cell["source"]).strip()
        if not code:
            continue
        labeled.append((f"Code Screenshot {idx}", code))
    return labeled


def run_notebook_code(nb):
    code_cells = [cell for cell in nb["cells"] if cell["cell_type"] == "code"]
    namespace = {"__name__": "__main__"}
    captured = io.StringIO()
    with contextlib.redirect_stdout(captured):
        for cell in code_cells:
            code = "".join(cell["source"]).strip()
            if code:
                exec(compile(code, "<notebook-cell>", "exec"), namespace)
    return captured.getvalue()


def split_output(output_text):
    text = output_text.strip()
    if not text:
        return [("Output Screenshot 1", "No output captured.")]

    sections = []
    current = []
    count = 1
    for line in text.splitlines():
        if line.startswith("Decision Tree") or line.startswith("KNN") or line.startswith("Base Entropy"):
            if current:
                sections.append((f"Output Screenshot {count}", "\n".join(current).strip()))
                count += 1
                current = []
        current.append(line)
        if len(current) >= 22:
            sections.append((f"Output Screenshot {count}", "\n".join(current).strip()))
            count += 1
            current = []
    if current:
        sections.append((f"Output Screenshot {count}", "\n".join(current).strip()))
    return sections


def emu(value_inches):
    return int(value_inches * 914400)


def add_paragraph(text):
    return (
        "<w:p>"
        "<w:r><w:t xml:space=\"preserve\">"
        + escape(text) +
        "</w:t></w:r>"
        "</w:p>"
    )


def add_image_paragraph(rid, cx, cy):
    return f"""
<w:p>
  <w:r>
    <w:drawing>
      <wp:inline distT="0" distB="0" distL="0" distR="0"
        xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"
        xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
        xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"
        xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
        <wp:extent cx="{cx}" cy="{cy}"/>
        <wp:docPr id="{rid[3:]}" name="Picture {rid[3:]}"/>
        <a:graphic>
          <a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">
            <pic:pic>
              <pic:nvPicPr>
                <pic:cNvPr id="{rid[3:]}" name="{rid}.png"/>
                <pic:cNvPicPr/>
              </pic:nvPicPr>
              <pic:blipFill>
                <a:blip r:embed="{rid}"/>
                <a:stretch><a:fillRect/></a:stretch>
              </pic:blipFill>
              <pic:spPr>
                <a:xfrm><a:off x="0" y="0"/><a:ext cx="{cx}" cy="{cy}"/></a:xfrm>
                <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
              </pic:spPr>
            </pic:pic>
          </a:graphicData>
        </a:graphic>
      </wp:inline>
    </w:drawing>
  </w:r>
</w:p>
"""


def build_docx(image_paths):
    media_dir = OUT_DIR / "word" / "media"
    if media_dir.exists():
        for item in media_dir.rglob("*"):
            if item.is_file():
                item.unlink()
    media_dir.mkdir(parents=True, exist_ok=True)

    rel_entries = []
    body_entries = []

    body_entries.append(add_paragraph("DS Lab Task 7 Report"))
    body_entries.append(add_paragraph("Code screenshots and output screenshots"))

    for idx, image_path in enumerate(image_paths, start=1):
        rid = f"rId{idx}"
        media_name = f"image{idx}.png"
        target = media_dir / media_name
        target.write_bytes(image_path.read_bytes())
        rel_entries.append(
            f'<Relationship Id="{rid}" '
            'Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" '
            f'Target="media/{media_name}"/>'
        )

        with Image.open(image_path) as img:
            w, h = img.size
        max_width_in = 6.2
        scale = min(1.0, (max_width_in * 220) / w)
        cx = emu((w / 220) * scale)
        cy = emu((h / 220) * scale)

        body_entries.append(add_paragraph(image_path.stem.replace("_", " ")))
        body_entries.append(add_image_paragraph(rid, cx, cy))

    document_xml = f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:wpc="http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas"
 xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
 xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math"
 xmlns:v="urn:schemas-microsoft-com:vml"
 xmlns:wp14="http://schemas.microsoft.com/office/word/2010/wordprocessingDrawing"
 xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"
 xmlns:w10="urn:schemas-microsoft-com:office:word"
 xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
 xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml"
 xmlns:wpg="http://schemas.microsoft.com/office/word/2010/wordprocessingGroup"
 xmlns:wpi="http://schemas.microsoft.com/office/word/2010/wordprocessingInk"
 xmlns:wne="http://schemas.microsoft.com/office/word/2006/wordml"
 xmlns:wps="http://schemas.microsoft.com/office/word/2010/wordprocessingShape"
 mc:Ignorable="w14 wp14">
  <w:body>
    {''.join(body_entries)}
    <w:sectPr>
      <w:pgSz w:w="12240" w:h="15840"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="708" w:footer="708" w:gutter="0"/>
    </w:sectPr>
  </w:body>
</w:document>
"""

    rels_xml = f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rIdDoc" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>
"""

    doc_rels_xml = f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  {''.join(rel_entries)}
</Relationships>
"""

    content_types_xml = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Default Extension="png" ContentType="image/png"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
</Types>
"""

    core_xml = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties"
 xmlns:dc="http://purl.org/dc/elements/1.1/"
 xmlns:dcterms="http://purl.org/dc/terms/"
 xmlns:dcmitype="http://purl.org/dc/dcmitype/"
 xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:title>DS Lab Task 7 Report</dc:title>
  <dc:creator>Codex</dc:creator>
</cp:coreProperties>
"""

    app_xml = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"
 xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">
  <Application>Codex</Application>
</Properties>
"""

    with zipfile.ZipFile(DOCX_PATH, "w", compression=zipfile.ZIP_DEFLATED) as zf:
        zf.writestr("[Content_Types].xml", content_types_xml)
        zf.writestr("_rels/.rels", rels_xml)
        zf.writestr("word/document.xml", document_xml)
        zf.writestr("word/_rels/document.xml.rels", doc_rels_xml)
        zf.writestr("docProps/core.xml", core_xml)
        zf.writestr("docProps/app.xml", app_xml)
        for item in media_dir.glob("*.png"):
            zf.write(item, f"word/media/{item.name}")


def main():
    nb = load_notebook()
    image_paths = []

    for idx, (title, code) in enumerate(extract_code_blocks(nb), start=1):
        out = OUT_DIR / f"code_screenshot_{idx}.png"
        make_text_image(title, code, out, body_width=88)
        image_paths.append(out)

    output_text = run_notebook_code(nb)
    for idx, (title, section) in enumerate(split_output(output_text), start=1):
        out = OUT_DIR / f"output_screenshot_{idx}.png"
        make_text_image(title, section, out, body_width=95)
        image_paths.append(out)

    build_docx(image_paths)
    print(f"Created: {DOCX_PATH}")


if __name__ == "__main__":
    main()
