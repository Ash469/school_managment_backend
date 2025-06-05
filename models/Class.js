const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Class name is required'],
    trim: true
  },
  schoolId: {
    type: String,
    required: [true, 'School ID is required'],
    uppercase: true,
    index: true // Add index for fast queries
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher'
  },
  subjects: [{
    type: String,
    required: true
  }],
  students: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student'
  }],
  grade: {
    type: String,
    required: [true, 'Grade/Standard is required'],
    trim: true
  },
  section: {
    type: String,
    required: [true, 'Section is required'],
    trim: true,
    uppercase: true
  },
  capacity: {
    type: Number,
    default: 40,
    min: 1
  },
  performance: {
    averageGrade: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    attendanceRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
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

// Compound indexes for fast school-specific queries
classSchema.index({ schoolId: 1, createdAt: -1 });
classSchema.index({ schoolId: 1, name: 1 }, { unique: true });

// Add virtual for current enrollment count
classSchema.virtual('currentEnrollment').get(function() {
  return this.students ? this.students.length : 0;
});

// Ensure virtual fields are serialized
classSchema.set('toJSON', { virtuals: true });

classSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Class', classSchema);
