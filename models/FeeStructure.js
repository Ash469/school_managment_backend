const mongoose = require('mongoose');

const feeStructureSchema = new mongoose.Schema({
  schoolId: {
    type: String,
    required: [true, 'School ID is required'],
    uppercase: true,
    index: true
  },
  name: {
    type: String,
    required: [true, 'Fee structure name is required'],
    trim: true
  },
  class: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: [true, 'Class is required']
  },
  academicYear: {
    type: String,
    required: [true, 'Academic year is required'],
    default: '2024-25'
  },
  feeComponents: [{
    name: {
      type: String,
      required: [true, 'Fee component name is required'],
      trim: true
    },
    amount: {
      type: Number,
      required: [true, 'Fee amount is required'],
      min: 0
    },
    type: {
      type: String,
      enum: ['tuition', 'admission', 'examination', 'library', 'sports', 'transport', 'other'],
      required: [true, 'Fee type is required']
    },
    isOptional: {
      type: Boolean,
      default: false
    }
  }],
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  dueDate: {
    type: Date,
    required: [true, 'Due date is required']
  },
  installments: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    dueDate: {
      type: Date,
      required: true
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
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
feeStructureSchema.index({ schoolId: 1, class: 1, academicYear: 1 });
feeStructureSchema.index({ schoolId: 1, createdAt: -1 });
feeStructureSchema.index({ schoolId: 1, isActive: 1 });

// Calculate total amount before validation runs
feeStructureSchema.pre('validate', function(next) {
  this.updatedAt = Date.now();
  
  // Calculate total amount from fee components
  if (this.feeComponents && this.feeComponents.length > 0) {
    this.totalAmount = this.feeComponents.reduce((total, component) => {
      return total + (component.amount || 0);
    }, 0);
  } else {
    this.totalAmount = 0;
  }
  
  next();
});

module.exports = mongoose.model('FeeStructure', feeStructureSchema);
