const express = require('express');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const { auth, authorize } = require('../middleware/auth');
const { generateSchoolId } = require('../utils/schoolIdGenerator');

const router = express.Router();

// Validation middleware
const validateAdmin = [
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('phone').isMobilePhone().withMessage('Please provide a valid phone number'),
  body('schoolName').trim().isLength({ min: 2 }).withMessage('School name is required'),
  body('schoolId').optional().matches(/^SCH[0-9]{3,5}$/).withMessage('School ID must be in format SCH001-SCH99999')
];
// @route   POST /api/admin/register
// @desc    Register a new admin
// @access  Public
router.post('/register', validateAdmin, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, phone, schoolName, role, permissions, schoolId } = req.body;

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({ message: 'Admin already exists with this email' });
    }

    // Generate schoolId if not provided
    let finalSchoolId = schoolId;
    if (!finalSchoolId) {
      finalSchoolId = await generateSchoolId();
    } else {
      // Check if provided schoolId already exists
      const existingSchoolId = await Admin.findOne({ schoolId: finalSchoolId.toUpperCase() });
      if (existingSchoolId) {
        return res.status(400).json({ message: 'School ID already exists' });
      }
    }

    // Create new admin
    const admin = new Admin({
      name,
      email,
      password,
      phone,
      schoolName,
      schoolId: finalSchoolId,
      role: role || 'school_admin',
      permissions: permissions || ['manage_students', 'manage_teachers']
    });

    await admin.save();

    // Generate JWT token
    const token = jwt.sign(
      { id: admin._id, role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'Admin registered successfully',
      token,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        schoolName: admin.schoolName,
        schoolId: admin.schoolId,
        role: admin.role,
        permissions: admin.permissions
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/admin/login
// @desc    Login admin
// @access  Public
router.post('/login', [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').exists().withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find admin by email
    const admin = await Admin.findOne({ email });
    if (!admin || !admin.isActive) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: admin._id, role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      token,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        schoolName: admin.schoolName,
        schoolId: admin.schoolId,
        role: admin.role,
        permissions: admin.permissions
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/profile
// @desc    Get admin profile
// @access  Private
router.get('/profile', auth, async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin.id).select('-password');
    res.json(admin);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin
// @desc    Get all admins
// @access  Private (Super Admin only)
router.get('/', auth, authorize('super_admin'), async (req, res) => {
  try {
    const admins = await Admin.find().select('-password').sort({ createdAt: -1 });
    res.json(admins);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/admin/:id
// @desc    Update admin
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, email, phone, permissions, isActive, schoolName } = req.body;
    const adminId = req.params.id;

    // Check if user is updating their own profile or is super admin
    if (req.admin.id !== adminId && req.admin.role !== 'super_admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const admin = await Admin.findByIdAndUpdate(
      adminId,
      { name, email, phone, permissions, isActive, schoolName },
      { new: true, runValidators: true }
    ).select('-password');

    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    res.json({ message: 'Admin updated successfully', admin });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/admin/:id
// @desc    Delete admin
// @access  Private (Super Admin only)
router.delete('/:id', auth, authorize('super_admin'), async (req, res) => {
  try {
    const admin = await Admin.findByIdAndDelete(req.params.id);
    
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    res.json({ message: 'Admin deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
