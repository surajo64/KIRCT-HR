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

    if (isExcel || isDocument) {
      resource_type = 'raw';
      folder = isExcel ? 'salary-excels' : 'employee-cvs';
    }

    return {
      folder,
      resource_type: resource_type,
      public_id: Date.now() + '-' + file.originalname,
      access_mode: 'public',
    };
  },
});

export { cloudinary, storage };