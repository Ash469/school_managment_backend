const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  schoolId: {
    type: String,
    required: [true, 'School ID is required'],
    uppercase: true,
    index: true
  },
  paymentType: {
    type: String,
    enum: ['fee', 'salary'],
    required: [true, 'Payment type is required']
  },
  // For student fee payments
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: function() { return this.paymentType === 'fee'; }
  },
  feeStructure: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FeeStructure',
    required: function() { return this.paymentType === 'fee'; }
  },
  // For teacher salary payments
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
    required: function() { return this.paymentType === 'salary'; }
  },
  amount: {
    type: Number,
    required: [true, 'Payment amount is required'],
    min: 0
  },
  paidAmount: {
    type: Number,
    required: [true, 'Paid amount is required'],
    min: 0,
    default: 0
  },
  remainingAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  paymentDate: {
    type: Date,
    required: [true, 'Payment date is required']
  },
  dueDate: {
    type: Date,
    required: [true, 'Due date is required']
  },
  status: {
    type: String,
    enum: ['pending', 'partial', 'completed', 'overdue'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'bank_transfer', 'online', 'cheque', 'card', 'pending'],
    required: [true, 'Payment method is required'],
    default: 'pending'
  },
  transactionId: {
    type: String,
    trim: true
  },
  remarks: {
    type: String,
    trim: true
  },
  // For salary payments
  salaryMonth: {
    type: String,
    required: function() { return this.paymentType === 'salary'; },
    match: [/^\d{4}-(0[1-9]|1[0-2])$/, 'Salary month must be in YYYY-MM format']
  },
  // Payment history for partial payments
  paymentHistory: [{
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    paymentDate: {
      type: Date,
      required: true
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'bank_transfer', 'online', 'cheque', 'card'],
      required: true
    },
    transactionId: String,
    remarks: String,
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      required: true
    }
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for fast queries
paymentSchema.index({ schoolId: 1, paymentType: 1, status: 1 });
paymentSchema.index({ schoolId: 1, student: 1, paymentType: 1 });
paymentSchema.index({ schoolId: 1, teacher: 1, paymentType: 1 });
paymentSchema.index({ schoolId: 1, dueDate: 1, status: 1 });
paymentSchema.index({ schoolId: 1, salaryMonth: 1 });

// Calculate remaining amount and status before validation runs
paymentSchema.pre('validate', function(next) {
  this.updatedAt = Date.now();
  
  // Ensure paidAmount is not greater than amount
  if (this.paidAmount > this.amount) {
    this.paidAmount = this.amount;
  }
  
  // Calculate remaining amount
  this.remainingAmount = this.amount - this.paidAmount;
  
  // Update status based on payment
  if (this.paidAmount === 0) {
    this.status = new Date() > this.dueDate ? 'overdue' : 'pending';
  } else if (this.paidAmount < this.amount) {
    this.status = 'partial';
  } else {
    this.status = 'completed';
  }
  
  next();
});

module.exports = mongoose.model('Payment', paymentSchema);
