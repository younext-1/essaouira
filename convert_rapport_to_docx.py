#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script de conversion du rapport de stage Markdown -> Word (.docx)
Rapport : MOGADOR Choice Marketplace - Stage de Fin d'Études
Auteur : Conversion automatisée
"""

import re
import os
from docx import Document
from docx.shared import Inches, Pt, Cm, RGBColor, Emu
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_LINE_SPACING
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.enum.section import WD_ORIENT
from docx.oxml.ns import qn, nsdecls
from docx.oxml import parse_xml

# ─── Paths ───────────────────────────────────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MD_FILE = os.path.join(BASE_DIR, "rapport_SFE_MASTER.md")
OUTPUT_FILE = os.path.join(BASE_DIR, "Rapport_SFE_MOGADOR_Choice_v2.docx")
IMG_DIR = os.path.join(BASE_DIR, "rappor", "img")


def set_cell_shading(cell, color_hex):
    """Apply background color to a table cell."""
    shading = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{color_hex}" w:val="clear"/>')
    cell._tc.get_or_add_tcPr().append(shading)


def set_cell_border(cell, **kwargs):
    """Set cell borders."""
    tc = cell._tc
    tcPr = tc.get_or_add_tcPr()
    tcBorders = parse_xml(f'<w:tcBorders {nsdecls("w")}></w:tcBorders>')
    for edge, val in kwargs.items():
        element = parse_xml(
            f'<w:{edge} {nsdecls("w")} w:val="{val.get("val", "single")}" '
            f'w:sz="{val.get("sz", "4")}" w:space="0" '
            f'w:color="{val.get("color", "000000")}"/>'
        )
        tcBorders.append(element)
    tcPr.append(tcBorders)


def set_paragraph_spacing(paragraph, before=0, after=0, line_spacing=1.15):
    """Set paragraph spacing."""
    pf = paragraph.paragraph_format
    pf.space_before = Pt(before)
    pf.space_after = Pt(after)
    pf.line_spacing = line_spacing


def add_horizontal_rule(doc):
    """Add a thin horizontal line separator."""
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    pPr = p._p.get_or_add_pPr()
    pBdr = parse_xml(
        f'<w:pBdr {nsdecls("w")}>'
        f'<w:bottom w:val="single" w:sz="6" w:space="1" w:color="B0B0B0"/>'
        f'</w:pBdr>'
    )
    pPr.append(pBdr)


def create_styles(doc):
    """Create custom styles for the document."""
    styles = doc.styles

    # ── Normal text style ──
    normal = styles['Normal']
    normal.font.name = 'Times New Roman'
    normal.font.size = Pt(12)
    normal.font.color.rgb = RGBColor(0x1A, 0x1A, 0x1A)
    normal.paragraph_format.line_spacing = 1.5
    normal.paragraph_format.space_after = Pt(6)
    normal.paragraph_format.first_line_indent = Cm(0)

    # ── Heading 1 - Chapter titles ──
    h1 = styles['Heading 1']
    h1.font.name = 'Times New Roman'
    h1.font.size = Pt(18)
    h1.font.bold = True
    h1.font.color.rgb = RGBColor(0x1B, 0x3A, 0x5C)  # Dark navy blue
    h1.paragraph_format.space_before = Pt(36)
    h1.paragraph_format.space_after = Pt(18)
    h1.paragraph_format.keep_with_next = True
    h1.paragraph_format.page_break_before = True

    # ── Heading 2 - Main sections ──
    h2 = styles['Heading 2']
    h2.font.name = 'Times New Roman'
    h2.font.size = Pt(15)
    h2.font.bold = True
    h2.font.color.rgb = RGBColor(0x2C, 0x55, 0x82)  # Medium blue
    h2.paragraph_format.space_before = Pt(24)
    h2.paragraph_format.space_after = Pt(12)
    h2.paragraph_format.keep_with_next = True

    # ── Heading 3 - Subsections ──
    h3 = styles['Heading 3']
    h3.font.name = 'Times New Roman'
    h3.font.size = Pt(13)
    h3.font.bold = True
    h3.font.color.rgb = RGBColor(0x3D, 0x6B, 0x99)  # Lighter blue
    h3.paragraph_format.space_before = Pt(18)
    h3.paragraph_format.space_after = Pt(8)
    h3.paragraph_format.keep_with_next = True

    # ── Heading 4 - Sub-subsections ──
    h4 = styles['Heading 4']
    h4.font.name = 'Times New Roman'
    h4.font.size = Pt(12)
    h4.font.bold = True
    h4.font.italic = True
    h4.font.color.rgb = RGBColor(0x4A, 0x4A, 0x4A)
    h4.paragraph_format.space_before = Pt(12)
    h4.paragraph_format.space_after = Pt(6)

    # ── Create Quote style ──
    try:
        quote_style = styles.add_style('QuoteStyle', 1)  # 1 = paragraph style
    except:
        quote_style = styles['QuoteStyle']
    quote_style.font.name = 'Times New Roman'
    quote_style.font.size = Pt(11)
    quote_style.font.italic = True
    quote_style.font.color.rgb = RGBColor(0x3D, 0x3D, 0x3D)
    quote_style.paragraph_format.left_indent = Cm(1.5)
    quote_style.paragraph_format.right_indent = Cm(1)
    quote_style.paragraph_format.space_before = Pt(6)
    quote_style.paragraph_format.space_after = Pt(6)
    quote_style.paragraph_format.line_spacing = 1.3

    # ── Code Block style ──
    try:
        code_style = styles.add_style('CodeBlock', 1)
    except:
        code_style = styles['CodeBlock']
    code_style.font.name = 'Consolas'
    code_style.font.size = Pt(9)
    code_style.font.color.rgb = RGBColor(0x1E, 0x1E, 0x1E)
    code_style.paragraph_format.left_indent = Cm(0.5)
    code_style.paragraph_format.space_before = Pt(2)
    code_style.paragraph_format.space_after = Pt(2)
    code_style.paragraph_format.line_spacing = 1.0

    # ── Figure caption style ──
    try:
        fig_style = styles.add_style('FigureCaption', 1)
    except:
        fig_style = styles['FigureCaption']
    fig_style.font.name = 'Times New Roman'
    fig_style.font.size = Pt(10)
    fig_style.font.italic = True
    fig_style.font.color.rgb = RGBColor(0x55, 0x55, 0x55)
    fig_style.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
    fig_style.paragraph_format.space_before = Pt(4)
    fig_style.paragraph_format.space_after = Pt(12)


def setup_document(doc):
    """Configure document margins and page setup."""
    for section in doc.sections:
        section.top_margin = Cm(2.5)
        section.bottom_margin = Cm(2.5)
        section.left_margin = Cm(2.5)
        section.right_margin = Cm(2.5)
        section.header_distance = Cm(1.25)
        section.footer_distance = Cm(1.25)

    # Add page numbers in footer
    footer = doc.sections[0].footer
    footer.is_linked_to_previous = False
    footer_para = footer.paragraphs[0]
    footer_para.alignment = WD_ALIGN_PARAGRAPH.CENTER
    
    # Add PAGE field
    run = footer_para.add_run()
    fldChar1 = parse_xml(f'<w:fldChar {nsdecls("w")} w:fldCharType="begin"/>')
    run._r.append(fldChar1)
    
    run2 = footer_para.add_run()
    instrText = parse_xml(f'<w:instrText {nsdecls("w")} xml:space="preserve"> PAGE </w:instrText>')
    run2._r.append(instrText)
    
    run3 = footer_para.add_run()
    fldChar2 = parse_xml(f'<w:fldChar {nsdecls("w")} w:fldCharType="end"/>')
    run3._r.append(fldChar2)
    
    for r in [run, run2, run3]:
        r.font.name = 'Times New Roman'
        r.font.size = Pt(10)
        r.font.color.rgb = RGBColor(0x66, 0x66, 0x66)


def add_cover_page(doc):
    """Create a professional cover page."""
    # Top institutional header
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    set_paragraph_spacing(p, before=0, after=4)
    run = p.add_run("ROYAUME DU MAROC")
    run.bold = True
    run.font.size = Pt(16)
    run.font.name = 'Times New Roman'
    run.font.color.rgb = RGBColor(0x1B, 0x3A, 0x5C)

    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    set_paragraph_spacing(p, before=0, after=4)
    run = p.add_run("UNIVERSITÉ CADI AYYAD")
    run.bold = True
    run.font.size = Pt(14)
    run.font.name = 'Times New Roman'
    run.font.color.rgb = RGBColor(0x2C, 0x55, 0x82)

    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    set_paragraph_spacing(p, before=0, after=4)
    run = p.add_run("ÉCOLE SUPÉRIEURE DE TECHNOLOGIE D'ESSAOUIRA (ESTE)")
    run.bold = True
    run.font.size = Pt(13)
    run.font.name = 'Times New Roman'
    run.font.color.rgb = RGBColor(0x2C, 0x55, 0x82)

    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    set_paragraph_spacing(p, before=0, after=12)
    run = p.add_run("DÉPARTEMENT GÉNIE INFORMATIQUE")
    run.bold = True
    run.font.size = Pt(12)
    run.font.name = 'Times New Roman'
    run.font.color.rgb = RGBColor(0x3D, 0x6B, 0x99)

    add_horizontal_rule(doc)

    # Logos placeholder
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    set_paragraph_spacing(p, before=12, after=12)
    run = p.add_run("[Logos : Université Cadi Ayyad — ESTE — Ministère de l'Artisanat]")
    run.font.size = Pt(9)
    run.font.italic = True
    run.font.color.rgb = RGBColor(0x99, 0x99, 0x99)

    add_horizontal_rule(doc)

    # Title block
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    set_paragraph_spacing(p, before=24, after=6)
    run = p.add_run("RAPPORT DE STAGE DE FIN D'ÉTUDES")
    run.bold = True
    run.font.size = Pt(20)
    run.font.name = 'Times New Roman'
    run.font.color.rgb = RGBColor(0x1B, 0x3A, 0x5C)

    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    set_paragraph_spacing(p, before=4, after=4)
    run = p.add_run("En vue de l'obtention du Diplôme Universitaire de Technologie (DUT)")
    run.bold = True
    run.font.size = Pt(12)
    run.font.name = 'Times New Roman'

    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    set_paragraph_spacing(p, before=0, after=16)
    run = p.add_run("Spécialité : Génie Informatique (GI)")
    run.bold = True
    run.font.size = Pt(12)
    run.font.name = 'Times New Roman'

    add_horizontal_rule(doc)

    # Subject
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    set_paragraph_spacing(p, before=12, after=4)
    run = p.add_run("SUJET DU PROJET :")
    run.bold = True
    run.font.size = Pt(12)
    run.font.name = 'Times New Roman'
    run.font.color.rgb = RGBColor(0x1B, 0x3A, 0x5C)

    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    set_paragraph_spacing(p, before=4, after=16)
    run = p.add_run(
        "Conception, Architecture et Implémentation d'une Plateforme Web\n"
        "E-Commerce Marketplace de Haute Performance pour la Digitalisation\n"
        "et la Commercialisation de l'Artisanat d'Essaouira :\n"
        "\"MOGADOR Choice Marketplace\""
    )
    run.bold = True
    run.font.size = Pt(14)
    run.font.name = 'Times New Roman'
    run.font.color.rgb = RGBColor(0x8B, 0x45, 0x13)  # Thuya brown

    add_horizontal_rule(doc)

    # Info table
    info_items = [
        ("Réalisé par :", "Étudiant en Génie Informatique (ESTE)"),
        ("Encadrant Professionnel :", "M. BOURAGBA Mustapha (Directeur Provincial de l'Artisanat d'Essaouira)"),
        ("Encadrant Pédagogique :", "Professeur du Département Génie Informatique (ESTE)"),
        ("Organisme d'Accueil :", "Direction Provinciale de l'Artisanat d'Essaouira – CIA"),
        ("Stack Technologique :", "Next.js, Supabase (PostgreSQL / RLS / Auth), Tailwind CSS, TypeScript"),
        ("Année Universitaire :", "2023 / 2024"),
    ]

    table = doc.add_table(rows=len(info_items), cols=2)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    for i, (label, value) in enumerate(info_items):
        cell_label = table.cell(i, 0)
        cell_value = table.cell(i, 1)
        
        # Label
        p = cell_label.paragraphs[0]
        run = p.add_run(label)
        run.bold = True
        run.font.size = Pt(11)
        run.font.name = 'Times New Roman'
        run.font.color.rgb = RGBColor(0x1B, 0x3A, 0x5C)
        
        # Value
        p = cell_value.paragraphs[0]
        run = p.add_run(value)
        run.font.size = Pt(11)
        run.font.name = 'Times New Roman'

        # Set cell widths
        cell_label.width = Cm(5)
        cell_value.width = Cm(11)

    # Style the table - no visible borders, subtle look
    for row in table.rows:
        for cell in row.cells:
            set_cell_border(cell,
                top={"val": "nil"},
                bottom={"val": "nil"},
                left={"val": "nil"},
                right={"val": "nil"}
            )

    doc.add_page_break()


def parse_markdown_table(lines):
    """Parse a markdown table into rows of cells."""
    rows = []
    for line in lines:
        line = line.strip()
        if line.startswith('|') and not re.match(r'^\|[\s:-]+\|$', line):
            # Split by | and filter empty
            cells = [c.strip() for c in line.split('|')]
            cells = [c for c in cells if c != '']
            # Skip separator rows
            if cells and not all(re.match(r'^[\s:-]+$', c) for c in cells):
                rows.append(cells)
    return rows


def add_styled_table(doc, rows):
    """Add a professionally styled table to the document."""
    if not rows or len(rows) < 1:
        return

    num_cols = max(len(row) for row in rows)
    table = doc.add_table(rows=len(rows), cols=num_cols)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    
    # Calculate available width
    available_width = Cm(16)  # page width minus margins

    for i, row_data in enumerate(rows):
        for j in range(num_cols):
            cell = table.cell(i, j)
            cell_text = row_data[j] if j < len(row_data) else ""
            
            # Clean markdown bold markers
            clean_text = re.sub(r'\*\*(.*?)\*\*', r'\1', cell_text)
            clean_text = re.sub(r'`(.*?)`', r'\1', clean_text)
            clean_text = re.sub(r'_(.*?)_', r'\1', clean_text)
            
            p = cell.paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.LEFT
            
            # Check if text was bold in original
            is_bold = '**' in cell_text or i == 0
            
            run = p.add_run(clean_text)
            run.font.name = 'Times New Roman'
            run.font.size = Pt(9.5)
            
            if i == 0:
                # Header row
                run.bold = True
                run.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
                set_cell_shading(cell, "1B3A5C")
            else:
                if is_bold:
                    run.bold = True
                # Alternate row coloring
                if i % 2 == 0:
                    set_cell_shading(cell, "F0F4F8")
                else:
                    set_cell_shading(cell, "FFFFFF")
            
            # Borders
            set_cell_border(cell,
                top={"val": "single", "sz": "4", "color": "D0D5DD"},
                bottom={"val": "single", "sz": "4", "color": "D0D5DD"},
                left={"val": "single", "sz": "4", "color": "D0D5DD"},
                right={"val": "single", "sz": "4", "color": "D0D5DD"},
            )

    # Set paragraph spacing in all cells
    for row in table.rows:
        for cell in row.cells:
            for para in cell.paragraphs:
                set_paragraph_spacing(para, before=2, after=2, line_spacing=1.0)

    doc.add_paragraph()  # spacing after table


def add_code_block(doc, code_lines, language=""):
    """Add a formatted code block to the document."""
    # Add a subtle header if language is specified
    if language:
        p = doc.add_paragraph()
        run = p.add_run(f"  Code ({language}) :")
        run.font.name = 'Times New Roman'
        run.font.size = Pt(9)
        run.font.italic = True
        run.font.color.rgb = RGBColor(0x66, 0x66, 0x66)
        set_paragraph_spacing(p, before=6, after=2)

    # Create a single-cell table for code block with background
    table = doc.add_table(rows=1, cols=1)
    table.alignment = WD_TABLE_ALIGNMENT.LEFT
    cell = table.cell(0, 0)
    set_cell_shading(cell, "F5F5F5")
    set_cell_border(cell,
        top={"val": "single", "sz": "4", "color": "CCCCCC"},
        bottom={"val": "single", "sz": "4", "color": "CCCCCC"},
        left={"val": "single", "sz": "6", "color": "3D6B99"},
        right={"val": "single", "sz": "4", "color": "CCCCCC"},
    )

    # Clear default paragraph
    cell.paragraphs[0].clear()

    code_text = '\n'.join(code_lines)
    p = cell.paragraphs[0]
    run = p.add_run(code_text)
    run.font.name = 'Consolas'
    run.font.size = Pt(8.5)
    run.font.color.rgb = RGBColor(0x1E, 0x1E, 0x1E)
    set_paragraph_spacing(p, before=4, after=4, line_spacing=1.0)

    doc.add_paragraph()  # spacing after code


def try_add_image(doc, img_path, caption=""):
    """Try to add an image to the document."""
    # Clean path from markdown syntax
    img_path = img_path.strip()
    img_path = img_path.strip('<>')
    img_path = img_path.replace('%20', ' ')
    # Remove trailing ) that may be left from markdown syntax
    if img_path.endswith(')') and '(' not in img_path.split('/')[-1].rsplit(')', 1)[0]:
        img_path = img_path[:-1]
    
    # Build full path using os.path.normpath for consistent separators
    full_path = os.path.normpath(os.path.join(BASE_DIR, img_path))
    
    if os.path.exists(full_path):
        try:
            p = doc.add_paragraph()
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            run = p.add_run()
            run.add_picture(full_path, width=Inches(5.5))
            set_paragraph_spacing(p, before=8, after=4)
            
            if caption:
                p_cap = doc.add_paragraph()
                p_cap.style = doc.styles['FigureCaption']
                run = p_cap.add_run(caption)
                run.font.name = 'Times New Roman'
                run.font.size = Pt(10)
                run.font.italic = True
                run.font.color.rgb = RGBColor(0x55, 0x55, 0x55)
            return True
        except Exception as e:
            print(f"  ⚠ Erreur insertion image {full_path}: {e}")
            return False
    else:
        print(f"  ⚠ Image non trouvée: {full_path}")
        return False


def add_rich_text_paragraph(doc, text, style='Normal', alignment=None, is_bullet=False, bullet_level=0):
    """Add a paragraph with rich text formatting (bold, italic, code)."""
    p = doc.add_paragraph()
    
    if is_bullet:
        p.style = doc.styles['List Bullet']
        # Indent level
        if bullet_level > 0:
            p.paragraph_format.left_indent = Cm(1.27 * (bullet_level + 1))
    else:
        try:
            p.style = doc.styles[style]
        except:
            p.style = doc.styles['Normal']
    
    if alignment is not None:
        p.alignment = alignment
    
    # Parse inline formatting: **bold**, *italic*, `code`, _italic_
    # Pattern to match formatting tokens
    pattern = r'(\*\*.*?\*\*|`[^`]+`|_[^_]+_|\*[^*]+\*)'
    parts = re.split(pattern, text)
    
    for part in parts:
        if not part:
            continue
        if part.startswith('**') and part.endswith('**'):
            run = p.add_run(part[2:-2])
            run.bold = True
            run.font.name = 'Times New Roman'
            run.font.size = Pt(12) if style == 'Normal' else None
        elif part.startswith('`') and part.endswith('`'):
            run = p.add_run(part[1:-1])
            run.font.name = 'Consolas'
            run.font.size = Pt(10)
            run.font.color.rgb = RGBColor(0x8B, 0x45, 0x13)
        elif (part.startswith('_') and part.endswith('_')) or (part.startswith('*') and part.endswith('*') and not part.startswith('**')):
            run = p.add_run(part[1:-1])
            run.italic = True
            run.font.name = 'Times New Roman'
        else:
            run = p.add_run(part)
            run.font.name = 'Times New Roman'
    
    return p


def process_markdown(doc, md_content):
    """Process the markdown content and add it to the document."""
    lines = md_content.split('\n')
    i = 0
    skip_cover = True  # Skip the first few lines (cover page handled separately)
    in_code_block = False
    code_lines = []
    code_language = ""
    in_table = False
    table_lines = []
    in_blockquote = False
    blockquote_text = ""
    passed_toc = False
    
    # Track which cover sections to skip
    cover_sections = {
        "ROYAUME DU MAROC", "UNIVERSITÉ CADI AYYAD",
        "ÉCOLE SUPÉRIEURE DE TECHNOLOGIE D'ESSAOUIRA",
        "RAPPORT DE STAGE DE FIN D'ÉTUDES",
        "SUJET DU PROJET"
    }
    
    while i < len(lines):
        line = lines[i]
        stripped = line.strip()
        
        # ── Skip empty lines at the start ──
        if skip_cover and (
            stripped == '' or
            stripped == '---' or
            stripped.startswith('<br>') or
            stripped.startswith('[IMAGE REQUISITION') or
            any(s in stripped for s in cover_sections) or
            stripped.startswith('**DÉPARTEMENT') or
            stripped.startswith('**En vue') or
            stripped.startswith('**Spécialité') or
            stripped.startswith('- **Réalisé') or
            stripped.startswith('- **Encadrant') or
            stripped.startswith('- **Organisme') or
            stripped.startswith('- **Stack') or
            stripped.startswith('- **Année') or
            (stripped.startswith('#') and any(s in stripped for s in cover_sections)) or
            (stripped.startswith('##') and 'Conception, Architecture' in stripped)
        ):
            i += 1
            continue
        
        # Stop skipping at DÉDICACE
        if 'DÉDICACE' in stripped:
            skip_cover = False

        # ── Code blocks ──
        if stripped.startswith('```'):
            if in_code_block:
                # End of code block
                add_code_block(doc, code_lines, code_language)
                code_lines = []
                code_language = ""
                in_code_block = False
            else:
                # Start of code block
                in_code_block = True
                code_language = stripped[3:].strip()
                code_lines = []
            i += 1
            continue
        
        if in_code_block:
            code_lines.append(line.rstrip())
            i += 1
            continue

        # ── Tables ──
        if stripped.startswith('|'):
            if not in_table:
                in_table = True
                table_lines = []
            table_lines.append(stripped)
            i += 1
            continue
        elif in_table:
            # End of table
            rows = parse_markdown_table(table_lines)
            if rows:
                add_styled_table(doc, rows)
            in_table = False
            table_lines = []
            # Don't increment i, process current line

        # ── Blockquotes ──
        if stripped.startswith('>'):
            quote_text = re.sub(r'^>\s*', '', stripped)
            quote_text = quote_text.strip('_').strip()
            if quote_text:
                p = doc.add_paragraph()
                p.style = doc.styles['QuoteStyle']
                # Parse formatting in quote
                clean_quote = re.sub(r'\*\*(.*?)\*\*', r'\1', quote_text)
                run = p.add_run(clean_quote)
                run.font.name = 'Times New Roman'
                run.font.size = Pt(11)
                run.font.italic = True
                run.font.color.rgb = RGBColor(0x3D, 0x3D, 0x3D)
            i += 1
            continue

        # ── Horizontal rules ──
        if stripped == '---' or stripped == '***':
            add_horizontal_rule(doc)
            i += 1
            continue

        # ── HTML breaks ──
        if stripped == '<br>' or stripped == '<br/>':
            doc.add_paragraph()
            i += 1
            continue

        # ── IMAGE REQUISITION placeholders ──
        if stripped.startswith('[IMAGE REQUISITION'):
            p = doc.add_paragraph()
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            clean_text = stripped.strip('[]')
            run = p.add_run(f"[{clean_text}]")
            run.font.size = Pt(9)
            run.font.italic = True
            run.font.color.rgb = RGBColor(0xAA, 0xAA, 0xAA)
            set_paragraph_spacing(p, before=6, after=6)
            i += 1
            continue

        # ── Images ![alt](path) or ![alt](<path>) ──
        # Handle angle-bracket paths that may contain parentheses in filename
        img_match = re.match(r'!\[(.*?)\]\(<([^>]+)>\)', stripped)
        if not img_match:
            img_match = re.match(r'!\[(.*?)\]\(([^)]+)\)', stripped)
        if img_match:
            alt_text = img_match.group(1)
            img_path = img_match.group(2)
            try_add_image(doc, img_path, alt_text)
            i += 1
            continue

        # ── Figure captions (_Figure X.X : ..._) ──
        if stripped.startswith('_Figure') and stripped.endswith('_'):
            p = doc.add_paragraph()
            p.style = doc.styles['FigureCaption']
            caption_text = stripped.strip('_')
            run = p.add_run(caption_text)
            run.font.name = 'Times New Roman'
            run.font.size = Pt(10)
            run.font.italic = True
            run.font.color.rgb = RGBColor(0x55, 0x55, 0x55)
            i += 1
            continue

        # ── Tableau captions (_Tableau X.X : ..._) ──
        if stripped.startswith('_Tableau') and stripped.endswith('_'):
            p = doc.add_paragraph()
            p.style = doc.styles['FigureCaption']
            run = p.add_run(stripped.strip('_'))
            run.font.name = 'Times New Roman'
            run.font.size = Pt(10)
            run.font.italic = True
            run.font.color.rgb = RGBColor(0x55, 0x55, 0x55)
            i += 1
            continue

        # ── Headings ──
        heading_match = re.match(r'^(#{1,4})\s+(.*)', stripped)
        if heading_match:
            level = len(heading_match.group(1))
            text = heading_match.group(2).strip('*').strip()
            
            # Clean markdown bold markers from heading
            text = re.sub(r'\*\*(.*?)\*\*', r'\1', text)
            
            # Skip TOC section
            if 'TABLE DES MATIÈRES' in text:
                # Skip until next heading at same or higher level
                i += 1
                while i < len(lines):
                    next_stripped = lines[i].strip()
                    next_heading = re.match(r'^(#{1,2})\s+', next_stripped)
                    if next_heading and 'LISTE DES FIGURES' in next_stripped:
                        break
                    i += 1
                continue
            
            # Map heading levels
            if level == 1:
                heading = doc.add_heading(text, level=1)
            elif level == 2:
                heading = doc.add_heading(text, level=2)
            elif level == 3:
                heading = doc.add_heading(text, level=3)
            else:
                heading = doc.add_heading(text, level=4)
            
            i += 1
            continue

        # ── Bullet points ──
        bullet_match = re.match(r'^(\s*)[-*]\s+(.*)', stripped)
        if bullet_match or re.match(r'^\s*[-*]\s+', line):
            # Determine indent level
            indent = len(line) - len(line.lstrip())
            bullet_level = indent // 2
            
            text = re.sub(r'^\s*[-*]\s+', '', line).strip()
            
            if text:
                add_rich_text_paragraph(doc, text, is_bullet=True, bullet_level=bullet_level)
            
            i += 1
            continue

        # ── Numbered lists ──
        numbered_match = re.match(r'^(\s*)\d+\.\s+(.*)', line)
        if numbered_match:
            text = numbered_match.group(2).strip()
            if text:
                p = doc.add_paragraph()
                p.style = doc.styles['List Number']
                # Parse inline formatting
                pattern = r'(\*\*.*?\*\*|`[^`]+`|_[^_]+_)'
                parts = re.split(pattern, text)
                for part in parts:
                    if not part:
                        continue
                    if part.startswith('**') and part.endswith('**'):
                        run = p.add_run(part[2:-2])
                        run.bold = True
                        run.font.name = 'Times New Roman'
                        run.font.size = Pt(12)
                    elif part.startswith('`') and part.endswith('`'):
                        run = p.add_run(part[1:-1])
                        run.font.name = 'Consolas'
                        run.font.size = Pt(10)
                        run.font.color.rgb = RGBColor(0x8B, 0x45, 0x13)
                    elif part.startswith('_') and part.endswith('_'):
                        run = p.add_run(part[1:-1])
                        run.italic = True
                        run.font.name = 'Times New Roman'
                    else:
                        run = p.add_run(part)
                        run.font.name = 'Times New Roman'
                        run.font.size = Pt(12)
            
            i += 1
            continue

        # ── TOC links (skip) ──
        if stripped.startswith('- [') and '](#' in stripped:
            i += 1
            continue

        # ── Empty lines ──
        if stripped == '':
            i += 1
            continue

        # ── Regular paragraphs ──
        if stripped:
            # Clean HTML tags
            text = stripped.replace('<br>', '\n').replace('<br/>', '\n')
            add_rich_text_paragraph(doc, text)

        i += 1


def main():
    """Main conversion function."""
    print("=" * 70)
    print("  Conversion du Rapport SFE MASTER → Word (.docx)")
    print("  MOGADOR Choice Marketplace")
    print("=" * 70)
    
    # Read markdown content
    print("\n📖 Lecture du fichier Markdown...")
    with open(MD_FILE, 'r', encoding='utf-8') as f:
        md_content = f.read()
    print(f"   ✓ {len(md_content)} caractères lus")
    
    # Create document
    print("\n📄 Création du document Word...")
    doc = Document()
    
    # Setup styles and document
    print("   🎨 Configuration des styles...")
    create_styles(doc)
    setup_document(doc)
    
    # Add cover page
    print("   📋 Génération de la page de garde...")
    add_cover_page(doc)
    
    # Process markdown content
    print("   📝 Conversion du contenu Markdown...")
    process_markdown(doc, md_content)
    
    # Save document
    print(f"\n💾 Sauvegarde du document: {OUTPUT_FILE}")
    doc.save(OUTPUT_FILE)
    
    file_size = os.path.getsize(OUTPUT_FILE) / 1024
    print(f"   ✓ Document sauvegardé ({file_size:.1f} Ko)")
    
    print("\n" + "=" * 70)
    print("  ✅ CONVERSION TERMINÉE AVEC SUCCÈS!")
    print(f"  📁 Fichier: {OUTPUT_FILE}")
    print("=" * 70)


if __name__ == "__main__":
    main()
