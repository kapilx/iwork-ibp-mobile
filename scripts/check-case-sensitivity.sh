#!/bin/bash

# Case-sensitivity checker for monorepo
# This script checks for potential case-sensitivity issues that could cause problems on Linux

echo "🔍 Checking for case-sensitivity issues (simulating Linux behavior)..."

CASE_ISSUES=0

# Function to check if import path case exactly matches actual file case
check_exact_case_match() {
    local file="$1"
    local import_path="$2"
    local dir=$(dirname "$file")
    
    # Convert relative path to absolute
    local resolved_path=$(cd "$dir" && python3 -c "import os; print(os.path.abspath('$import_path'))" 2>/dev/null || echo "")
    
    if [ -z "$resolved_path" ]; then
        return 0
    fi
    
    # Check if path exists (case-insensitive on macOS)
    if [ ! -e "$resolved_path" ]; then
        return 0
    fi
    
    # Get the actual file name from the directory listing
    local actual_dir=$(dirname "$resolved_path")
    local expected_filename=$(basename "$resolved_path")
    
    if [ -d "$actual_dir" ]; then
        local actual_filename=$(ls "$actual_dir" 2>/dev/null | grep -i "^${expected_filename}$" | head -1)
        
        if [ -n "$actual_filename" ] && [ "$actual_filename" != "$expected_filename" ]; then
            echo "❌ Case sensitivity issue in $file:"
            echo "   Import: $import_path"
            echo "   Expected: $expected_filename"
            echo "   Actual: $actual_filename"
            echo "   This will fail on Linux systems!"
            echo ""
            return 1
        fi
    fi
    
    return 0
}

# Check all import statements in TypeScript/JavaScript files
echo "📋 Scanning import statements..."

# Find all source files
find apps/ui -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | grep -v node_modules | grep -v dist | while read -r file; do
    # Extract all import statements with relative paths
    grep -E "import.*from ['\"](\./|\.\./)" "$file" 2>/dev/null | while IFS= read -r import_line; do
        # Extract the file path from the import
        import_path=$(echo "$import_line" | sed -E "s/.*from ['\"]([^'\"]*)['\"].*/\1/")
        
        # Skip if not a relative import
        if [[ "$import_path" != "./"* && "$import_path" != "../"* ]]; then
            continue
        fi
        
        # Check for extensions that might have case issues
        if [[ "$import_path" == *".svg"* || "$import_path" == *".png"* || "$import_path" == *".jpg"* || "$import_path" == *".jpeg"* || "$import_path" == *".gif"* ]]; then
            if ! check_exact_case_match "$file" "$import_path"; then
                CASE_ISSUES=$((CASE_ISSUES + 1))
            fi
        fi
    done
done

# Alternative approach: Check by examining actual files vs imports
echo "🖼️  Cross-referencing actual files with imports..."

# Get all SVG files with their exact case
find apps/ui -name "*.svg" | while read -r svg_file; do
    svg_basename=$(basename "$svg_file")
    svg_dir=$(dirname "$svg_file")
    
    # Search for imports of this file (case-insensitive search)
    grep -r -i "import.*${svg_basename}" apps/ui --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" 2>/dev/null | while IFS= read -r import_match; do
        import_file=$(echo "$import_match" | cut -d: -f1)
        import_line=$(echo "$import_match" | cut -d: -f2-)
        
        # Extract the imported filename from the line
        imported_name=$(echo "$import_line" | sed -E "s/.*['\"].*\/([^'\"\/]+\.svg)['\"].*/\1/")
        
        # Check if the case matches exactly
        if [ "$imported_name" != "$svg_basename" ] && [ "$(echo "$imported_name" | tr '[:upper:]' '[:lower:]')" = "$(echo "$svg_basename" | tr '[:upper:]' '[:lower:]')" ]; then
            echo "❌ Case mismatch found:"
            echo "   File: $import_file"
            echo "   Import: $imported_name"
            echo "   Actual: $svg_basename"
            echo "   Location: $svg_file"
            echo ""
            CASE_ISSUES=$((CASE_ISSUES + 1))
        fi
    done
done

if [ $CASE_ISSUES -eq 0 ]; then
    echo "✅ No case-sensitivity issues found!"
    exit 0
else
    echo "❌ Found potential case-sensitivity issues that could cause problems on Linux systems."
    echo "🔧 Please fix these issues before committing."
    exit 1
fi