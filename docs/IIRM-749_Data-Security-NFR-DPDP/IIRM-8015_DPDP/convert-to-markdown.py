#!/usr/bin/env python3
"""
DPDP Document to Markdown Converter
Converts PDF and DOCX files to well-formatted Markdown

Requirements:
    pip install python-docx pypandoc pymupdf

Usage:
    python3 convert-to-markdown.py
"""

import os
import sys
from pathlib import Path
from datetime import datetime

def check_dependencies():
    """Check if required Python packages are installed"""
    missing = []
    
    try:
        import docx
    except ImportError:
        missing.append("python-docx")
    
    try:
        import pypandoc
    except ImportError:
        missing.append("pypandoc")
    
    try:
        import fitz  # PyMuPDF
    except ImportError:
        missing.append("pymupdf")
    
    if missing:
        print("❌ Missing dependencies:")
        for dep in missing:
            print(f"   - {dep}")
        print("\nInstall with:")
        print(f"   pip install {' '.join(missing)}")
        sys.exit(1)
    
    print("✅ All dependencies installed\n")

def convert_docx_to_markdown(docx_path):
    """Convert DOCX to Markdown using pypandoc"""
    try:
        import pypandoc
        
        output_path = docx_path.with_suffix('.md')
        print(f"🔄 Converting: {docx_path.name}")
        
        # Convert using pandoc
        markdown_content = pypandoc.convert_file(
            str(docx_path),
            'markdown',
            format='docx',
            extra_args=['--wrap=none', '--atx-headers']
        )
        
        # Add metadata header
        header = f"""# {docx_path.stem}

**Source File:** {docx_path.name}  
**Converted:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}  
**Type:** DPDP Act Documentation

---

"""
        
        # Write output
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(header + markdown_content)
        
        print(f"✅ Created: {output_path.name}\n")
        return True
        
    except Exception as e:
        print(f"❌ Failed to convert {docx_path.name}: {str(e)}\n")
        return False

def convert_pdf_to_markdown(pdf_path):
    """Convert PDF to Markdown using PyMuPDF"""
    try:
        import fitz  # PyMuPDF
        
        output_path = pdf_path.with_suffix('.md')
        print(f"🔄 Converting: {pdf_path.name}")
        
        # Open PDF
        doc = fitz.open(str(pdf_path))
        
        # Extract text with formatting
        markdown_content = []
        
        for page_num, page in enumerate(doc, 1):
            text = page.get_text("text")
            if text.strip():
                markdown_content.append(f"## Page {page_num}\n\n{text}\n")
        
        doc.close()
        
        # Add metadata header
        header = f"""# {pdf_path.stem}

**Source File:** {pdf_path.name}  
**Converted:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}  
**Type:** DPDP Act Documentation  
**Total Pages:** {len(doc)}

---

"""
        
        # Write output
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(header + '\n'.join(markdown_content))
        
        print(f"✅ Created: {output_path.name}")
        print(f"   Note: PDF conversion may require manual formatting cleanup\n")
        return True
        
    except Exception as e:
        print(f"❌ Failed to convert {pdf_path.name}: {str(e)}\n")
        return False

def main():
    """Main conversion function"""
    print("=" * 50)
    print("DPDP Document to Markdown Converter")
    print("=" * 50)
    print()
    
    check_dependencies()
    
    # Get current directory
    current_dir = Path.cwd()
    
    # Find all DOCX and PDF files
    docx_files = list(current_dir.glob("*.docx"))
    pdf_files = list(current_dir.glob("*.pdf"))
    
    total_files = len(docx_files) + len(pdf_files)
    
    if total_files == 0:
        print("⚠️  No DOCX or PDF files found in current directory")
        return
    
    print(f"Found {len(docx_files)} DOCX and {len(pdf_files)} PDF files\n")
    
    converted = 0
    failed = 0
    
    # Convert DOCX files
    for docx_file in docx_files:
        if convert_docx_to_markdown(docx_file):
            converted += 1
        else:
            failed += 1
    
    # Convert PDF files
    for pdf_file in pdf_files:
        if convert_pdf_to_markdown(pdf_file):
            converted += 1
        else:
            failed += 1
    
    # Summary
    print("=" * 50)
    print("Conversion Summary")
    print("=" * 50)
    print(f"Total files:  {total_files}")
    print(f"✅ Converted: {converted}")
    if failed > 0:
        print(f"❌ Failed:    {failed}")
    print()
    
    if converted > 0:
        print("📁 Markdown files created in current directory")
        print("⚠️  Please review converted files for formatting accuracy")

if __name__ == "__main__":
    main()
