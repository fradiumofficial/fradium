/**
 * File Validation Service
 * Handles file validation for uploads
 */

// Default file size limits (in bytes)
export const FILE_SIZE_LIMITS = {
  SMALL: 250 * 1024, // 250KB
  MEDIUM: 2 * 1024 * 1024, // 2MB
  LARGE: 10 * 1024 * 1024, // 10MB
};

// Default allowed file types
export const ALLOWED_FILE_TYPES = {
  IMAGES: ["image/png", "image/jpeg", "image/jpg", "image/gif", "image/webp"],
  DOCUMENTS: ["application/pdf", "text/plain", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
  ALL: ["image/png", "image/jpeg", "image/jpg", "image/gif", "image/webp", "application/pdf", "text/plain"],
};

/**
 * Validate file size
 * @param {File} file - The file to validate
 * @param {number} maxSize - Maximum size in bytes
 * @returns {boolean} - True if file size is valid
 */
export const validateFileSize = (file, maxSize = FILE_SIZE_LIMITS.MEDIUM) => {
  return file.size <= maxSize;
};

/**
 * Validate file type
 * @param {File} file - The file to validate
 * @param {string[]} allowedTypes - Array of allowed MIME types
 * @returns {boolean} - True if file type is valid
 */
export const validateFileType = (file, allowedTypes = ALLOWED_FILE_TYPES.IMAGES) => {
  return allowedTypes.includes(file.type);
};

/**
 * Validate multiple files
 * @param {File[]} files - Array of files to validate
 * @param {Object} options - Validation options
 * @returns {Object} - Validation result with valid and invalid files
 */
export const validateFiles = (files, options = {}) => {
  const { maxSize = FILE_SIZE_LIMITS.MEDIUM, allowedTypes = ALLOWED_FILE_TYPES.IMAGES, maxFiles = 5 } = options;

  const result = {
    valid: [],
    invalid: [],
    errors: [],
  };

  // Check file count
  if (files.length > maxFiles) {
    result.errors.push(`Maximum ${maxFiles} files allowed`);
    return result;
  }

  files.forEach((file, index) => {
    const fileValidation = {
      file,
      index,
      errors: [],
    };

    // Check file size
    if (!validateFileSize(file, maxSize)) {
      fileValidation.errors.push(`File size exceeds ${formatFileSize(maxSize)}`);
    }

    // Check file type
    if (!validateFileType(file, allowedTypes)) {
      fileValidation.errors.push(`File type not allowed`);
    }

    if (fileValidation.errors.length > 0) {
      result.invalid.push(fileValidation);
    } else {
      result.valid.push(file);
    }
  });

  return result;
};

/**
 * Format file size for display
 * @param {number} bytes - Size in bytes
 * @returns {string} - Formatted size string
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

/**
 * Get file extension from filename
 * @param {string} filename - The filename
 * @returns {string} - File extension (without dot)
 */
export const getFileExtension = (filename) => {
  return filename.slice(((filename.lastIndexOf(".") - 1) >>> 0) + 2);
};

/**
 * Check if file is an image
 * @param {File} file - The file to check
 * @returns {boolean} - True if file is an image
 */
export const isImageFile = (file) => {
  return file.type.startsWith("image/");
};

/**
 * Check if file is a document
 * @param {File} file - The file to check
 * @returns {boolean} - True if file is a document
 */
export const isDocumentFile = (file) => {
  return file.type.startsWith("application/") || file.type.startsWith("text/");
};
