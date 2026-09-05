# DPDP Document Conversion Guide

This folder contains scripts to convert DPDP documents from PDF and DOCX formats to Markdown (.md) for better analysis and documentation.

## Available Scripts

### 1. Bash Script (Recommended for macOS/Linux)
**File:** `convert-to-markdown.sh`

**Dependencies:**
```bash
brew install pandoc poppler
```

**Usage:**
```bash
cd "docs/IIRM-749_Data-Security-NFR-DPDP/IIRM-8015_DPDP"
chmod +x convert-to-markdown.sh
./convert-to-markdown.sh
```

### 2. Python Script (Cross-platform)
**File:** `convert-to-markdown.py`

**Dependencies:**
```bash
pip install python-docx pypandoc pymupdf
```

**Usage:**
```bash
cd "docs/IIRM-749_Data-Security-NFR-DPDP/IIRM-8015_DPDP"
python3 convert-to-markdown.py
```

## What Gets Converted

The scripts will convert the following files:
- ✅ `DPDP Act - Detailed Rules.docx` → `DPDP Act - Detailed Rules.md`
- ✅ `DPDP_Sections_Explanations.docx` → `DPDP_Sections_Explanations.md`
- ✅ `DPDP Rules.pdf` → `DPDP Rules.md`

**Note:** `DPDP_All_Rules_Applicability.xlsx` (Excel file) requires manual conversion or separate handling.

## Excel to Markdown Conversion

For the Excel file, you have these options:

### Option 1: Manual Export
1. Open `DPDP_All_Rules_Applicability.xlsx` in Excel/Numbers
2. Save As → CSV format
3. Use online tool: https://tableconvert.com/ to convert CSV to Markdown

### Option 2: Command Line (with csvkit)
```bash
brew install csvkit
in2csv "DPDP_All_Rules_Applicability.xlsx" | csvlook
```

## Post-Conversion Cleanup

After conversion, you may need to:

1. **Review formatting:** PDF conversions especially may need manual cleanup
2. **Fix tables:** Complex tables may not convert perfectly
3. **Add structure:** Add proper headings and sections if needed
4. **Verify content:** Ensure no content was lost during conversion

## Troubleshooting

### "command not found: pandoc"
```bash
brew install pandoc
```

### "command not found: pdftotext"
```bash
brew install poppler
```

### Python dependencies issues
```bash
pip3 install --upgrade python-docx pypandoc pymupdf
```

### Pandoc not found by pypandoc
```bash
# Install pandoc first
brew install pandoc

# Then verify
python3 -c "import pypandoc; print(pypandoc.get_pandoc_version())"
```

## Output Format

Converted Markdown files will include:
- ✅ Document title
- ✅ Source file reference
- ✅ Conversion timestamp
- ✅ Original content with basic formatting
- ✅ Metadata header

## Expected Results

After running the conversion script, you should see:
```
DPDP Act - Detailed Rules.md
DPDP_Sections_Explanations.md
DPDP Rules.md
```

These `.md` files can then be read and analyzed by GitHub Copilot and other tools.

---

**Last Updated:** 21 January 2026
