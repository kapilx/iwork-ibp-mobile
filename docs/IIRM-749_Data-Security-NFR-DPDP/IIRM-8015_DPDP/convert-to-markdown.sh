#!/bin/bash

################################################################################
# DPDP Document Converter
# Converts PDF and DOCX files to Markdown format
# 
# Requirements:
#   - pandoc: brew install pandoc
#   - pdftotext: brew install poppler
#
# Usage:
#   chmod +x convert-to-markdown.sh
#   ./convert-to-markdown.sh
################################################################################

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}DPDP Document to Markdown Converter${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Check if required tools are installed
check_dependencies() {
    echo -e "${YELLOW}Checking dependencies...${NC}"
    
    MISSING_DEPS=()
    
    if ! command -v pandoc &> /dev/null; then
        MISSING_DEPS+=("pandoc")
    fi
    
    if ! command -v pdftotext &> /dev/null; then
        MISSING_DEPS+=("pdftotext (from poppler)")
    fi
    
    if [ ${#MISSING_DEPS[@]} -ne 0 ]; then
        echo -e "${RED}❌ Missing dependencies:${NC}"
        for dep in "${MISSING_DEPS[@]}"; do
            echo -e "   - $dep"
        done
        echo ""
        echo -e "${YELLOW}Install missing dependencies:${NC}"
        echo -e "   brew install pandoc poppler"
        echo ""
        exit 1
    fi
    
    echo -e "${GREEN}✅ All dependencies installed${NC}"
    echo ""
}

# Convert DOCX to Markdown
convert_docx() {
    local input_file="$1"
    local output_file="${input_file%.docx}.md"
    
    echo -e "${BLUE}Converting DOCX: ${input_file}${NC}"
    
    if pandoc "$input_file" -f docx -t markdown -o "$output_file" --wrap=none --extract-media=./images; then
        echo -e "${GREEN}✅ Created: ${output_file}${NC}"
        return 0
    else
        echo -e "${RED}❌ Failed to convert: ${input_file}${NC}"
        return 1
    fi
}

# Convert PDF to Markdown (via text extraction)
convert_pdf() {
    local input_file="$1"
    local output_file="${input_file%.pdf}.md"
    local temp_txt="${input_file%.pdf}.txt"
    
    echo -e "${BLUE}Converting PDF: ${input_file}${NC}"
    
    # Extract text from PDF
    if pdftotext -layout "$input_file" "$temp_txt" 2>/dev/null; then
        # Convert to markdown with basic formatting
        {
            echo "# $(basename "${input_file%.pdf}")"
            echo ""
            echo "**Source:** $(basename "$input_file")"
            echo "**Converted:** $(date '+%Y-%m-%d %H:%M:%S')"
            echo ""
            echo "---"
            echo ""
            cat "$temp_txt"
        } > "$output_file"
        
        # Cleanup temp file
        rm "$temp_txt"
        
        echo -e "${GREEN}✅ Created: ${output_file}${NC}"
        return 0
    else
        echo -e "${RED}❌ Failed to convert: ${input_file}${NC}"
        [ -f "$temp_txt" ] && rm "$temp_txt"
        return 1
    fi
}

# Main conversion logic
main() {
    check_dependencies
    
    local total_files=0
    local converted_files=0
    local failed_files=0
    
    echo -e "${YELLOW}Starting conversion...${NC}"
    echo ""
    
    # Convert all DOCX files
    for file in *.docx; do
        if [ -f "$file" ]; then
            total_files=$((total_files + 1))
            if convert_docx "$file"; then
                converted_files=$((converted_files + 1))
            else
                failed_files=$((failed_files + 1))
            fi
            echo ""
        fi
    done
    
    # Convert all PDF files
    for file in *.pdf; do
        if [ -f "$file" ]; then
            total_files=$((total_files + 1))
            if convert_pdf "$file"; then
                converted_files=$((converted_files + 1))
            else
                failed_files=$((failed_files + 1))
            fi
            echo ""
        fi
    done
    
    # Summary
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}Conversion Summary${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo -e "Total files:      ${total_files}"
    echo -e "${GREEN}✅ Converted:     ${converted_files}${NC}"
    if [ $failed_files -gt 0 ]; then
        echo -e "${RED}❌ Failed:        ${failed_files}${NC}"
    fi
    echo ""
    
    if [ $converted_files -gt 0 ]; then
        echo -e "${GREEN}📁 Markdown files created in current directory${NC}"
        echo -e "${YELLOW}Note: PDF conversions may require manual cleanup for better formatting${NC}"
    fi
}

# Run main function
main
