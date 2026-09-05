import * as path from 'path';

/**
 * Sanitizes a filename to prevent path traversal attacks.
 * Removes directory separators, relative paths, and null bytes.
 * 
 * @param filename - The filename to sanitize
 * @returns Sanitized filename safe for file system operations
 * @throws Error if filename is invalid
 */
export function sanitizeFilename(filename: string): string {
    if (!filename || typeof filename !== 'string') {
        throw new Error('Invalid filename provided');
    }

    // Remove path separators and directory traversal sequences
    let sanitized = filename
        .replace(/[\\/]/g, '_')           // Replace slashes with underscores
        .replace(/\.\.+/g, '_')            // Replace .. sequences
        .replace(/\0/g, '')                 // Remove null bytes
        .replace(/[<>:"|?*]/g, '_')        // Remove other invalid characters
        .trim();

    // Ensure filename is not empty after sanitization
    if (!sanitized || sanitized === '.' || sanitized === '..') {
        sanitized = 'file';
    }

    return sanitized;
}

/**
 * Validates and sanitizes a file path to prevent path traversal.
 * Ensures the resolved path stays within the specified base directory.
 * 
 * @param relativePath - The relative path to sanitize
 * @param baseDirectory - The base directory that paths must stay within
 * @returns Sanitized relative path
 * @throws Error if path is invalid or attempts to escape base directory
 */
export function sanitizePath(relativePath: string, baseDirectory: string): string {
    if (!relativePath || typeof relativePath !== 'string') {
        throw new Error('Invalid path provided');
    }

    if (!baseDirectory || typeof baseDirectory !== 'string') {
        throw new Error('Invalid base directory provided');
    }

    // Remove any .. sequences and normalize
    const sanitized = relativePath
        .replace(/\.\.[\\/]/g, '')        // Remove ../ and ..\
        .replace(/^\.\./g, '')             // Remove leading ..
        .replace(/\0/g, '');                // Remove null bytes
    const normalizedPath = path.normalize(sanitized).replace(/^\.+|\.+$/g, '');

    // Allow empty paths after sanitization (e.g., 'folder/..' becomes '')
    // The final path validation will ensure it doesn't escape base
    if (normalizedPath && (normalizedPath === '..' || normalizedPath.includes('..'))) {
        throw new Error('Invalid path after sanitization');
    }

    // Normalize base directory first to prevent bypass
    const basePathNormalized = path.normalize(baseDirectory).replace(/^\.+|\.+$/g, '');
    const basePathResolved = path.resolve(basePathNormalized);
    
    // Resolve the full path against normalized base
    const fullPath = path.resolve(basePathResolved, normalizedPath || '.');

    // Ensure the resolved path is within the base directory
    if (!fullPath.startsWith(basePathResolved + path.sep) && fullPath !== basePathResolved) {
        throw new Error('Path traversal detected - access denied');
    }

    return sanitized;
}

/**
 * Extracts file extension from a sanitized filename.
 * 
 * @param filename - The filename to extract extension from
 * @returns File extension without the dot, or empty string if none
 */
export function getFileExtension(filename: string): string {
    if (!filename || typeof filename !== 'string') {
        return '';
    }

    const parts = filename.split('.');
    return parts.length > 1 ? parts.pop() || '' : '';
}

/**
 * Safely joins path segments and validates the result stays within base directory.
 * This function prevents path traversal by validating the final resolved path.
 * 
 * @param baseDirectory - The base directory that paths must stay within
 * @param pathSegments - Path segments to join
 * @returns Safe joined path
 * @throws Error if path traversal is detected
 */
export function safePathJoin(baseDirectory: string, ...pathSegments: string[]): string {
    if (!baseDirectory || typeof baseDirectory !== 'string') {
        throw new Error('Invalid base directory provided');
    }

    // Normalize and resolve base directory
    const basePathNormalized = path.normalize(baseDirectory).replace(/^\.+|\.+$/g, '');
    const basePathResolved = path.resolve(basePathNormalized);

    // Validate path segments but don't sanitize yet - we need to detect traversal
    for (const segment of pathSegments) {
        if (typeof segment !== 'string') {
            throw new Error('Invalid path segment provided');
        }
        // Check for explicit traversal attempts
        if (segment === '..' || segment.startsWith('../') || segment.startsWith('..\\') || 
            segment.includes('/../') || segment.includes('\\..\\') || segment.endsWith('/..') || segment.endsWith('\\..')   ) {
            throw new Error('Path traversal detected - access denied');
        }
    }
    
    // Join all segments - path.join handles normalization
    const joinedPath = path.join(basePathResolved, ...pathSegments);
    const resolvedPath = path.resolve(joinedPath);
    
    // Validate the resolved path is within base directory
    if (!resolvedPath.startsWith(basePathResolved + path.sep) && resolvedPath !== basePathResolved) {
        throw new Error('Path traversal detected - access denied');
    }
    
    // Additional check using relative path
    const relativePath = path.relative(basePathResolved, resolvedPath);
    if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
        throw new Error('Path traversal detected - access denied');
    }
    
    return resolvedPath;
}
