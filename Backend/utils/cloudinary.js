const cloudinary = require('../config/cloudinary');

const uploadToCloudinary = async (buffer, mimetype, folder = 'voting-system') => {
  return new Promise((resolve, reject) => {
    const b64 = buffer.toString('base64');
    const dataUri = `data:${mimetype};base64,${b64}`;

    cloudinary.uploader.upload(
      dataUri,
      {
        folder,
        resource_type: 'image',
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      }
    );
  });
};

module.exports = { uploadToCloudinary };
