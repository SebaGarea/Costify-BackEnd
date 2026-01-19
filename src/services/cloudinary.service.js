import cloudinary from '../config/cloudinary.js';
import logger from '../config/logger.js';

const PRODUCT_FOLDER = 'costify/productos';

const hasCloudinaryConfig = () => {
  const requiredKeys = [
    process.env.CLOUDINARY_CLOUD_NAME,
    process.env.CLOUDINARY_API_KEY,
    process.env.CLOUDINARY_API_SECRET,
  ];

  const isConfigured = requiredKeys.every((value) => typeof value === 'string' && value.trim().length > 0);

  if (!isConfigured) {
    logger.warn('Cloudinary no está configurado, se omiten operaciones de subida/eliminación.');
  }

  return isConfigured;
};

export const uploadProductImages = async (files = []) => {
  if (!files || files.length === 0) {
    return { urls: [], publicIds: [] };
  }

  if (!hasCloudinaryConfig()) {
    return { urls: [], publicIds: [] };
  }

  const uploads = files.map(async file => {
    const base64File = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
    return await cloudinary.uploader.upload(base64File, {
      folder: PRODUCT_FOLDER,
    });
  });

  const results = await Promise.all(uploads);
  return {
    urls: results.map(result => result.secure_url),
    publicIds: results.map(result => result.public_id),
  };
};

export const deleteCloudinaryAssets = async (publicIds = []) => {
  if (!publicIds || publicIds.length === 0) {
    return;
  }

  if (!hasCloudinaryConfig()) {
    return;
  }

  const deletions = publicIds.map(publicId =>
    cloudinary.uploader.destroy(publicId, { invalidate: true })
  );

  const outcomes = await Promise.allSettled(deletions);
  outcomes.forEach((outcome, index) => {
    if (outcome.status === 'rejected') {
      logger.warn('No se pudo eliminar la imagen en Cloudinary', {
        publicId: publicIds[index],
        error: outcome.reason?.message || outcome.reason,
      });
    }
  });
};
