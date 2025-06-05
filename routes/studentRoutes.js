const express = require('express');
const { body, validationResult } = require('express-validator');
const Student = require('../models/Student');
const Class = require('../models/Class');
const { auth } = require('../middleware/auth');

const router = express.Router();

const validateStudent = [
  body('name').trim().isLength({ min: 2 }).withMessage('Student name must be at least 2 characters'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('dateOfBirth').isISO8601().withMessage('Please provide a valid date of birth'),
  body('gender').isIn(['male', 'female', 'other']).withMessage('Invalid gender'),
  body('assignedClass').isMongoId().withMessage('Please provide a valid class ID'),
  body('rollNumber').trim().isLength({ min: 1 }).withMessage('Roll number is required'),
  body('address.street').trim().isLength({ min: 5 }).withMessage('Street address is required'),
  body('address.city').trim().isLength({ min: 2 }).withMessage('City is required'),
  body('address.state').trim().isLength({ min: 2 }).withMessage('State is required'),
  body('address.zipCode').trim().isLength({ min: 5 }).withMessage('ZIP code is required'),
  body('parentInfo.name').trim().isLength({ min: 2 }).withMessage('Parent name is required'),
  body('parentInfo.contact').trim().isLength({ min: 10 }).withMessage('Parent contact is required')
];

// @route   POST /api/students
// @desc    Enroll a new student
// @access  Private
router.post('/', auth, validateStudent, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { 
      name, email, dateOfBirth, gender, bloodGroup, address, 
      assignedClass, rollNumber, parentInfo, medicalInfo 
    } = req.body;

    // Check if student already exists in this school
    const existingStudent = await Student.findOne({ email, schoolId: req.schoolId });
    if (existingStudent) {
      return res.status(400).json({ message: 'Student already exists with this email in your school' });
    }

    // Check if roll number already exists in this school
    const existingRollNumber = await Student.findOne({ rollNumber, schoolId: req.schoolId });
    if (existingRollNumber) {
      return res.status(400).json({ message: 'Roll number already exists in your school' });
    }

    // Verify class exists and belongs to the same school
    const classData = await Class.findOne({ _id: assignedClass, schoolId: req.schoolId });
    if (!classData) {
      return res.status(400).json({ message: 'Invalid class or class does not belong to your school' });
    }

    const student = new Student({
      name,
      email,
      dateOfBirth,
      gender,
      bloodGroup,
      address,
      assignedClass,
      rollNumber,
      parentInfo,
      medicalInfo,
      schoolId: req.schoolId,
      createdBy: req.admin.id
    });

    await student.save();
    await student.populate('assignedClass', 'name subjects');

    // Add student to class
    await Class.findByIdAndUpdate(assignedClass, {
      $addToSet: { students: student._id }
    });

    res.status(201).json({
      message: 'Student enrolled successfully',
      student
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/students
// @desc    Get all students for admin's school
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { classId, search, page = 1, limit = 10 } = req.query;
    
    let filter = { schoolId: req.schoolId };
    
    // Filter by class if provided
    if (classId) {
      filter.assignedClass = classId;
    }
    
    // Search functionality
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { rollNumber: { $regex: search, $options: 'i' } }
      ];
    }

    const students = await Student.find(filter)
      .populate('assignedClass', 'name teacher subjects')
      .populate('assignedClass.teacher', 'name')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Student.countDocuments(filter);

    res.json({
      students,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/students/:id
// @desc    Get single student details
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const student = await Student.findOne({
      _id: req.params.id,
      schoolId: req.schoolId
    })
    .populate('assignedClass', 'name teacher subjects')
    .populate('assignedClass.teacher', 'name email');

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    res.json(student);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/students/:id
// @desc    Update student details
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const { 
      name, email, dateOfBirth, gender, bloodGroup, address,
      assignedClass, rollNumber, parentInfo, academicProgress, 
      medicalInfo, isActive 
    } = req.body;

    // If class is being changed, verify it exists and belongs to the same school
    if (assignedClass) {
      const classData = await Class.findOne({ _id: assignedClass, schoolId: req.schoolId });
      if (!classData) {
        return res.status(400).json({ message: 'Invalid class or class does not belong to your school' });
      }
    }

    const student = await Student.findOneAndUpdate(
      { _id: req.params.id, schoolId: req.schoolId },
      { 
        name, email, dateOfBirth, gender, bloodGroup, address,
        assignedClass, rollNumber, parentInfo, academicProgress,
        medicalInfo, isActive
      },
      { new: true, runValidators: true }
    ).populate('assignedClass', 'name subjects');

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    res.json({
      message: 'Student updated successfully',
      student
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/students/:id/attendance
// @desc    Mark student attendance
// @access  Private
router.post('/:id/attendance', auth, [
  body('date').isISO8601().withMessage('Please provide a valid date'),
  body('status').isIn(['present', 'absent', 'late', 'excused']).withMessage('Invalid attendance status'),
  body('subject').trim().isLength({ min: 1 }).withMessage('Subject is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { date, status, subject, remarks } = req.body;

    const student = await Student.findOneAndUpdate(
      { _id: req.params.id, schoolId: req.schoolId },
      {
        $push: {
          attendance: { date, status, subject, remarks }
        }
      },
      { new: true, runValidators: true }
    );

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    res.json({
      message: 'Attendance marked successfully',
      attendance: student.attendance[student.attendance.length - 1]
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/students/:id/attendance
// @desc    Get student attendance records
// @access  Private
router.get('/:id/attendance', auth, async (req, res) => {
  try {
    const { startDate, endDate, subject } = req.query;
    
    const student = await Student.findOne({
      _id: req.params.id,
      schoolId: req.schoolId
    });

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    let attendance = student.attendance;

    // Filter by date range
    if (startDate && endDate) {
      attendance = attendance.filter(att => {
        const attDate = new Date(att.date);
        return attDate >= new Date(startDate) && attDate <= new Date(endDate);
      });
    }

    // Filter by subject
    if (subject) {
      attendance = attendance.filter(att => att.subject === subject);
    }

    res.json({
      studentId: student._id,
      studentName: student.name,
      attendance,
      statistics: student.statistics
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
