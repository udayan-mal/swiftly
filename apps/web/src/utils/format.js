/**
 * Swiftly - Format Utilities
 * Helper functions for formatting data in the UI
 */

/**
 * Format file size to human-readable string
 * @param {number} bytes - Size in bytes
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {string} Formatted size string (e.g., "1.5 MB")
 */
export const formatFileSize = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    if (!bytes || isNaN(bytes)) return 'Unknown';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));
    const size = parseFloat((bytes / Math.pow(k, i)).toFixed(dm));

    return `${size} ${sizes[i]}`;
};

/**
 * Format transfer speed
 * @param {number} bytesPerSecond - Speed in bytes per second
 * @returns {string} Formatted speed string (e.g., "1.5 MB/s")
 */
export const formatTransferSpeed = (bytesPerSecond) => {
    if (!bytesPerSecond || bytesPerSecond <= 0) return '-- /s';
    return `${formatFileSize(bytesPerSecond, 1)}/s`;
};

/**
 * Format time remaining (ETA)
 * @param {number} seconds - Remaining time in seconds
 * @returns {string} Formatted time string (e.g., "2m 30s")
 */
export const formatTimeRemaining = (seconds) => {
    if (!seconds || seconds <= 0 || !isFinite(seconds)) return '--';

    if (seconds < 60) {
        return `${Math.round(seconds)}s`;
    } else if (seconds < 3600) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.round(seconds % 60);
        return `${mins}m ${secs}s`;
    } else {
        const hours = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        return `${hours}h ${mins}m`;
    }
};

/**
 * Get file type category from MIME type
 * @param {string} mimeType - MIME type string
 * @returns {string} Category (image, video, audio, document, archive, other)
 */
export const getFileCategory = (mimeType) => {
    if (!mimeType) return 'other';

    const type = mimeType.toLowerCase();

    if (type.startsWith('image/')) return 'image';
    if (type.startsWith('video/')) return 'video';
    if (type.startsWith('audio/')) return 'audio';
    if (type.includes('pdf') || type.includes('document') || type.includes('text/')) return 'document';
    if (type.includes('zip') || type.includes('rar') || type.includes('tar') || type.includes('archive')) return 'archive';

    return 'other';
};

/**
 * Get file icon emoji based on file type
 * @param {string} mimeType - MIME type string
 * @returns {string} Emoji icon
 */
export const getFileIcon = (mimeType) => {
    const category = getFileCategory(mimeType);
    const icons = {
        image: '🖼️',
        video: '🎬',
        audio: '🎵',
        document: '📄',
        archive: '📦',
        other: '📁'
    };
    return icons[category] || '📁';
};

/**
 * Truncate filename if too long
 * @param {string} filename - Original filename
 * @param {number} maxLength - Maximum length (default: 30)
 * @returns {string} Truncated filename with extension preserved
 */
export const truncateFilename = (filename, maxLength = 30) => {
    if (!filename || filename.length <= maxLength) return filename;

    const ext = filename.split('.').pop();
    const nameWithoutExt = filename.slice(0, filename.lastIndexOf('.'));

    const truncatedLength = maxLength - ext.length - 4; // 4 for "..." and "."
    if (truncatedLength <= 0) return `...${filename.slice(-maxLength)}`;

    return `${nameWithoutExt.slice(0, truncatedLength)}...${ext}`;
};
