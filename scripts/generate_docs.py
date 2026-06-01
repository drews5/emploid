import os
import sys
import re
import glob
from fpdf import FPDF

class EmploidPDF(FPDF):
    def __init__(self, doc_title=""):
        super().__init__()
        self.doc_title = doc_title
        # Set margins: left=20, top=25, right=20, bottom=20
        self.set_margins(20, 25, 20)
        self.set_auto_page_break(True, margin=20)

    def header(self):
        # Draw a top line in orange (Emploid Orange: #c85b24)
        self.set_draw_color(200, 91, 36)
        self.set_line_width(0.8)
        self.line(20, 15, 190, 15)
        
        # Header text
        self.set_y(8)
        self.set_x(20)
        self.set_font('helvetica', 'B', 8)
        self.set_text_color(200, 91, 36) # Orange
        self.cell(0, 10, 'EMPLOID REFERENCE DOCUMENTATION', border=0, align='L')
        
        self.set_x(20)
        self.set_text_color(18, 32, 53) # Navy: #122035
        self.cell(170, 10, self.doc_title.upper(), border=0, align='R')
        
        # Position cursor at y=25 for content
        self.set_y(25)

    def footer(self):
        # Position at 1.5 cm from bottom
        self.set_y(-15)
        self.set_font('helvetica', 'I', 8)
        self.set_text_color(100, 116, 139) # Slate grey
        
        # Center page number
        self.cell(0, 10, f'Page {self.page_no()}/{{nb}}', align='C')


def replace_unicode_chars(text):
    """Replace non-Latin-1 unicode characters with ASCII equivalents to prevent FPDF errors."""
    replacements = {
        '\u2013': '-',     # en-dash (–)
        '\u2014': '--',    # em-dash (—)
        '\u201c': '"',     # smart opening double quote (“)
        '\u201d': '"',     # smart closing double quote (”)
        '\u2018': "'",     # smart opening single quote (‘)
        '\u2019': "'",     # smart closing single quote (’)
        '\u2264': '<=',    # less than or equal (≤)
        '\u2265': '>=',    # greater than or equal (≥)
        '\u2192': '->',    # right arrow (→)
        '\u2713': '[yes]', # checkmark (✓)
    }
    for char, replacement in replacements.items():
        text = text.replace(char, replacement)
    
    # Strip any other characters that cannot be encoded as latin-1
    return text.encode('latin-1', 'ignore').decode('latin-1')


def clean_markdown_inline(text):
    """Strip inline markdown tags (bold, italic, code backticks) for clean text rendering in tables."""
    text = re.sub(r'\*\*(.*?)\*\*', r'\1', text)
    text = re.sub(r'\*(.*?)\*', r'\1', text)
    text = re.sub(r'`(.*?)`', r'\1', text)
    return text


def render_pdf_list_item(pdf, text, indent_spaces):
    """Render a bullet list item with custom bullet and indentation."""
    pdf.set_font('helvetica', '', 10)
    pdf.set_text_color(59, 78, 102) # Slate body color
    
    # Indentation: 0 or 2 spaces -> standard (5mm), >= 4 spaces -> sub-list (10mm)
    indent_width = 5 if indent_spaces < 4 else 10
    bullet_size = 1.5 if indent_spaces < 4 else 1.0
    
    x = pdf.get_x()
    pdf.set_x(x + indent_width)
    
    y = pdf.get_y()
    # Draw custom bullet
    if indent_spaces < 4:
        # Main bullet: orange square
        pdf.set_fill_color(200, 91, 36)
        pdf.set_draw_color(200, 91, 36)
        pdf.rect(x + indent_width, y + 2, bullet_size, bullet_size, 'DF')
    else:
        # Sub bullet: navy square outline
        pdf.set_fill_color(255, 255, 255)
        pdf.set_draw_color(12, 23, 40)
        pdf.rect(x + indent_width, y + 2.2, bullet_size, bullet_size, 'D')
        
    pdf.set_x(x + indent_width + 4)
    # Output content text
    pdf.multi_cell(0, 5.5, text, markdown=True)
    pdf.ln(1)


def render_pdf_table(pdf, rows):
    """Render a clean grid table with headers in Navy and alternating light-grey rows."""
    clean_rows = []
    for r in rows:
        # Skip markdown table divider rows (e.g., |---|---|)
        is_divider = all(re.match(r'^[-:\s]+$', cell.strip()) for cell in r)
        if not is_divider:
            clean_rows.append(r)
            
    if not clean_rows:
        return
        
    cols_count = len(clean_rows[0])
    
    # Calculate column widths relative to content length
    max_lens = [0] * cols_count
    for r in clean_rows:
        for j in range(min(cols_count, len(r))):
            max_lens[j] = max(max_lens[j], len(r[j]))
            
    total_len = sum(max_lens)
    if total_len == 0:
        col_widths = [170.0 / cols_count] * cols_count
    else:
        # Ensure a minimum column width of 12% of total printable width (170mm)
        min_width = 170.0 * 0.12
        remaining_width = 170.0 - (min_width * cols_count)
        
        col_widths = []
        for l in max_lens:
            ratio = l / total_len
            col_widths.append(min_width + remaining_width * ratio)
            
    pdf.set_line_width(0.2)
    pdf.set_draw_color(188, 201, 216) # Slate border
    
    # Remove 'border=1' from fpdf2.table() call to resolve TypeError
    with pdf.table(col_widths=col_widths, text_align="LEFT") as table:
        for i, row in enumerate(clean_rows):
            row_cells = table.row()
            if i == 0:
                # Header row
                pdf.set_font('helvetica', 'B', 9)
                pdf.set_text_color(255, 255, 255)
                pdf.set_fill_color(12, 23, 40) # Navy
            else:
                # Data row
                pdf.set_font('helvetica', '', 9)
                pdf.set_text_color(59, 78, 102)
                # Alternating row backgrounds
                if i % 2 == 1:
                    pdf.set_fill_color(255, 255, 255)
                else:
                    pdf.set_fill_color(245, 247, 251) # Light paper
                    
            while len(row) < cols_count:
                row.append("")
                
            for cell_text in row:
                cleaned_text = clean_markdown_inline(cell_text.strip())
                row_cells.cell(cleaned_text)
                
    pdf.ln(4)


def compile_markdown_to_pdf(md_path, pdf_path):
    """Parses a Markdown file and renders a styled PDF using FPDF2."""
    print(f"Compiling: {os.path.basename(md_path)} -> {os.path.basename(pdf_path)}")
    
    with open(md_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
        
    # Replace non-Latin-1 characters to avoid encoding exceptions
    lines = [replace_unicode_chars(line) for line in lines]
        
    doc_title = "Emploid Documentation"
    for line in lines:
        if line.startswith("# "):
            doc_title = line[2:].strip()
            break
            
    pdf = EmploidPDF(doc_title)
    pdf.alias_nb_pages()
    pdf.add_page()
    pdf.set_font('helvetica', '', 10)
    
    # State tracking
    in_code_block = False
    code_lines = []
    in_table = False
    table_rows = []
    paragraph_buffer = []
    
    def flush_paragraph():
        nonlocal paragraph_buffer
        if paragraph_buffer:
            text = " ".join(paragraph_buffer).strip()
            
            pdf.set_font('helvetica', '', 10)
            pdf.set_text_color(59, 78, 102) # Slate body text
            pdf.multi_cell(0, 6, text, markdown=True)
            pdf.ln(3)
            paragraph_buffer = []

    i = 0
    while i < len(lines):
        line = lines[i]
        line_stripped = line.rstrip()
        
        # 1. Code Block state
        if in_code_block:
            if line_stripped.strip().startswith("```"):
                in_code_block = False
                
                pdf.set_font('courier', '', 8.5)
                pdf.set_text_color(18, 32, 53) # Navy text
                pdf.set_fill_color(245, 247, 251) # Cool grey paper bg
                pdf.set_draw_color(188, 201, 216) # Slate borders
                
                code_text = "\n".join(code_lines)
                pdf.multi_cell(0, 4.5, code_text, border=1, fill=True)
                pdf.ln(3)
                code_lines = []
            else:
                code_lines.append(line_stripped)
            i += 1
            continue
            
        if line_stripped.strip().startswith("```"):
            flush_paragraph()
            in_code_block = True
            code_lines = []
            i += 1
            continue

        # 2. Table state
        if in_table:
            if line_stripped.startswith("|"):
                cells = [c.strip() for c in line_stripped.split('|')]
                if cells[0] == '':
                    cells = cells[1:]
                if cells and cells[-1] == '':
                    cells = cells[:-1]
                table_rows.append(cells)
                i += 1
                continue
            else:
                in_table = False
                render_pdf_table(pdf, table_rows)
                table_rows = []
                # Re-evaluate line in standard state
                continue

        if line_stripped.startswith("|"):
            flush_paragraph()
            in_table = True
            table_rows = []
            cells = [c.strip() for c in line_stripped.split('|')]
            if cells[0] == '':
                cells = cells[1:]
            if cells and cells[-1] == '':
                cells = cells[:-1]
            table_rows.append(cells)
            i += 1
            continue

        # 3. Document Headers & Structural Elements
        
        # Document Title (# Title)
        if line_stripped.startswith("# "):
            flush_paragraph()
            title_text = line_stripped[2:].strip()
            pdf.ln(5)
            pdf.set_font('helvetica', 'B', 18)
            pdf.set_text_color(12, 23, 40) # Navy
            pdf.cell(0, 10, title_text, border=0, ln=1)
            
            # Signature Orange Underline
            pdf.set_draw_color(200, 91, 36)
            pdf.set_line_width(1.5)
            y = pdf.get_y()
            pdf.line(20, y + 1, 90, y + 1)
            pdf.ln(8)
            i += 1
            continue

        # Section Header (## Title)
        if line_stripped.startswith("## "):
            flush_paragraph()
            header_text = line_stripped[3:].strip()
            pdf.ln(4)
            # Prevent page orphan section headers: if close to bottom of page, add page break
            if pdf.get_y() > 250:
                pdf.add_page()
            pdf.set_font('helvetica', 'B', 12)
            pdf.set_text_color(200, 91, 36) # Orange
            pdf.cell(0, 8, header_text, border=0, ln=1)
            pdf.ln(2)
            i += 1
            continue

        # Subsection Header (### Title)
        if line_stripped.startswith("### "):
            flush_paragraph()
            subheader_text = line_stripped[4:].strip()
            pdf.ln(2)
            if pdf.get_y() > 250:
                pdf.add_page()
            pdf.set_font('helvetica', 'B', 10.5)
            pdf.set_text_color(12, 23, 40) # Navy
            pdf.cell(0, 7, subheader_text, border=0, ln=1)
            pdf.ln(1)
            i += 1
            continue

        # Horizontal Rule (---)
        if line_stripped == "---":
            flush_paragraph()
            pdf.ln(3)
            pdf.set_draw_color(188, 201, 216) # Slate line
            pdf.set_line_width(0.4)
            y = pdf.get_y()
            pdf.line(20, y, 190, y)
            pdf.ln(5)
            i += 1
            continue

        # Bullet List Item
        list_match = re.match(r"^(\s*)([-*])\s+(.*)$", line_stripped)
        if list_match:
            flush_paragraph()
            leading_spaces = len(list_match.group(1))
            item_text = list_match.group(3).strip()
            render_pdf_list_item(pdf, item_text, leading_spaces)
            i += 1
            continue

        # Blank Line (Paragraph Break)
        if not line_stripped.strip():
            flush_paragraph()
            i += 1
            continue

        # Text Accumulator
        paragraph_buffer.append(line_stripped)
        i += 1

    # Final cleanup flushes
    flush_paragraph()
    if in_table:
        render_pdf_table(pdf, table_rows)
        
    pdf.output(pdf_path)


def main():
    # Setup paths
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    src_dir = os.path.join(base_dir, "docs", "src")
    out_dir = os.path.join(base_dir, "docs")
    
    os.makedirs(out_dir, exist_ok=True)
    
    print(f"Searching for Markdown files in: {src_dir}")
    md_files = glob.glob(os.path.join(src_dir, "*.md"))
    
    if not md_files:
        print("Error: No markdown files found in docs/src/.")
        sys.exit(1)
        
    for md_path in md_files:
        filename = os.path.basename(md_path)
        pdf_name = filename.replace(".md", ".pdf")
        pdf_name = "Emploid_" + pdf_name # E.g., Emploid_Philosophy_and_Overview.pdf
        pdf_path = os.path.join(out_dir, pdf_name)
        
        try:
            compile_markdown_to_pdf(md_path, pdf_path)
        except Exception as e:
            print(f"Failed to compile {filename}: {e}")
            import traceback
            traceback.print_exc()

    # Cleanup source Markdown files to ensure the directory contains PDFs only
    import shutil
    try:
        shutil.rmtree(src_dir)
        print("Cleaned up source Markdown files successfully.")
    except Exception as e:
        print(f"Warning: Failed to cleanup source Markdown folder: {e}")

    print("\nAll PDFs compiled successfully! Saved to 'docs/' directory.")


if __name__ == "__main__":
    main()
