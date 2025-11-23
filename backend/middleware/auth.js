import { admin } from '../firebase.js';

export const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('❌ No authorization header or invalid format');
      return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    const token = authHeader.split('Bearer ')[1];
    console.log('🔑 Verifying token:', token.substring(0, 20) + '...');

    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      displayName: decodedToken.name || decodedToken.email,
    };

    console.log('✅ Token verified for user:', req.user.email);
    next();
  } catch (error) {
    console.error('❌ Token verification error:', error.message);
    console.error('Error code:', error.code);
    return res.status(403).json({ error: `Forbidden: Invalid token - ${error.message}` });
  }
};
