const express = require('express');
const { body, validationResult } = require('express-validator');
const FeeStructure = require('../models/FeeStructure');
const Payment = require('../models/Payment');
const Class = require('../models/Class');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const { auth, adminOnly } = require('../middleware/auth');

const router = express.Router();

const validateFeeStructure = [
  body('name').trim().isLength({ min: 2 }).withMessage('Fee structure name is required'),
  body('class').isMongoId().withMessage('Please provide a valid class ID'),
  body('feeComponents').isArray({ min: 1 }).withMessage('At least one fee component is required'),
  body('feeComponents.*.name').trim().isLength({ min: 1 }).withMessage('Fee component name is required'),
  body('feeComponents.*.amount').isFloat({ min: 0 }).withMessage('Fee amount must be a positive number'),
  body('dueDate').isISO8601().withMessage('Please provide a valid due date')
];

// @route   POST /api/fees/structure
// @desc    Create fee structure for a class
// @access  Private (Admin only)
router.post('/structure', auth, adminOnly, validateFeeStructure, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, class: classId, feeComponents, dueDate, installments, academicYear } = req.body;

    // Verify class exists and belongs to the same school
    const classData = await Class.findOne({ _id: classId, schoolId: req.schoolId });
    if (!classData) {
      return res.status(400).json({ message: 'Invalid class or class does not belong to your school' });
    }

    // Check if fee structure already exists for this class and academic year
    const existingFeeStructure = await FeeStructure.findOne({
      schoolId: req.schoolId,
      class: classId,
      academicYear: academicYear || '2024-25',
      name
    });

    if (existingFeeStructure) {
      return res.status(400).json({ message: 'Fee structure with this name already exists for this class' });
    }

    const feeStructure = new FeeStructure({
      schoolId: req.schoolId,
      name,
      class: classId,
      feeComponents,
      dueDate,
      installments: installments || [],
      academicYear: academicYear || '2024-25',
      createdBy: req.admin._id
    });

    await feeStructure.save();
    await feeStructure.populate('class', 'name grade section');

    // Create pending payments for all students in this class
    const students = await Student.find({ assignedClass: classId, schoolId: req.schoolId, isActive: true });
    
    const paymentPromises = students.map(student => {
      const payment = new Payment({
        schoolId: req.schoolId,
        paymentType: 'fee',
        student: student._id,
        feeStructure: feeStructure._id,
        amount: feeStructure.totalAmount,
        paidAmount: 0,
        paymentDate: new Date(),
        dueDate: feeStructure.dueDate,
        paymentMethod: 'pending',
        createdBy: req.admin._id
      });
      return payment.save();
    });

    await Promise.all(paymentPromises);

    res.status(201).json({
      message: 'Fee structure created successfully',
      feeStructure,
      studentsCount: students.length
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/fees/structure
// @desc    Get all fee structures for admin's school
// @access  Private (Admin only)
router.get('/structure', auth, adminOnly, async (req, res) => {
  try {
    const { classId, academicYear } = req.query;
    
    let filter = { schoolId: req.schoolId };
    if (classId) filter.class = classId;
    if (academicYear) filter.academicYear = academicYear;

    const feeStructures = await FeeStructure.find(filter)
      .populate('class', 'name grade section')
      .sort({ createdAt: -1 });

    res.json(feeStructures);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/fees/structure/:id/payments
// @desc    Get payment status for a fee structure
// @access  Private (Admin only)
router.get('/structure/:id/payments', auth, adminOnly, async (req, res) => {
  try {
    const feeStructure = await FeeStructure.findOne({
      _id: req.params.id,
      schoolId: req.schoolId
    }).populate('class', 'name grade section');

    if (!feeStructure) {
      return res.status(404).json({ message: 'Fee structure not found' });
    }

    const payments = await Payment.find({
      feeStructure: req.params.id,
      schoolId: req.schoolId,
      paymentType: 'fee'
    })
    .populate('student', 'name email rollNumber')
    .sort({ status: 1, dueDate: 1 });

    // Calculate statistics
    const stats = {
      totalStudents: payments.length,
      paidStudents: payments.filter(p => p.status === 'completed').length,
      partialStudents: payments.filter(p => p.status === 'partial').length,
      pendingStudents: payments.filter(p => p.status === 'pending').length,
      overdueStudents: payments.filter(p => p.status === 'overdue').length,
      totalAmount: payments.reduce((sum, p) => sum + p.amount, 0),
      paidAmount: payments.reduce((sum, p) => sum + p.paidAmount, 0),
      remainingAmount: payments.reduce((sum, p) => sum + p.remainingAmount, 0)
    };

    res.json({
      feeStructure,
      payments,
      statistics: stats
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/fees/payment
// @desc    Record fee payment
// @access  Private (Admin only)
router.post('/payment', auth, adminOnly, [
  body('paymentId').isMongoId().withMessage('Please provide a valid payment ID'),
  body('amount').isFloat({ min: 0 }).withMessage('Payment amount must be positive'),
  body('paymentMethod').isIn(['cash', 'bank_transfer', 'online', 'cheque', 'card']).withMessage('Invalid payment method'),
  body('paymentDate').isISO8601().withMessage('Please provide a valid payment date')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { paymentId, amount, paymentMethod, transactionId, remarks, paymentDate } = req.body;

    const payment = await Payment.findOne({
      _id: paymentId,
      schoolId: req.schoolId,
      paymentType: 'fee'
    }).populate('student', 'name email rollNumber');

    if (!payment) {
      return res.status(404).json({ message: 'Payment record not found' });
    }

    if (payment.paidAmount + amount > payment.amount) {
      return res.status(400).json({ message: 'Payment amount exceeds remaining balance' });
    }

    // Add to payment history
    payment.paymentHistory.push({
      amount,
      paymentDate: new Date(paymentDate),
      paymentMethod,
      transactionId,
      remarks,
      recordedBy: req.admin._id
    });

    // Update payment details
    payment.paidAmount += amount;
    payment.paymentDate = new Date(paymentDate);
    payment.paymentMethod = paymentMethod;
    if (transactionId) payment.transactionId = transactionId;
    if (remarks) payment.remarks = remarks;

    await payment.save();

    res.json({
      message: 'Payment recorded successfully',
      payment
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/fees/student/my-fees
// @desc    Get student's fee records
// @access  Private (Student only)
router.get('/student/my-fees', auth, async (req, res) => {
  try {
    if (req.userType !== 'student') {
      return res.status(403).json({ message: 'Access denied. Students only.' });
    }

    const payments = await Payment.find({
      student: req.student._id,
      schoolId: req.schoolId,
      paymentType: 'fee'
    })
    .populate('feeStructure', 'name feeComponents dueDate academicYear')
    .sort({ createdAt: -1 });

    res.json(payments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/fees/salary/structure
// @desc    Create salary payment for teacher
// @access  Private (Admin only)
router.post('/salary/structure', auth, adminOnly, [
  body('teacher').isMongoId().withMessage('Please provide a valid teacher ID'),
  body('amount').isFloat({ min: 0 }).withMessage('Salary amount must be positive'),
  body('salaryMonth').matches(/^\d{4}-(0[1-9]|1[0-2])$/).withMessage('Salary month must be in YYYY-MM format'),
  body('dueDate').isISO8601().withMessage('Please provide a valid due date')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { teacher: teacherId, amount, salaryMonth, dueDate, remarks } = req.body;

    // Verify teacher exists and belongs to the same school
    const teacher = await Teacher.findOne({ _id: teacherId, schoolId: req.schoolId });
    if (!teacher) {
      return res.status(400).json({ message: 'Teacher not found or does not belong to your school' });
    }

    // Check if salary already exists for this month
    const existingSalary = await Payment.findOne({
      schoolId: req.schoolId,
      teacher: teacherId,
      paymentType: 'salary',
      salaryMonth
    });

    if (existingSalary) {
      return res.status(400).json({ message: 'Salary record already exists for this month' });
    }

    const payment = new Payment({
      schoolId: req.schoolId,
      paymentType: 'salary',
      teacher: teacherId,
      amount,
      paidAmount: 0,
      paymentDate: new Date(),
      dueDate: new Date(dueDate),
      salaryMonth,
      paymentMethod: 'pending',
      remarks,
      createdBy: req.admin._id
    });

    await payment.save();
    await payment.populate('teacher', 'name email');

    res.status(201).json({
      message: 'Salary structure created successfully',
      payment
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/fees/salary
// @desc    Get salary payment status for all teachers
// @access  Private (Admin only)
router.get('/salary', auth, adminOnly, async (req, res) => {
  try {
    const { month, status } = req.query;
    
    let filter = { 
      schoolId: req.schoolId, 
      paymentType: 'salary' 
    };
    
    if (month) filter.salaryMonth = month;
    if (status) filter.status = status;

    const salaryPayments = await Payment.find(filter)
      .populate('teacher', 'name email role')
      .sort({ salaryMonth: -1, createdAt: -1 });

    // Calculate statistics
    const stats = {
      totalTeachers: salaryPayments.length,
      paidTeachers: salaryPayments.filter(p => p.status === 'completed').length,
      partialTeachers: salaryPayments.filter(p => p.status === 'partial').length,
      pendingTeachers: salaryPayments.filter(p => p.status === 'pending').length,
      overdueTeachers: salaryPayments.filter(p => p.status === 'overdue').length,
      totalAmount: salaryPayments.reduce((sum, p) => sum + p.amount, 0),
      paidAmount: salaryPayments.reduce((sum, p) => sum + p.paidAmount, 0),
      remainingAmount: salaryPayments.reduce((sum, p) => sum + p.remainingAmount, 0)
    };

    res.json({
      salaryPayments,
      statistics: stats
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/fees/salary/payment
// @desc    Record salary payment
// @access  Private (Admin only)
router.post('/salary/payment', auth, adminOnly, [
  body('paymentId').isMongoId().withMessage('Please provide a valid payment ID'),
  body('amount').isFloat({ min: 0 }).withMessage('Payment amount must be positive'),
  body('paymentMethod').isIn(['cash', 'bank_transfer', 'online', 'cheque', 'card']).withMessage('Invalid payment method'),
  body('paymentDate').isISO8601().withMessage('Please provide a valid payment date')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { paymentId, amount, paymentMethod, transactionId, remarks, paymentDate } = req.body;

    const payment = await Payment.findOne({
      _id: paymentId,
      schoolId: req.schoolId,
      paymentType: 'salary'
    }).populate('teacher', 'name email');

    if (!payment) {
      return res.status(404).json({ message: 'Salary payment record not found' });
    }

    if (payment.paidAmount + amount > payment.amount) {
      return res.status(400).json({ message: 'Payment amount exceeds remaining salary balance' });
    }

    // Add to payment history
    payment.paymentHistory.push({
      amount,
      paymentDate: new Date(paymentDate),
      paymentMethod,
      transactionId,
      remarks,
      recordedBy: req.admin._id
    });

    // Update payment details
    payment.paidAmount += amount;
    payment.paymentDate = new Date(paymentDate);
    payment.paymentMethod = paymentMethod;
    if (transactionId) payment.transactionId = transactionId;
    if (remarks) payment.remarks = remarks;

    await payment.save();

    res.json({
      message: 'Salary payment recorded successfully',
      payment
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/fees/teacher/my-salary
// @desc    Get teacher's salary records
// @access  Private (Teacher only)
router.get('/teacher/my-salary', auth, async (req, res) => {
  try {
    if (req.userType !== 'teacher') {
      return res.status(403).json({ message: 'Access denied. Teachers only.' });
    }

    const payments = await Payment.find({
      teacher: req.teacher._id,
      schoolId: req.schoolId,
      paymentType: 'salary'
    }).sort({ salaryMonth: -1 });

    res.json(payments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
