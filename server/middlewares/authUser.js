import jwt from 'jsonwebtoken';

const authUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Authorization token missing or malformed' });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach userId to the request object
    if (decoded?.id || decoded?._id) {
      req.userId = decoded.id || decoded._id;
    }
    
    next();
  } catch (error) {
    console.error("Auth Error:", error.message);
    return res.status(403).json({ success: false, message: 'Invalid or expired token' });
  }
};

export default authUser;
