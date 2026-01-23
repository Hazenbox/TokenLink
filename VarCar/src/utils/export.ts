/**
 * Export utility functions for file generation and formatting
 */

// ============================================================================
// Filename Generation
// ============================================================================

/**
 * Formats a date for use in filenames (YYYY-MM-DD-HHMMSS)
 */
export function formatDateForFilename(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day}-${hours}${minutes}${seconds}`;
}

/**
 * Generates a filename for the JSON export with timestamp
 * @returns Filename in format: figzig-export-YYYY-MM-DD-HHMMSS.json
 */
export function generateExportFilename(): string {
  const timestamp = formatDateForFilename();
  return `figzig-export-${timestamp}.json`;
}

// ============================================================================
// File Download
// ============================================================================

/**
 * Downloads a string as a JSON file in the browser
 * @param content - JSON string content to download
 * @param filename - Filename for the download (default: auto-generated)
 */
export function downloadJSON(content: string, filename?: string): void {
  // Create a blob from the JSON content
  const blob = new Blob([content], { type: 'application/json' });
  
  // Create a URL for the blob
  const url = URL.createObjectURL(blob);
  
  // Create a temporary anchor element for download
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || generateExportFilename();
  
  // Append to body (required for Firefox)
  document.body.appendChild(link);
  
  // Trigger download
  link.click();
  
  // Clean up
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ============================================================================
// JSON Validation
// ============================================================================

/**
 * Validates that a string is valid JSON
 * @param jsonString - String to validate
 * @returns Object with valid flag and error message if invalid
 */
export function validateJSON(jsonString: string): {
  valid: boolean;
  error?: string;
} {
  try {
    JSON.parse(jsonString);
    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Invalid JSON',
    };
  }
}

// ============================================================================
// Format Utilities
// ============================================================================

/**
 * Formats byte size to human-readable string
 * @param bytes - Number of bytes
 * @returns Formatted string (e.g., "1.5 KB", "2.3 MB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Gets the byte size of a string
 * @param str - String to measure
 * @returns Size in bytes
 */
export function getStringByteSize(str: string): number {
  return new Blob([str]).size;
}
