import multer from 'multer';

// Use memory storage so file buffer is directly available in req.file.buffer
const memoryStorage = multer.memoryStorage();

const uploadMemory = multer({ storage: memoryStorage });

export default uploadMemory;
