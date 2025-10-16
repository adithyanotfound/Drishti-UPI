const QRCode = require('qrcode');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function generateQrAndUpload(upiId) {
  // produce a PNG buffer
  const dataUrl = await QRCode.toDataURL(`upi://pay?pa=${upiId}`);
  const hasCloudinary = !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);

  if (!hasCloudinary) {
    // If Cloudinary is not configured, return the data URL directly so frontend can render it
    return dataUrl;
  }

  // cloudinary accepts base64 data URLs directly, but we'll upload via stream to be safe
  const base64 = dataUrl.split(',')[1];
  const buffer = Buffer.from(base64, 'base64');

  return new Promise((resolve, reject) => {
    const upload_stream = cloudinary.uploader.upload_stream(
      { folder: 'upi_qr_codes', public_id: upiId.replace('@','_') },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      }
    );
    streamifier.createReadStream(buffer).pipe(upload_stream);
  });
}

module.exports = { generateQrAndUpload };
