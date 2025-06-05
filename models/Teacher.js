const mongoose = require('mongoose');

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
  }
});

// Compound index for fast school-specific queries
teacherSchema.index({ schoolId: 1, createdAt: -1 });
teacherSchema.index({ schoolId: 1, email: 1 }, { unique: true });

teacherSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Teacher', teacherSchema);
