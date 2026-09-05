#!/usr/bin/env python3
"""
Comprehensive case sensitivity checker for imports
Finds mismatches between import statements and actual file/folder names
"""

import os
import re
from pathlib import Path

def find_case_issues(base_path='apps'):
    """Find all case sensitivity issues in imports"""
    issues = []
    
    for root, dirs, files in os.walk(base_path):
        # Skip node_modules and dist
        if 'node_modules' in root or 'dist' in root:
            continue
            
        for file in files:
            if not file.endswith(('.ts', '.tsx', '.js', '.jsx')):
                continue
                
            filepath = os.path.join(root, file)
            
            try:
                with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()
                
                # Find all relative imports
                import_pattern = r'from\s+["\'](\./[^"\']+|\.\.+/[^"\']+)["\']'
                imports = re.findall(import_pattern, content)
                
                for imp in imports:
                    base_dir = os.path.dirname(filepath)
                    
                    # Try to resolve the import
                    resolved = check_import_case(base_dir, imp, filepath)
                    if resolved:
                        issues.append(resolved)
                        
            except Exception as e:
                print(f"Error reading {filepath}: {e}")
    
    return issues

def check_import_case(base_dir, import_path, source_file):
    """Check if import path matches actual file/folder case"""
    
    # Extensions to try
    extensions = ['', '.ts', '.tsx', '.js', '.jsx']
    index_files = ['', '/index.ts', '/index.tsx', '/index.js', '/index.jsx']
    
    for ext in extensions:
        for idx in index_files:
            test_path = os.path.normpath(os.path.join(base_dir, import_path + ext + idx))
            
            if os.path.exists(test_path):
                # Check each component of the path
                issue = check_path_components(base_dir, import_path, test_path, source_file)
                if issue:
                    return issue
                
                # Also check the final file name if this is a file (not a directory with index)
                if not idx and ext and os.path.isfile(test_path):
                    issue = check_final_filename(base_dir, import_path, test_path, source_file)
                    if issue:
                        return issue
                break
    
    return None

def check_path_components(base_dir, import_path, resolved_path, source_file):
    """Check each component of the path for case mismatches"""
    
    # Split the import path into components
    import_parts = import_path.replace('./', '').replace('../', '').split('/')
    
    # Start from base_dir and check each component
    current = os.path.abspath(base_dir)
    
    # Handle ../ in import path
    up_count = import_path.count('../')
    for _ in range(up_count):
        current = os.path.dirname(current)
    
    # Remove ../ from path for processing
    clean_import = re.sub(r'^\.\./+', '', import_path)
    clean_import = re.sub(r'^\./+', '', clean_import)
    
    import_parts = [p for p in clean_import.split('/') if p]
    
    for i, part in enumerate(import_parts):
        next_path = os.path.join(current, part)
        
        # Check if this exists (case-insensitive on Mac)
        if os.path.exists(next_path):
            # Get the actual name from directory listing
            parent = current
            if os.path.exists(parent) and os.path.isdir(parent):
                actual_items = os.listdir(parent)
                
                # Find case-insensitive match
                for actual_name in actual_items:
                    if actual_name.lower() == part.lower():
                        if actual_name != part:
                            return {
                                'file': source_file,
                                'import': import_path,
                                'component': part,
                                'actual': actual_name,
                                'position': '/'.join(import_parts[:i+1])
                            }
                        break
            
            current = next_path
    
    return None

def check_final_filename(base_dir, import_path, resolved_path, source_file):
    """Check if the final filename matches the import (for direct file imports)"""
    
    # Get the imported filename (last part of the path, without extension)
    imported_name = os.path.basename(import_path)
    
    # Get the parent directory to check actual files
    parent_dir = os.path.dirname(resolved_path)
    if not os.path.exists(parent_dir) or not os.path.isdir(parent_dir):
        return None
    
    # List all files in the parent directory
    actual_files = os.listdir(parent_dir)
    
    # Find files that match case-insensitively
    for actual_file in actual_files:
        actual_name_no_ext = os.path.splitext(actual_file)[0]
        
        # Check if they match case-insensitively but not exactly
        if imported_name.lower() == actual_name_no_ext.lower() and imported_name != actual_name_no_ext:
            return {
                'file': source_file,
                'import': import_path,
                'component': imported_name,
                'actual': actual_name_no_ext,
                'position': import_path,
                'type': 'filename'
            }
    
    return None

if __name__ == '__main__':
    print("🔍 Finding case sensitivity issues in imports...\n")
    
    issues = find_case_issues()
    
    if not issues:
        print("✅ No case sensitivity issues found!")
    else:
        print(f"❌ Found {len(issues)} case sensitivity issue(s):\n")
        
        for idx, issue in enumerate(issues, 1):
            print(f"{idx}. File: {issue['file']}")
            print(f"   Import: {issue['import']}")
            print(f"   Import uses: '{issue['component']}'")
            print(f"   Actual file/folder: '{issue['actual']}'")
            print(f"   ⚠️  Change import to use: '{issue['actual']}'")
            print()
        
        print(f"\n⚠️  These imports will fail on Linux (case-sensitive filesystem)")
        print("Fix them to match the actual file/folder names exactly.")
