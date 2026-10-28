import os
import sys
import json
import re
import urllib.parse
import subprocess
from PIL import Image

import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import parse_xml, OxmlElement
from docx.oxml.ns import nsdecls, qn

# ==========================================
# DESIGN SYSTEM & COLOR PALETTE
# ==========================================
COLOR_NAVY = RGBColor(27, 54, 93)       # #1B365D Primary Executive Header
COLOR_TEAL = RGBColor(43, 84, 126)      # #2B547E Secondary Header
COLOR_SLATE_DARK = RGBColor(45, 55, 72)  # #2D3748 Body Text
COLOR_MUTED = RGBColor(100, 116, 139)   # #64748B Captions / Subtitles
COLOR_BLUE_ACCENT = RGBColor(37, 99, 235)# #2563EB Code / Link / Highlight

HEX_NAVY = "1B365D"
HEX_TEAL = "2B547E"
HEX_SLATE_DARK = "2D3748"
HEX_LIGHT_BG = "F8FAFC"
HEX_BORDER = "CBD5E1"
HEX_ACCENT_BLUE = "2563EB"
HEX_CALLOUT_BG = "F0F9FF"
HEX_CALLOUT_BORDER = "0284C7"
HEX_CODE_BG = "F1F5F9"
HEX_QUOTE_BORDER = "C5A059"

# ==========================================
# STRICT OPENXML SCHEMA HELPER FUNCTIONS
# ==========================================

def format_cell(cell, bg_color=None, top_pad=140, bottom_pad=140, left_pad=180, right_pad=180, border_left_color=None, border_left_sz="24"):
    """
    Formations a cell with strict OpenXML schema element order:
    <w:tcPr>
      <w:tcBorders>...</w:tcBorders>
      <w:shd .../>
      <w:tcMar>...</w:tcMar>
    </w:tcPr>
    """
    tcPr = cell._tc.get_or_add_tcPr()
    tcPr.clear() # clear any existing out-of-order properties
    
    # 1. tcBorders
    if border_left_color:
        borders = parse_xml(f'''
            <w:tcBorders {nsdecls("w")}>
                <w:top w:val="none"/>
                <w:left w:val="single" w:sz="{border_left_sz}" w:space="0" w:color="{border_left_color}"/>
                <w:bottom w:val="none"/>
                <w:right w:val="none"/>
            </w:tcBorders>
        ''')
        tcPr.append(borders)
    elif border_left_color is False:
        borders = parse_xml(f'''
            <w:tcBorders {nsdecls("w")}>
                <w:top w:val="single" w:sz="4" w:space="0" w:color="{HEX_BORDER}"/>
                <w:left w:val="single" w:sz="18" w:space="0" w:color="{HEX_ACCENT_BLUE}"/>
                <w:bottom w:val="single" w:sz="4" w:space="0" w:color="{HEX_BORDER}"/>
                <w:right w:val="single" w:sz="4" w:space="0" w:color="{HEX_BORDER}"/>
            </w:tcBorders>
        ''')
        tcPr.append(borders)
        
    # 2. shd (shading background)
    if bg_color:
        shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{bg_color}"/>')
        tcPr.append(shd)
        
    # 3. tcMar (cell margins / padding)
    tcMar = parse_xml(f'''
        <w:tcMar {nsdecls("w")}>
            <w:top w:w="{top_pad}" w:type="dxa"/>
            <w:bottom w:w="{bottom_pad}" w:type="dxa"/>
            <w:left w:w="{left_pad}" w:type="dxa"/>
            <w:right w:w="{right_pad}" w:type="dxa"/>
        </w:tcMar>
    ''')
    tcPr.append(tcMar)

def format_table(table, border_color=HEX_BORDER):
    """
    Format table properties according to strict OpenXML schema order:
    <w:tblPr>
      <w:tblW w:w="5000" w:type="pct"/>
      <w:tblBorders>...</w:tblBorders>
    </w:tblPr>
    """
    tblPr = table._tbl.tblPr
    
    # 1. tblW
    tblW = parse_xml(f'<w:tblW {nsdecls("w")} w:w="5000" w:type="pct"/>')
    tblPr.append(tblW)
    
    # 2. tblBorders
    borders = parse_xml(f'''
        <w:tblBorders {nsdecls("w")}>
            <w:top w:val="single" w:sz="4" w:space="0" w:color="{border_color}"/>
            <w:left w:val="none"/>
            <w:bottom w:val="single" w:sz="4" w:space="0" w:color="{border_color}"/>
            <w:right w:val="none"/>
            <w:insideH w:val="single" w:sz="4" w:space="0" w:color="{border_color}"/>
            <w:insideV w:val="none"/>
        </w:tblBorders>
    ''')
    tblPr.append(borders)

def make_row_header(row):
    """Mark a table row as a repeating header row."""
    trPr = row._tr.get_or_add_trPr()
    trPr.append(parse_xml(f'<w:tblHeader {nsdecls("w")}/>'))

def prevent_row_split(row):
    """Prevent table row from splitting across pages."""
    trPr = row._tr.get_or_add_trPr()
    trPr.append(parse_xml(f'<w:cantSplit {nsdecls("w")}/>'))

def add_callout_box(doc, title, content_inlines, border_color=HEX_CALLOUT_BORDER, bg_color=HEX_CALLOUT_BG, icon="💡"):
    """Add a beautifully styled Callout Box card."""
    table = doc.add_table(rows=1, cols=1)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    cell = table.cell(0, 0)
    
    # Format table & cell
    tblW = parse_xml(f'<w:tblW {nsdecls("w")} w:w="5000" w:type="pct"/>')
    table._tbl.tblPr.append(tblW)
    format_cell(cell, bg_color=bg_color, top_pad=160, bottom_pad=160, left_pad=220, right_pad=220, border_left_color=border_color)
    
    p = cell.paragraphs[0]
    p.paragraph_format.space_before = Pt(2)
    p.paragraph_format.space_after = Pt(4)
    p.paragraph_format.line_spacing = 1.15
    
    r_icon = p.add_run(f"{icon}  ")
    r_icon.font.size = Pt(11)
    r_title = p.add_run(f"{title}\n")
    r_title.bold = True
    r_title.font.color.rgb = COLOR_NAVY
    r_title.font.size = Pt(10.5)
    
    if isinstance(content_inlines, str):
        r_body = p.add_run(content_inlines)
        r_body.font.size = Pt(10)
        r_body.font.color.rgb = COLOR_SLATE_DARK
    else:
        render_inlines_to_paragraph(content_inlines, p, base_size=10, base_color=COLOR_SLATE_DARK)
    
    sp = doc.add_paragraph()
    sp.paragraph_format.space_before = Pt(0)
    sp.paragraph_format.space_after = Pt(6)

def add_code_block(doc, code_text):
    """Add a shaded, monospaced code block container."""
    table = doc.add_table(rows=1, cols=1)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    cell = table.cell(0, 0)
    
    tblW = parse_xml(f'<w:tblW {nsdecls("w")} w:w="5000" w:type="pct"/>')
    table._tbl.tblPr.append(tblW)
    format_cell(cell, bg_color=HEX_CODE_BG, top_pad=140, bottom_pad=140, left_pad=200, right_pad=200, border_left_color=False)
    
    p = cell.paragraphs[0]
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(0)
    p.paragraph_format.line_spacing = 1.05
    
    lines = code_text.splitlines()
    for idx, line in enumerate(lines):
        r = p.add_run(line + ("\n" if idx < len(lines) - 1 else ""))
        r.font.name = "Consolas"
        r.font.size = Pt(9.5)
        r.font.color.rgb = RGBColor(15, 23, 42)
        
    sp = doc.add_paragraph()
    sp.paragraph_format.space_before = Pt(0)
    sp.paragraph_format.space_after = Pt(6)

def add_toc_field(doc):
    """Insert native Word Table of Contents XML field with valid run hierarchy."""
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(12)
    p.paragraph_format.space_after = Pt(12)
    
    r1 = p.add_run()
    r1._r.append(parse_xml(f'<w:fldChar {nsdecls("w")} w:fldCharType="begin"/>'))
    
    r2 = p.add_run()
    r2._r.append(parse_xml(f'<w:instrText {nsdecls("w")} xml:space="preserve"> TOC \\o "1-3" \\h \\z \\u </w:instrText>'))
    
    r3 = p.add_run()
    r3._r.append(parse_xml(f'<w:fldChar {nsdecls("w")} w:fldCharType="separate"/>'))
    
    r4 = p.add_run()
    r4._r.append(parse_xml(f'<w:fldChar {nsdecls("w")} w:fldCharType="end"/>'))

def add_header_footer(doc, doc_title):
    """Add professional page numbers and running header with valid OpenXML schema."""
    section = doc.sections[0]
    section.top_margin = Inches(1.0)
    section.bottom_margin = Inches(1.0)
    section.left_margin = Inches(1.0)
    section.right_margin = Inches(1.0)
    
    # Running Header
    header = section.header
    hp = header.paragraphs[0]
    hp.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    hrun = hp.add_run(doc_title)
    hrun.font.name = "Calibri"
    hrun.font.size = Pt(8.5)
    hrun.font.color.rgb = COLOR_MUTED
    
    # Running Footer (Page Numbers)
    footer = section.footer
    fp = footer.paragraphs[0]
    fp.alignment = WD_ALIGN_PARAGRAPH.CENTER
    
    frun = fp.add_run("Page ")
    frun.font.name = "Calibri"
    frun.font.size = Pt(9)
    frun.font.color.rgb = COLOR_MUTED
    
    # Wrap field characters inside individual run elements!
    r1 = fp.add_run()
    r1._r.append(parse_xml(f'<w:fldChar {nsdecls("w")} w:fldCharType="begin"/>'))
    
    r2 = fp.add_run()
    r2._r.append(parse_xml(f'<w:instrText {nsdecls("w")} xml:space="preserve"> PAGE </w:instrText>'))
    
    r3 = fp.add_run()
    r3._r.append(parse_xml(f'<w:fldChar {nsdecls("w")} w:fldCharType="separate"/>'))
    
    r4 = fp.add_run()
    r4._r.append(parse_xml(f'<w:fldChar {nsdecls("w")} w:fldCharType="end"/>'))
    
    for r in (r1, r2, r3, r4):
        r.font.name = "Calibri"
        r.font.size = Pt(9)
        r.font.color.rgb = COLOR_MUTED

# ==========================================
# INLINE AST PARSER
# ==========================================
def stringify_inlines(inlines):
    res = []
    for item in inlines:
        t = item.get('t')
        c = item.get('c')
        if t == 'Str':
            res.append(c)
        elif t in ('Space', 'SoftBreak'):
            res.append(' ')
        elif t == 'LineBreak':
            res.append('\n')
        elif t in ('Strong', 'Emph', 'Underline', 'Strikeout'):
            res.append(stringify_inlines(c))
        elif t == 'Code':
            res.append(c[1])
        elif t == 'Link':
            res.append(stringify_inlines(c[1]))
    return ''.join(res)

def render_inlines_to_paragraph(inlines, paragraph, is_bold=False, is_italic=False, is_code=False, base_size=11, base_color=COLOR_SLATE_DARK):
    for item in inlines:
        t = item.get('t')
        c = item.get('c')
        
        if t == 'Str':
            r = paragraph.add_run(c)
            r.bold = is_bold
            r.italic = is_italic
            r.font.name = "Consolas" if is_code else "Calibri"
            r.font.size = Pt(base_size - 1 if is_code else base_size)
            r.font.color.rgb = COLOR_BLUE_ACCENT if is_code else base_color
            if is_code:
                r._r.get_or_add_rPr().append(parse_xml(f'<w:shd {nsdecls("w")} w:fill="F1F5F9"/>'))
                
        elif t in ('Space', 'SoftBreak'):
            r = paragraph.add_run(' ')
            r.font.size = Pt(base_size)
            
        elif t == 'LineBreak':
            paragraph.add_run().add_break()
            
        elif t == 'Strong':
            render_inlines_to_paragraph(c, paragraph, is_bold=True, is_italic=is_italic, is_code=is_code, base_size=base_size, base_color=base_color)
            
        elif t == 'Emph':
            render_inlines_to_paragraph(c, paragraph, is_bold=is_bold, is_italic=True, is_code=is_code, base_size=base_size, base_color=base_color)
            
        elif t == 'Code':
            code_text = c[1]
            r = paragraph.add_run(code_text)
            r.font.name = "Consolas"
            r.font.size = Pt(base_size - 1)
            r.font.color.rgb = RGBColor(15, 23, 42)
            r._r.get_or_add_rPr().append(parse_xml(f'<w:shd {nsdecls("w")} w:fill="F1F5F9"/>'))
            
        elif t == 'Link':
            link_text = stringify_inlines(c[1])
            r = paragraph.add_run(link_text)
            r.font.color.rgb = COLOR_BLUE_ACCENT
            r.underline = True
            r.font.size = Pt(base_size)
            
        elif t == 'RawInline':
            raw_fmt, raw_str = c[0], c[1]
            if raw_str.lower() in ('<br>', '<br/>', '<br />'):
                paragraph.add_run().add_break()

# ==========================================
# IMAGE & REQUISITION RESOLVER
# ==========================================
def resolve_image_path(src_url, base_dir):
    cleaned = src_url.strip()
    if cleaned.startswith('<') and cleaned.endswith('>'):
        cleaned = cleaned[1:-1].strip()
    cleaned = urllib.parse.unquote(cleaned)
    
    p1 = os.path.normpath(os.path.join(base_dir, cleaned))
    if os.path.exists(p1):
        return p1
    return None

def process_image_element(doc, alt_text, img_src, base_dir, figure_counter):
    real_path = resolve_image_path(img_src, base_dir)
    if real_path:
        try:
            p_img = doc.add_paragraph()
            p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p_img.paragraph_format.space_before = Pt(8)
            p_img.paragraph_format.space_after = Pt(2)
            
            run_img = p_img.add_run()
            with Image.open(real_path) as img:
                w, h = img.size
                target_width = min(6.0, w / 96.0)
                
            run_img.add_picture(real_path, width=Inches(target_width))
            
            figure_counter[0] += 1
            p_cap = doc.add_paragraph()
            p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p_cap.paragraph_format.space_before = Pt(2)
            p_cap.paragraph_format.space_after = Pt(12)
            
            rcap = p_cap.add_run(f"Figure {figure_counter[0]} : {alt_text if alt_text else 'Illustration'}")
            rcap.font.name = "Calibri"
            rcap.font.size = Pt(9.5)
            rcap.font.italic = True
            rcap.font.color.rgb = COLOR_MUTED
            return True
        except Exception as e:
            print(f"Warning: Image insertion error: {e}")
            
    add_callout_box(
        doc,
        title=f"📷 FIGURE / CAPTURE D'ÉCRAN : {alt_text}",
        content_inlines=f"Fichier image non localisé : {img_src}",
        border_color="EAB308",
        bg_color="FEFCE8",
        icon="🖼️"
    )
    return False

# ==========================================
# MAIN AST BLOCK PROCESSOR
# ==========================================
def convert_pandoc_ast_to_docx(ast_data, doc, base_dir):
    blocks = ast_data.get('blocks', [])
    figure_counter = [0]
    
    for b in blocks:
        b_type = b.get('t')
        b_cnt = b.get('c')
        
        # 1. HEADERS
        if b_type == 'Header':
            level = b_cnt[0]
            inlines = b_cnt[2]
            header_text = stringify_inlines(inlines)
            
            p = doc.add_paragraph()
            p.paragraph_format.keep_with_next = True
            
            if level == 1:
                p.paragraph_format.space_before = Pt(20)
                p.paragraph_format.space_after = Pt(8)
                render_inlines_to_paragraph(inlines, p, is_bold=True, base_size=18, base_color=COLOR_NAVY)
                pBdr = parse_xml(f'<w:pBdr {nsdecls("w")}><w:bottom w:val="single" w:sz="12" w:space="4" w:color="{HEX_NAVY}"/></w:pBdr>')
                p._p.get_or_add_pPr().append(pBdr)
                
            elif level == 2:
                p.paragraph_format.space_before = Pt(14)
                p.paragraph_format.space_after = Pt(6)
                render_inlines_to_paragraph(inlines, p, is_bold=True, base_size=14, base_color=COLOR_TEAL)
                
            elif level == 3:
                p.paragraph_format.space_before = Pt(10)
                p.paragraph_format.space_after = Pt(4)
                render_inlines_to_paragraph(inlines, p, is_bold=True, base_size=12, base_color=COLOR_SLATE_DARK)
                
            else:
                p.paragraph_format.space_before = Pt(8)
                p.paragraph_format.space_after = Pt(3)
                render_inlines_to_paragraph(inlines, p, is_bold=True, is_italic=True, base_size=11, base_color=RGBColor(71, 85, 105))
                
            if "TABLE DES MATIÈRES" in header_text.upper():
                add_toc_field(doc)
                
        # 2. PARAGRAPHS & IMAGES
        elif b_type in ('Para', 'Plain'):
            inlines = b_cnt
            text_str = stringify_inlines(inlines).strip()
            
            if len(inlines) == 1 and inlines[0].get('t') == 'Image':
                img_ast = inlines[0].get('c')
                alt = stringify_inlines(img_ast[1])
                src = img_ast[2][0]
                process_image_element(doc, alt, src, base_dir, figure_counter)
                continue
                
            if text_str.startswith("[IMAGE REQUISITION :") and text_str.endswith("]"):
                req_title = text_str[19:-1].strip()
                add_callout_box(
                    doc,
                    title="📷 EMPLACEMENT REQUISITION D'IMAGE / FIGURE",
                    content_inlines=req_title,
                    border_color=HEX_CALLOUT_BORDER,
                    bg_color=HEX_CALLOUT_BG,
                    icon="📌"
                )
                continue
                
            p = doc.add_paragraph()
            p.paragraph_format.space_before = Pt(0)
            p.paragraph_format.space_after = Pt(6)
            p.paragraph_format.line_spacing = 1.15
            render_inlines_to_paragraph(inlines, p, base_size=11, base_color=COLOR_SLATE_DARK)
            
        # 3. TABLES
        elif b_type == 'Table':
            head = b_cnt[3]
            bodies = b_cnt[4]
            head_rows = head[1] if len(head) > 1 else []
            body_rows = []
            for body in bodies:
                body_rows.extend(body[2])
                
            all_rows = head_rows + body_rows
            if not all_rows:
                continue
                
            num_rows = len(all_rows)
            num_cols = max(len(row[1]) for row in all_rows)
            
            table = doc.add_table(rows=num_rows, cols=num_cols)
            table.alignment = WD_TABLE_ALIGNMENT.CENTER
            format_table(table, border_color=HEX_BORDER)
            
            for r_i, row_ast in enumerate(all_rows):
                row_obj = table.rows[r_i]
                prevent_row_split(row_obj)
                is_header = (r_i < len(head_rows))
                if is_header:
                    make_row_header(row_obj)
                    
                cells_ast = row_ast[1]
                for c_i, cell_ast in enumerate(cells_ast):
                    if c_i >= num_cols:
                        break
                    cell_obj = row_obj.cells[c_i]
                    
                    bg_col = HEX_NAVY if is_header else (HEX_LIGHT_BG if (r_i % 2 == 1) else "FFFFFF")
                    format_cell(cell_obj, bg_color=bg_col, top_pad=140, bottom_pad=140, left_pad=180, right_pad=180)
                    
                    cell_blocks = cell_ast[4]
                    cell_p = cell_obj.paragraphs[0]
                    cell_p.paragraph_format.space_before = Pt(0)
                    cell_p.paragraph_format.space_after = Pt(2)
                    cell_p.paragraph_format.line_spacing = 1.1
                    
                    base_c = RGBColor(255, 255, 255) if is_header else COLOR_SLATE_DARK
                    for cb_idx, cb in enumerate(cell_blocks):
                        if cb_idx > 0:
                            cell_p = cell_obj.add_paragraph()
                        cb_type = cb.get('t')
                        cb_cnt = cb.get('c')
                        if cb_type in ('Para', 'Plain'):
                            render_inlines_to_paragraph(cb_cnt, cell_p, is_bold=is_header, base_size=10, base_color=base_c)
                        else:
                            cell_p.add_run(stringify_inlines([cb]))
                            
            sp = doc.add_paragraph()
            sp.paragraph_format.space_after = Pt(8)
            
        # 4. CODE BLOCKS
        elif b_type == 'CodeBlock':
            code_text = b_cnt[1]
            add_code_block(doc, code_text)
            
        # 5. BLOCKQUOTES
        elif b_type == 'BlockQuote':
            bq_blocks = b_cnt
            table = doc.add_table(rows=1, cols=1)
            table.alignment = WD_TABLE_ALIGNMENT.CENTER
            cell = table.cell(0, 0)
            
            tblW = parse_xml(f'<w:tblW {nsdecls("w")} w:w="5000" w:type="pct"/>')
            table._tbl.tblPr.append(tblW)
            format_cell(cell, bg_color="F9FAFB", top_pad=160, bottom_pad=160, left_pad=240, right_pad=200, border_left_color=HEX_QUOTE_BORDER)
            
            cell_p = cell.paragraphs[0]
            for qb_idx, qb in enumerate(bq_blocks):
                if qb_idx > 0:
                    cell_p = cell.add_paragraph()
                cell_p.paragraph_format.space_after = Pt(4)
                qb_t = qb.get('t')
                qb_c = qb.get('c')
                if qb_t in ('Para', 'Plain'):
                    render_inlines_to_paragraph(qb_c, cell_p, is_italic=True, base_size=10.5, base_color=RGBColor(51, 65, 85))
                else:
                    cell_p.add_run(stringify_inlines([qb]))
                    
            sp = doc.add_paragraph()
            sp.paragraph_format.space_after = Pt(6)
            
        # 6. LISTS
        elif b_type in ('BulletList', 'OrderedList'):
            items = b_cnt[1] if b_type == 'OrderedList' else b_cnt
            style_name = 'List Number' if b_type == 'OrderedList' else 'List Bullet'
            
            for item in items:
                for sub_b in item:
                    sub_t = sub_b.get('t')
                    sub_c = sub_b.get('c')
                    p = doc.add_paragraph(style=style_name)
                    p.paragraph_format.space_after = Pt(3)
                    p.paragraph_format.line_spacing = 1.15
                    if sub_t in ('Para', 'Plain'):
                        render_inlines_to_paragraph(sub_c, p, base_size=11, base_color=COLOR_SLATE_DARK)
                    else:
                        p.add_run(stringify_inlines([sub_b]))
                        
        # 7. HORIZONTAL RULE
        elif b_type == 'HorizontalRule':
            p = doc.add_paragraph()
            p.paragraph_format.space_before = Pt(12)
            p.paragraph_format.space_after = Pt(12)
            pBdr = parse_xml(f'<w:pBdr {nsdecls("w")}><w:bottom w:val="single" w:sz="6" w:space="1" w:color="{HEX_BORDER}"/></w:pBdr>')
            p._p.get_or_add_pPr().append(pBdr)

def convert_md_file(md_filepath, output_docx_filepath=None):
    if not os.path.exists(md_filepath):
        raise FileNotFoundError(f"Source markdown file not found: {md_filepath}")
        
    if not output_docx_filepath:
        output_docx_filepath = os.path.splitext(md_filepath)[0] + ".docx"
        
    base_dir = os.path.dirname(os.path.abspath(md_filepath))
    doc_title = os.path.basename(md_filepath)
    
    print(f"Parsing '{md_filepath}' via Pandoc AST...")
    res = subprocess.run(
        ['pandoc', '-f', 'markdown', '-t', 'json', md_filepath],
        capture_output=True, text=True, encoding='utf-8'
    )
    if res.returncode != 0:
        raise RuntimeError(f"Pandoc error: {res.stderr}")
        
    ast_data = json.loads(res.stdout)
    doc = docx.Document()
    
    add_header_footer(doc, doc_title="RAPPORT DE STAGE DE FIN D'ÉTUDES (SFE) — MOGADOR CHOICE MARKETPLACE")
    convert_pandoc_ast_to_docx(ast_data, doc, base_dir)
    
    doc.save(output_docx_filepath)
    print(f"🎉 Success! Beautiful Word document saved to:\n  {output_docx_filepath}")

if __name__ == "__main__":
    target = r"c:\Users\EL KADIRI\Desktop\essaouira\rapport_SFE_MASTER.md"
    if len(sys.argv) > 1:
        target = sys.argv[1]
    convert_md_file(target)
