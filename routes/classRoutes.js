const express = require('express');
const { body, validationResult } = require('express-validator');
const Class = require('../models/Class');
const { auth } = require('../middleware/auth');

const router = express.Router();

const validateClass = [
  body('name').trim().isLength({ min: 2 }).withMessage('Class name must be at least 2 characters'),
  body('subjects').isArray().withMessage('Subjects must be an array')
];

// @route   POST /api/classes
// @desc    Create a new class
// @access  Private
router.post('/', auth, validateClass, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, teacher, subjects } = req.body;

    const newClass = new Class({
      name,
      teacher,
      subjects,
      schoolId: req.schoolId, // Auto-assign from authenticated admin
      createdBy: req.admin.id
    });

    await newClass.save();
    await newClass.populate('teacher createdBy', 'name email');

    res.status(201).json({
      message: 'Class created successfully',
      class: newClass
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/classes
// @desc    Get all classes for admin's school
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const classes = await Class.find({ schoolId: req.schoolId })
      .populate('teacher', 'name email')
      .populate('students', 'name email')
      .sort({ createdAt: -1 });

    res.json(classes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/classes/:id
// @desc    Update class details
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, teacher, subjects } = req.body;

    const updatedClass = await Class.findOneAndUpdate(
      { _id: req.params.id, schoolId: req.schoolId },
      { name, teacher, subjects },
      { new: true, runValidators: true }
    ).populate('teacher', 'name email');

    if (!updatedClass) {
      return res.status(404).json({ message: 'Class not found' });
    }

    res.json({
      message: 'Class updated successfully',
      class: updatedClass
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/classes/:id
// @desc    Delete a class
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const deletedClass = await Class.findOneAndDelete({
      _id: req.params.id,
      schoolId: req.schoolId
    });

    if (!deletedClass) {
      return res.status(404).json({ message: 'Class not found' });
    }

    res.json({ message: 'Class deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/classes/:id/performance
// @desc    Get class performance analytics
// @access  Private
router.get('/:id/performance', auth, async (req, res) => {
  try {
    const classData = await Class.findOne({
      _id: req.params.id,
      schoolId: req.schoolId
    }).populate('students', 'academicProgress');

    if (!classData) {
      return res.status(404).json({ message: 'Class not found' });
    }

    res.json({
      classId: classData._id,
      className: classData.name,
      performance: classData.performance,
      studentsCount: classData.students.length
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
