const express = require('express');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Generate JWT token
const generateToken = (userId, userType) => {
  return jwt.sign(
    { id: userId, userType },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
};

// @route   POST /api/auth/student/login
// @desc    Student login
// @access  Public
router.post('/student/login', [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').exists().withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    const student = await Student.findOne({ email, isActive: true })
      .populate('assignedClass', 'name grade section');
    
    if (!student) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await student.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(student._id, 'student');

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: student._id,
        name: student.name,
        email: student.email,
        rollNumber: student.rollNumber,
        schoolId: student.schoolId,
        assignedClass: student.assignedClass,
        userType: 'student'
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/auth/teacher/login
// @desc    Teacher login
// @access  Public
router.post('/teacher/login', [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').exists().withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    const teacher = await Teacher.findOne({ email })
      .populate('assignedClass', 'name grade section');
    
    if (!teacher) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await teacher.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(teacher._id, 'teacher');

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: teacher._id,
        name: teacher.name,
        email: teacher.email,
        role: teacher.role,
        schoolId: teacher.schoolId,
        assignedClass: teacher.assignedClass,
        userType: 'teacher'
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/auth/profile
// @desc    Get user profile (student/teacher)
// @access  Private
router.get('/profile', auth, async (req, res) => {
  try {
    let profile;
    
    if (req.userType === 'student') {
      profile = await Student.findById(req.user._id)
        .select('-password')
        .populate('assignedClass', 'name grade section subjects');
    } else if (req.userType === 'teacher') {
      profile = await Teacher.findById(req.user._id)
        .select('-password')
        .populate('assignedClass', 'name grade section');
    } else {
      return res.status(400).json({ message: 'Invalid user type' });
    }

    res.json({ ...profile.toObject(), userType: req.userType });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
