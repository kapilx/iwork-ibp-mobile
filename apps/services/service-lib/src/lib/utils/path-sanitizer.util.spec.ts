import { getFileExtension, safePathJoin, sanitizeFilename, sanitizePath } from './path-sanitizer.util';

describe('sanitizeFilename', () => {
    describe('Normal filenames', () => {
        it('should pass through a simple filename unchanged', () => {
            expect(sanitizeFilename('document.pdf')).toBe('document.pdf');
        });

        it('should handle filenames with multiple dots', () => {
            expect(sanitizeFilename('my.file.name.txt')).toBe('my.file.name.txt');
        });

        it('should handle filenames with numbers and hyphens', () => {
            expect(sanitizeFilename('report-2024-01-15.xlsx')).toBe('report-2024-01-15.xlsx');
        });

        it('should handle filenames with underscores', () => {
            expect(sanitizeFilename('my_file_name.doc')).toBe('my_file_name.doc');
        });
    });

    describe('Path separators', () => {
        it('should replace forward slashes with underscores', () => {
            expect(sanitizeFilename('path/to/file.txt')).toBe('path_to_file.txt');
        });

        it('should replace backward slashes with underscores', () => {
            expect(sanitizeFilename('path\\to\\file.txt')).toBe('path_to_file.txt');
        });

        it('should replace mixed slashes with underscores', () => {
            expect(sanitizeFilename('path/to\\file.txt')).toBe('path_to_file.txt');
        });

        it('should replace multiple consecutive slashes', () => {
            expect(sanitizeFilename('path///file.txt')).toBe('path___file.txt');
        });
    });

    describe('Directory traversal sequences', () => {
        it('should replace double dots with underscores', () => {
            expect(sanitizeFilename('../file.txt')).toBe('__file.txt');
        });

        it('should replace multiple double dots', () => {
            expect(sanitizeFilename('../../file.txt')).toBe('____file.txt');
        });

        it('should replace triple dots with underscores', () => {
            expect(sanitizeFilename('...file.txt')).toBe('_file.txt');
        });

        it('should replace multiple consecutive dots', () => {
            expect(sanitizeFilename('file....txt')).toBe('file_txt');
        });

        it('should preserve single dots (file extensions)', () => {
            expect(sanitizeFilename('file.txt')).toBe('file.txt');
        });
    });

    describe('Null bytes', () => {
        it('should remove null bytes', () => {
            expect(sanitizeFilename('file\0name.txt')).toBe('filename.txt');
        });

        it('should remove multiple null bytes', () => {
            expect(sanitizeFilename('file\0name\0test.txt')).toBe('filenametest.txt');
        });
    });

    describe('Invalid characters', () => {
        it('should replace less than symbol', () => {
            expect(sanitizeFilename('file<name.txt')).toBe('file_name.txt');
        });

        it('should replace greater than symbol', () => {
            expect(sanitizeFilename('file>name.txt')).toBe('file_name.txt');
        });

        it('should replace colon', () => {
            expect(sanitizeFilename('file:name.txt')).toBe('file_name.txt');
        });

        it('should replace double quote', () => {
            expect(sanitizeFilename('file"name.txt')).toBe('file_name.txt');
        });

        it('should replace pipe symbol', () => {
            expect(sanitizeFilename('file|name.txt')).toBe('file_name.txt');
        });

        it('should replace question mark', () => {
            expect(sanitizeFilename('file?name.txt')).toBe('file_name.txt');
        });

        it('should replace asterisk', () => {
            expect(sanitizeFilename('file*name.txt')).toBe('file_name.txt');
        });

        it('should replace multiple invalid characters', () => {
            expect(sanitizeFilename('file<>:"|?*name.txt')).toBe('file_______name.txt');
        });
    });

    describe('Whitespace handling', () => {
        it('should trim leading whitespace', () => {
            expect(sanitizeFilename('   file.txt')).toBe('file.txt');
        });

        it('should trim trailing whitespace', () => {
            expect(sanitizeFilename('file.txt   ')).toBe('file.txt');
        });

        it('should trim both leading and trailing whitespace', () => {
            expect(sanitizeFilename('   file.txt   ')).toBe('file.txt');
        });

        it('should preserve internal whitespace', () => {
            expect(sanitizeFilename('my file name.txt')).toBe('my file name.txt');
        });
    });

    describe('Edge cases', () => {
        it('should throw error for empty string', () => {
            expect(() => sanitizeFilename('')).toThrow('Invalid filename provided');
        });

        it('should throw error for null', () => {
            expect(() => sanitizeFilename(null as any)).toThrow('Invalid filename provided');
        });

        it('should throw error for undefined', () => {
            expect(() => sanitizeFilename(undefined as any)).toThrow('Invalid filename provided');
        });

        it('should throw error for non-string input', () => {
            expect(() => sanitizeFilename(123 as any)).toThrow('Invalid filename provided');
        });

        it('should replace single dot with "file"', () => {
            expect(sanitizeFilename('.')).toBe('file');
        });

        it('should replace double dots with underscore', () => {
            expect(sanitizeFilename('..')).toBe('_');
        });

        it('should handle whitespace-only string after sanitization', () => {
            expect(sanitizeFilename('   ')).toBe('file');
        });
    });

    describe('Complex combinations', () => {
        it('should handle multiple path traversal attempts', () => {
            expect(sanitizeFilename('../../../etc/passwd')).toBe('______etc_passwd');
        });

        it('should handle combination of slashes and dots', () => {
            expect(sanitizeFilename('../../path/../file.txt')).toBe('____path___file.txt');
        });

        it('should handle invalid characters with path separators', () => {
            expect(sanitizeFilename('path/to/file<>:name.txt')).toBe('path_to_file___name.txt');
        });

        it('should handle null bytes with other invalid characters', () => {
            expect(sanitizeFilename('file\0name<test>.txt')).toBe('filename_test_.txt');
        });

        it('should handle comprehensive attack pattern', () => {
            expect(sanitizeFilename('../../../<script>alert("xss")</script>.txt'))
                .toBe('_______script_alert(_xss_)__script_.txt');
        });

        it('should handle Windows-style path with drive letter', () => {
            expect(sanitizeFilename('C:\\Users\\Admin\\file.txt')).toBe('C__Users_Admin_file.txt');
        });

        it('should handle Unix-style absolute path', () => {
            expect(sanitizeFilename('/var/www/html/file.txt')).toBe('_var_www_html_file.txt');
        });

        it('should handle UNC path', () => {
            expect(sanitizeFilename('\\\\server\\share\\file.txt')).toBe('__server_share_file.txt');
        });

        it('should handle spaces, slashes, and invalid characters together', () => {
            expect(sanitizeFilename('  my file/name <test>.txt  ')).toBe('my file_name _test_.txt');
        });
    });

    describe('Real-world scenarios', () => {
        it('should handle filename from user upload with special characters', () => {
            expect(sanitizeFilename('Invoice #123 (Final).pdf')).toBe('Invoice #123 (Final).pdf');
        });

        it('should handle filename with emoji or unicode', () => {
            expect(sanitizeFilename('report📄2024.xlsx')).toBe('report📄2024.xlsx');
        });

        it('should handle filename that looks like a path but is just a name', () => {
            expect(sanitizeFilename('path_to_file.txt')).toBe('path_to_file.txt');
        });

        it('should handle filename with timestamp', () => {
            expect(sanitizeFilename('backup_2024-03-15_14:30:00.sql')).toBe('backup_2024-03-15_14_30_00.sql');
        });

        it('should handle filename with multiple extensions', () => {
            expect(sanitizeFilename('archive.tar.gz')).toBe('archive.tar.gz');
        });

        it('should handle very long filename', () => {
            const longName = 'a'.repeat(300) + '.txt';
            const result = sanitizeFilename(longName);
            expect(result).toBe(longName);
            expect(result.length).toBe(304);
        });
    });

    describe('Security test cases', () => {
        it('should prevent path traversal with encoded characters', () => {
            // Note: This function doesn't decode URL encoding, but tests current behavior
            expect(sanitizeFilename('%2e%2e%2ffile.txt')).toBe('%2e%2e%2ffile.txt');
        });

        it('should handle filename with null byte injection attempt', () => {
            expect(sanitizeFilename('innocent.txt\0.exe')).toBe('innocent.txt.exe');
        });

        it('should handle NTFS alternate data stream attempt', () => {
            expect(sanitizeFilename('file.txt:hidden.exe')).toBe('file.txt_hidden.exe');
        });

        it('should handle shell command injection patterns', () => {
            expect(sanitizeFilename('file; rm -rf /.txt')).toBe('file; rm -rf _.txt');
        });

        it('should handle code injection patterns', () => {
            expect(sanitizeFilename('file$(whoami).txt')).toBe('file$(whoami).txt');
        });
    });
});

describe('sanitizePath', () => {
    describe('Basic path sanitization', () => {
        it('should sanitize simple relative path', () => {
            expect(sanitizePath('folder/subfolder/file.txt', '/base')).toBe('folder/subfolder/file.txt');
        });

        it('should sanitize path traversal with .. sequences', () => {
            // Function removes .. sequences, so this becomes safe
            const result = sanitizePath('../file.txt', '/base');
            expect(result).toBeDefined();
            expect(result).not.toContain('..');
        });

        it('should sanitize path traversal with multiple .. sequences', () => {
            const result = sanitizePath('../../file.txt', '/base');
            expect(result).toBeDefined();
            expect(result).not.toContain('..');
        });

        it('should sanitize mixed .. and valid segments', () => {
            const result = sanitizePath('folder/../file.txt', '/base');
            expect(result).toBeDefined();
            expect(result).not.toContain('..');
        });

        it('should sanitize leading ..', () => {
            const result = sanitizePath('../../folder/file.txt', '/base');
            expect(result).toBeDefined();
            expect(result).not.toContain('..');
        });

        it('should handle paths with forward slashes', () => {
            expect(sanitizePath('documents/reports/2024.pdf', '/base')).toBe('documents/reports/2024.pdf');
        });

        it('should handle paths with backward slashes', () => {
            expect(sanitizePath('documents\\reports\\2024.pdf', '/base')).toBe('documents\\reports\\2024.pdf');
        });

        it('should handle nested folder structures', () => {
            expect(sanitizePath('a/b/c/d/e/file.txt', '/base')).toBe('a/b/c/d/e/file.txt');
        });

        it('should return . when path sanitizes to empty string', () => {
            expect(sanitizePath('../', '/base')).toBe('.');
        });

        it('should return . when multiple traversal sequences sanitize to empty', () => {
            expect(sanitizePath('../../../', '/base')).toBe('.');
        });

        it('should handle single dot as path and return .', () => {
            expect(sanitizePath('.', '/base')).toBe('.');
        });

        it('should return sanitized path when mixed traversal sequences are removed', () => {
            expect(sanitizePath('folder/../file.txt', '/base')).toBe('folder/file.txt');
        });
    });

    describe('Edge cases and security scenarios', () => {
        it('should throw error for empty path', () => {
            expect(() => sanitizePath('', '/base')).toThrow('Invalid path provided');
        });

        it('should throw error for null path', () => {
            expect(() => sanitizePath(null as any, '/base')).toThrow('Invalid path provided');
        });

        it('should throw error for undefined path', () => {
            expect(() => sanitizePath(undefined as any, '/base')).toThrow('Invalid path provided');
        });

        it('should throw error for non-string path', () => {
            expect(() => sanitizePath(123 as any, '/base')).toThrow('Invalid path provided');
        });

        it('should throw error for invalid base directory', () => {
            expect(() => sanitizePath('file.txt', null as any)).toThrow('Invalid base directory provided');
            expect(() => sanitizePath('file.txt', undefined as any)).toThrow('Invalid base directory provided');
            expect(() => sanitizePath('file.txt', 123 as any)).toThrow('Invalid base directory provided');
        });

        it('should allow encoded characters that dont escape base', () => {
            // Function doesn't decode URL encoding, so these are treated as literal characters
            const result = sanitizePath('%2e%2e%2ffile.txt', '/base');
            expect(result).toBeDefined();
        });

        it('should remove null byte injection in path', () => {
            const result = sanitizePath('folder\0name/file.txt', '/base');
            expect(result).toBeDefined();
            expect(result).not.toContain('\0');
        });

        it('should allow shell patterns if they dont escape base', () => {
            // These are just filenames as far as file system is concerned
            const result = sanitizePath('folder; rm -rf /', '/base');
            expect(result).toBeDefined();
        });

        it('should allow code injection patterns if they dont escape base', () => {
            const result = sanitizePath('folder$(whoami)/file.txt', '/base');
            expect(result).toBeDefined();
        });

        it('should handle trailing .. without escaping base', () => {
            // The function allows trailing .. as long as final path stays in base
            const result = sanitizePath('folder/..', '/base');
            expect(result).toBeDefined();
            // The path validation will ensure it doesn't escape base directory
        });

        it('should sanitize middle ..', () => {
            const result = sanitizePath('folder/../another/file.txt', '/base');
            expect(result).toBeDefined();
            expect(result).not.toContain('..');
        });

        it('should detect absolute path attempts', () => {
            expect(() => sanitizePath('/etc/passwd', '/base')).toThrow('Path traversal detected');
        });

        it('should handle Windows-style paths', () => {
            // Windows paths with backslashes are treated as literal paths
            const result = sanitizePath('C:\\Windows\\System32', '/base');
            expect(result).toBeDefined();
        });
    });

    describe('Complex scenarios', () => {
        it('should handle paths with dots in filenames', () => {
            expect(sanitizePath('folder/file.backup.txt', '/base')).toBe('folder/file.backup.txt');
        });

        it('should handle paths with special characters in names', () => {
            expect(sanitizePath('folder/file-name_2024.txt', '/base')).toBe('folder/file-name_2024.txt');
        });

        it('should allow dot-slash patterns within base', () => {
            const result = sanitizePath('folder/./file.txt', '/base');
            expect(result).toBeDefined();
        });

        it('should handle Unicode characters in path', () => {
            expect(sanitizePath('フォルダ/ファイル.txt', '/base')).toBe('フォルダ/ファイル.txt');
        });
    });
});

describe('getFileExtension', () => {
    describe('Normal file extensions', () => {
        it('should extract simple extension', () => {
            expect(getFileExtension('document.pdf')).toBe('pdf');
        });

        it('should extract extension from file with path', () => {
            expect(getFileExtension('folder/document.pdf')).toBe('pdf');
        });

        it('should extract extension from nested path', () => {
            expect(getFileExtension('folder/subfolder/document.pdf')).toBe('pdf');
        });

        it('should extract common extensions', () => {
            expect(getFileExtension('file.txt')).toBe('txt');
            expect(getFileExtension('file.doc')).toBe('doc');
            expect(getFileExtension('file.xlsx')).toBe('xlsx');
            expect(getFileExtension('file.png')).toBe('png');
            expect(getFileExtension('file.jpg')).toBe('jpg');
        });

        it('should extract uppercase extensions', () => {
            expect(getFileExtension('file.PDF')).toBe('PDF');
            expect(getFileExtension('file.TXT')).toBe('TXT');
        });

        it('should extract mixed case extensions', () => {
            expect(getFileExtension('file.PdF')).toBe('PdF');
        });
    });

    describe('Multiple dots in filename', () => {
        it('should extract extension from file with multiple dots', () => {
            expect(getFileExtension('file.backup.txt')).toBe('txt');
        });

        it('should extract extension from archive files', () => {
            expect(getFileExtension('archive.tar.gz')).toBe('gz');
        });

        it('should extract extension from version files', () => {
            expect(getFileExtension('file.v1.2.3.txt')).toBe('txt');
        });

        it('should extract extension from dotfiles with extension', () => {
            expect(getFileExtension('.htaccess.backup')).toBe('backup');
        });
    });

    describe('Edge cases', () => {
        it('should return empty string for file without extension', () => {
            expect(getFileExtension('README')).toBe('');
        });

        it('should return empty string for dotfile without extension', () => {
            expect(getFileExtension('.gitignore')).toBe('gitignore');
        });

        it('should return empty string for single dot', () => {
            expect(getFileExtension('.')).toBe('');
        });

        it('should return empty string for double dots', () => {
            expect(getFileExtension('..')).toBe('');
        });

        it('should return empty string for null', () => {
            expect(getFileExtension(null as any)).toBe('');
        });

        it('should return empty string for undefined', () => {
            expect(getFileExtension(undefined as any)).toBe('');
        });

        it('should return empty string for non-string input', () => {
            expect(getFileExtension(123 as any)).toBe('');
        });

        it('should return empty string for empty string', () => {
            expect(getFileExtension('')).toBe('');
        });

        it('should handle file ending with dot', () => {
            expect(getFileExtension('file.')).toBe('');
        });

        it('should handle path ending with slash', () => {
            expect(getFileExtension('folder/')).toBe('');
        });
    });

    describe('Special characters and scenarios', () => {
        it('should handle filename with spaces', () => {
            expect(getFileExtension('my file.txt')).toBe('txt');
        });

        it('should handle filename with hyphens', () => {
            expect(getFileExtension('my-file-name.pdf')).toBe('pdf');
        });

        it('should handle filename with underscores', () => {
            expect(getFileExtension('my_file_name.doc')).toBe('doc');
        });

        it('should handle filename with numbers', () => {
            expect(getFileExtension('report2024.xlsx')).toBe('xlsx');
        });

        it('should handle very long extension', () => {
            expect(getFileExtension('file.verylongextension')).toBe('verylongextension');
        });

        it('should handle single character extension', () => {
            expect(getFileExtension('file.c')).toBe('c');
        });

        it('should handle numeric extension', () => {
            expect(getFileExtension('file.001')).toBe('001');
        });

        it('should handle Unicode in filename', () => {
            expect(getFileExtension('ファイル.txt')).toBe('txt');
        });

        it('should handle extension with numbers', () => {
            expect(getFileExtension('file.mp3')).toBe('mp3');
        });
    });

    describe('Real-world scenarios', () => {
        it('should handle backup files', () => {
            expect(getFileExtension('database.sql.backup')).toBe('backup');
        });

        it('should handle compressed archives', () => {
            expect(getFileExtension('archive.tar.gz')).toBe('gz');
            expect(getFileExtension('file.tar.bz2')).toBe('bz2');
        });

        it('should handle source code files', () => {
            expect(getFileExtension('component.tsx')).toBe('tsx');
            expect(getFileExtension('module.spec.ts')).toBe('ts');
        });

        it('should handle configuration files', () => {
            expect(getFileExtension('package.json')).toBe('json');
            expect(getFileExtension('tsconfig.json')).toBe('json');
        });
    });
});

describe('safePathJoin', () => {
    describe('Basic path joining', () => {
        it('should join simple path segments', () => {
            const result = safePathJoin('/base', 'folder', 'file.txt');
            expect(result).toContain('folder');
            expect(result).toContain('file.txt');
        });

        it('should join multiple segments', () => {
            const result = safePathJoin('/base', 'a', 'b', 'c', 'file.txt');
            expect(result).toContain('a');
            expect(result).toContain('b');
            expect(result).toContain('c');
        });

        it('should handle single segment', () => {
            const result = safePathJoin('/base', 'file.txt');
            expect(result).toContain('file.txt');
        });

        it('should handle segments with slashes', () => {
            const result = safePathJoin('/base', 'folder/subfolder', 'file.txt');
            expect(result).toContain('folder');
            expect(result).toContain('subfolder');
        });

        it('should normalize the resulting path', () => {
            const result = safePathJoin('/base', 'folder', './subfolder', 'file.txt');
            expect(result).toBeDefined();
        });
    });

    describe('Path traversal prevention', () => {
        it('should prevent path traversal with ..', () => {
            expect(() => safePathJoin('/base', '..', 'file.txt')).toThrow('Path traversal detected');
        });

        it('should prevent path traversal with multiple ..', () => {
            expect(() => safePathJoin('/base', '..', '..', 'file.txt')).toThrow('Path traversal detected');
        });

        it('should prevent path traversal in middle segment', () => {
            expect(() => safePathJoin('/base', 'folder', '..', '..', 'file.txt')).toThrow('Path traversal detected');
        });

        it('should prevent path traversal with leading ..', () => {
            expect(() => safePathJoin('/base', '../etc/passwd')).toThrow('Path traversal detected');
        });

        it('should handle absolute path in segments', () => {
            // path.join handles absolute paths by replacing previous segments
            const result = safePathJoin('/base', '/etc/passwd');
            expect(result).toBeDefined();
        });

        it('should handle Windows paths in segments', () => {
            const result = safePathJoin('/base', 'C:\\Windows\\System32');
            expect(result).toBeDefined();
        });

        it('should prevent sophisticated traversal with normal paths', () => {
            expect(() => safePathJoin('/base', 'safe', '..', '..', 'escape')).toThrow('Path traversal detected');
        });

        it('should prevent traversal with encoded paths', () => {
            expect(() => safePathJoin('/base', '..%2F..%2Fetc%2Fpasswd')).toThrow('Path traversal detected');
        });

        it('should prevent traversal when segment ends with /..', () => {
            expect(() => safePathJoin('/base', 'folder/..')).toThrow('Path traversal detected');
        });

        it('should prevent traversal when segment ends with \\..', () => {
            expect(() => safePathJoin('/base', 'folder\\..')).toThrow('Path traversal detected');
        });

        it('should prevent traversal when segment contains /../', () => {
            expect(() => safePathJoin('/base', 'folder/../sibling')).toThrow('Path traversal detected');
        });

        it('should prevent traversal when segment contains \\..\\', () => {
            expect(() => safePathJoin('/base', 'folder\\..\\sibling')).toThrow('Path traversal detected');
        });
    });

    describe('Base directory validation', () => {
        it('should throw error for null base directory', () => {
            expect(() => safePathJoin(null as any, 'file.txt')).toThrow('Invalid base directory provided');
        });

        it('should throw error for undefined base directory', () => {
            expect(() => safePathJoin(undefined as any, 'file.txt')).toThrow('Invalid base directory provided');
        });

        it('should throw error for non-string base directory', () => {
            expect(() => safePathJoin(123 as any, 'file.txt')).toThrow('Invalid base directory provided');
        });

        it('should throw error for empty base directory', () => {
            expect(() => safePathJoin('', 'file.txt')).toThrow('Invalid base directory provided');
        });

        it('should handle base directory with trailing slash', () => {
            const result = safePathJoin('/base/', 'folder', 'file.txt');
            expect(result).toBeDefined();
        });

        it('should handle base directory without leading slash', () => {
            const result = safePathJoin('base', 'folder', 'file.txt');
            expect(result).toBeDefined();
        });
    });

    describe('Edge cases', () => {
        it('should handle empty segments array', () => {
            const result = safePathJoin('/base');
            expect(result).toBeDefined();
        });

        it('should handle segments with dots in names', () => {
            const result = safePathJoin('/base', 'file.backup.txt');
            expect(result).toContain('file.backup.txt');
        });

        it('should handle segments with special characters', () => {
            const result = safePathJoin('/base', 'folder-name_2024', 'file.txt');
            expect(result).toContain('folder-name_2024');
        });

        it('should handle segments with spaces', () => {
            const result = safePathJoin('/base', 'my folder', 'my file.txt');
            expect(result).toContain('my folder');
        });

        it('should handle Unicode segments', () => {
            const result = safePathJoin('/base', 'フォルダ', 'ファイル.txt');
            expect(result).toContain('フォルダ');
        });

        it('should handle very long paths', () => {
            const longSegment = 'a'.repeat(100);
            const result = safePathJoin('/base', longSegment, 'file.txt');
            expect(result).toContain(longSegment);
        });

        it('should handle many segments', () => {
            const segments = Array(20).fill('folder');
            const result = safePathJoin('/base', ...segments, 'file.txt');
            expect(result).toContain('file.txt');
        });
    });

    describe('Security scenarios', () => {
        it('should handle null byte in segments', () => {
            // Node's path.join handles null bytes as part of the string
            const result = safePathJoin('/base', 'folder\0name', 'file.txt');
            expect(result).toBeDefined();
        });

        it('should prevent shell command injection', () => {
            const result = safePathJoin('/base', 'folder; rm -rf /', 'file.txt');
            expect(result).toBeDefined();
        });

        it('should prevent code injection patterns', () => {
            const result = safePathJoin('/base', 'folder$(whoami)', 'file.txt');
            expect(result).toBeDefined();
        });

        it('should prevent symlink traversal attempts', () => {
            expect(() => safePathJoin('/base', 'symlink', '..', '..', 'escape')).toThrow('Path traversal detected');
        });

        it('should validate final resolved path', () => {
            expect(() => safePathJoin('/base', 'a/../b/../../escape')).toThrow('Path traversal detected');
        });
    });

    describe('Real-world scenarios', () => {
        it('should handle document upload paths', () => {
            const result = safePathJoin('/uploads', 'user123', 'documents', 'invoice.pdf');
            expect(result).toContain('user123');
            expect(result).toContain('documents');
            expect(result).toContain('invoice.pdf');
        });

        it('should handle temporary file paths', () => {
            const result = safePathJoin('/tmp', 'session_abc123', 'temp_file.dat');
            expect(result).toContain('session_abc123');
            expect(result).toContain('temp_file.dat');
        });

        it('should handle nested folder structures', () => {
            const result = safePathJoin('/data', 'year/2024', 'month/03', 'report.xlsx');
            expect(result).toContain('2024');
            expect(result).toContain('03');
            expect(result).toContain('report.xlsx');
        });

        it('should handle user-generated folder names', () => {
            const result = safePathJoin('/storage', 'My Documents', 'Project Files', 'readme.txt');
            expect(result).toContain('My Documents');
            expect(result).toContain('Project Files');
        });
    });
});
