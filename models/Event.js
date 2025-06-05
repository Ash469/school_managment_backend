const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Event title is required'],
    trim: true
  },
  schoolId: {
    type: String,
    required: [true, 'School ID is required'],
    uppercase: true,
    index: true // Add index for fast queries
  },
  date: {
    type: Date,
    required: [true, 'Event date is required']
  },
  description: {
    type: String,
    trim: true
  },
  targetAudience: {
    type: String,
    enum: ['students', 'teachers', 'parents', 'all'],
    required: [true, 'Target audience is required']
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
eventSchema.index({ schoolId: 1, date: 1 });
eventSchema.index({ schoolId: 1, createdAt: -1 });

eventSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Event', eventSchema);
