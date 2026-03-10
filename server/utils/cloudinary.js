import dotenv from 'dotenv';
dotenv.config();

import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    // Determine resource type based on file mimetype or extension
    let resource_type = 'image'; // default
    let folder = 'employee-images';

    // Check if it's an Excel file
    const isExcel = file.mimetype.includes('spreadsheet') ||
      file.mimetype.includes('excel') ||
      file.originalname.match(/\.(xlsx|xls)$/);

    // Check if it's a CV/document
    const isDocument = file.fieldname === 'cv' ||
      file.mimetype.includes('pdf') ||
      file.mimetype.includes('document');

    if (isExcel) {
      folder = 'salary-excels';
    } else if (isDocument) {
      folder = 'cvs-documents'; // Fresh folder name
    }

    // Split extension and basename
    const parts = file.originalname.split('.');
    const basename = parts.length > 1 ? parts.slice(0, -1).join('.') : file.originalname;

    // Sanitize public_id: remove spaces and special characters
    const sanitizedName = basename.replace(/[^a-zA-Z0-9]/g, '-');
    const publicId = `${Date.now()}-${sanitizedName}`;

    // Determine resource_type
    let resourceType = 'auto'; // Default for everything else
    if (isDocument) {
      resourceType = 'image'; // 🛡️ CRITICAL: PDFs must be 'image' type for viewing support
    }

    return {
      folder,
      resource_type: resourceType,
      type: 'upload',        // Ensure public delivery
      access_mode: 'public', // Force strictly public access
      public_id: publicId,
      // Removed format parameter to allow original file verbatim and avoid double extensions
    };
  },
});

export { cloudinary, storage };