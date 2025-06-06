const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    let user;
    
    // Check user type and fetch accordingly
    if (decoded.userType === 'admin') {
      user = await Admin.findById(decoded.id).select('-password');
      if (!user || !user.isActive) {
        return res.status(401).json({ message: 'Token is not valid' });
      }
      req.admin = user;
      req.user = user;
      req.userType = 'admin';
    } else if (decoded.userType === 'student') {
      user = await Student.findById(decoded.id).select('-password');
      if (!user || !user.isActive) {
        return res.status(401).json({ message: 'Token is not valid' });
      }
      req.student = user;
      req.user = user;
      req.userType = 'student';
    } else if (decoded.userType === 'teacher') {
      user = await Teacher.findById(decoded.id).select('-password');
      if (!user) {
        return res.status(401).json({ message: 'Token is not valid' });
      }
      req.teacher = user;
      req.user = user;
      req.userType = 'teacher';
    } else {
      return res.status(401).json({ message: 'Invalid token type' });
    }

    req.schoolId = user.schoolId;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.userType)) {
      return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
    }
    next();
  };
};

const adminOnly = (req, res, next) => {
  if (req.userType !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin only.' });
  }
  next();
};

module.exports = { auth, authorize, adminOnly };
