const fs = require('fs');
const cloudinary = require('../config/cloudinary');

/**
 * Spec section 6: Multer writes a temp file locally, we push it to
 * Cloudinary, delete the temp file, and store only url + publicId.
 */
const uploadToCloudinary = async (localPath, folder, resourceType = 'auto') => {
    try {
        const result = await cloudinary.uploader.upload(localPath, {
            folder: `proconnect/${folder}`,
            resource_type: resourceType,
        });
        return { url: result.secure_url, publicId: result.public_id };
    } finally {
        // Always clean up the temp file, even if the upload threw.
        try { fs.unlinkSync(localPath); } catch (e) { /* non-fatal */ }
    }
};

/** Replaces an old asset: uploads the new one, then removes the previous one. */
const destroyFromCloudinary = async (publicId, resourceType = 'image') => {
    if (!publicId) return;
    try {
        await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    } catch (error) {
        console.error('Cloudinary destroy failed:', error.message);
    }
};

module.exports = { uploadToCloudinary, destroyFromCloudinary };
