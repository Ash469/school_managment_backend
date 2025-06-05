const express = require('express');
const { body, validationResult } = require('express-validator');
const Teacher = require('../models/Teacher');
const { auth } = require('../middleware/auth');

const router = express.Router();

const validateTeacher = [
  body('name').trim().isLength({ min: 2 }).withMessage('Teacher name must be at least 2 characters'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('qualifications').isArray().withMessage('Qualifications must be an array'),
  body('role').isIn(['class_teacher', 'subject_teacher']).withMessage('Invalid role')
];

// @route   POST /api/teachers
// @desc    Add a new teacher
// @access  Private
router.post('/', auth, validateTeacher, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, qualifications, role, assignedClass } = req.body;

    // Check if teacher already exists in this school
    const existingTeacher = await Teacher.findOne({ email, schoolId: req.schoolId });
    if (existingTeacher) {
      return res.status(400).json({ message: 'Teacher already exists with this email in your school' });
    }

    const teacher = new Teacher({
      name,
      email,
      qualifications,
      role,
      assignedClass,
      schoolId: req.schoolId, // Auto-assign from authenticated admin
      createdBy: req.admin.id
    });

    await teacher.save();
    await teacher.populate('assignedClass', 'name');

    res.status(201).json({
      message: 'Teacher added successfully',
      teacher
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/teachers
// @desc    Get all teachers for admin's school
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const teachers = await Teacher.find({ schoolId: req.schoolId })
      .populate('assignedClass', 'name')
      .sort({ createdAt: -1 });

    res.json(teachers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/teachers/:id
// @desc    Update teacher details
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, email, qualifications, role, performanceMetrics, assignedClass } = req.body;

    const teacher = await Teacher.findOneAndUpdate(
      { _id: req.params.id, schoolId: req.schoolId },
      { name, email, qualifications, role, performanceMetrics, assignedClass },
      { new: true, runValidators: true }
    ).populate('assignedClass', 'name');

    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    res.json({
      message: 'Teacher updated successfully',
      teacher
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/teachers/:id
// @desc    Remove a teacher
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const teacher = await Teacher.findOneAndDelete({
      _id: req.params.id,
      schoolId: req.schoolId
    });

    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    res.json({ message: 'Teacher removed successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/teachers/:id/performance
// @desc    Get teacher performance metrics
// @access  Private
router.get('/:id/performance', auth, async (req, res) => {
  try {
    const teacher = await Teacher.findOne({
      _id: req.params.id,
      schoolId: req.schoolId
    });

    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    res.json({
      teacherId: teacher._id,
      teacherName: teacher.name,
      performanceMetrics: teacher.performanceMetrics
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
