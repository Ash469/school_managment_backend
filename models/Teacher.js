const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const teacherSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Teacher name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6
  },
  schoolId: {
    type: String,
    required: [true, 'School ID is required'],
    uppercase: true,
    index: true // Add index for fast queries
  },
  qualifications: [{
    type: String,
    required: true
  }],
  role: {
    type: String,
    enum: ['class_teacher', 'subject_teacher'],
    required: [true, 'Teacher role is required']
  },
  performanceMetrics: {
    teachingScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 10
    },
    punctuality: {
      type: Number,
      default: 0,
      min: 0,
      max: 10
    }
  },
  assignedClass: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    default: null
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
  },
  salary: {
    amount: {
      type: Number,
      required: [true, 'Salary amount is required'],
      min: 0
    },
    currency: {
      type: String,
      default: 'USD'
    }
  }
});

// Compound index for fast school-specific queries
teacherSchema.index({ schoolId: 1, createdAt: -1 });
teacherSchema.index({ schoolId: 1, email: 1 }, { unique: true });

teacherSchema.pre('save', async function(next) {
  this.updatedAt = Date.now();
  
  // Hash password if modified
  if (this.isModified('password')) {
    try {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
    } catch (error) {
      return next(error);
    }
  }
  
  next();
});

// Compare password method
teacherSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('Teacher', teacherSchema);
