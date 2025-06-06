const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
  schoolId: {
    type: String,
    required: [true, 'School ID is required'],
    uppercase: true,
    index: true
  },
  class: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: [true, 'Class is required']
  },
  dayOfWeek: {
    type: String,
    enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
    required: [true, 'Day of week is required']
  },
  periods: [{
    periodNumber: {
      type: Number,
      required: true,
      min: 1,
      max: 10
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Teacher',
      required: [true, 'Teacher is required']
    },
    startTime: {
      type: String,
      required: [true, 'Start time is required'],
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Start time must be in HH:MM format']
    },
    endTime: {
      type: String,
      required: [true, 'End time is required'],
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'End time must be in HH:MM format']
    },
    room: {
      type: String,
      trim: true
    }
  }],
  academicYear: {
    type: String,
    required: [true, 'Academic year is required'],
    default: '2024-25'
  },
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

// PRIMARY INDEXES - Core functionality
// Unique constraint to prevent duplicate schedules
scheduleSchema.index({ schoolId: 1, class: 1, dayOfWeek: 1, academicYear: 1 }, { unique: true });

// PERFORMANCE INDEXES - Optimized for dashboard queries

// 1. STUDENT DASHBOARD QUERIES
// When student logs in and wants to see today's schedule
// Query: Find schedule for student's class on specific day
scheduleSchema.index({ 
  schoolId: 1, 
  class: 1, 
  dayOfWeek: 1, 
  isActive: 1 
}, { 
  name: 'student_daily_schedule',
  background: true 
});

// 2. TEACHER DASHBOARD QUERIES  
// When teacher logs in and wants to see today's classes
// Query: Find all schedules where teacher is assigned on specific day
scheduleSchema.index({ 
  schoolId: 1, 
  'periods.teacher': 1, 
  dayOfWeek: 1, 
  isActive: 1 
}, { 
  name: 'teacher_daily_schedule',
  background: true 
});

// 3. ADMIN DASHBOARD QUERIES
// School-wide schedule management
scheduleSchema.index({ 
  schoolId: 1, 
  academicYear: 1, 
  isActive: 1, 
  createdAt: -1 
}, { 
  name: 'admin_schedule_list',
  background: true 
});

// 4. WEEKLY OVERVIEW QUERIES
// Get entire week schedule for class/teacher
scheduleSchema.index({ 
  schoolId: 1, 
  class: 1, 
  academicYear: 1, 
  isActive: 1 
}, { 
  name: 'class_weekly_schedule',
  background: true 
});

// 5. TEACHER WORKLOAD ANALYSIS
// Find all classes a teacher handles across all days
scheduleSchema.index({ 
  schoolId: 1, 
  'periods.teacher': 1, 
  academicYear: 1, 
  isActive: 1 
}, { 
  name: 'teacher_workload_analysis',
  background: true 
});

// 6. TIME-BASED QUERIES
// Find schedules by time slots (useful for room allocation)
scheduleSchema.index({ 
  schoolId: 1, 
  dayOfWeek: 1, 
  'periods.startTime': 1, 
  'periods.endTime': 1 
}, { 
  name: 'time_slot_schedule',
  background: true 
});

// 7. SUBJECT-WISE QUERIES
// Find all classes for a specific subject
scheduleSchema.index({ 
  schoolId: 1, 
  'periods.subject': 1, 
  dayOfWeek: 1 
}, { 
  name: 'subject_schedule',
  background: true 
});

// 8. ROOM UTILIZATION QUERIES
// Track room usage across time slots
scheduleSchema.index({ 
  schoolId: 1, 
  'periods.room': 1, 
  dayOfWeek: 1, 
  'periods.startTime': 1 
}, { 
  name: 'room_utilization',
  background: true,
  sparse: true // Only index documents where room field exists
});

// COMPOUND INDEX for complex dashboard queries
// Multi-dimensional filtering for advanced dashboard features
scheduleSchema.index({ 
  schoolId: 1, 
  dayOfWeek: 1, 
  academicYear: 1, 
  isActive: 1,
  class: 1,
  'periods.teacher': 1
}, { 
  name: 'dashboard_multi_filter',
  background: true 
});

// TEXT INDEX for search functionality
scheduleSchema.index({ 
  'periods.subject': 'text', 
  'periods.room': 'text' 
}, { 
  name: 'schedule_search',
  background: true 
});

// Validation to ensure periods don't overlap
scheduleSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // Sort periods by start time
  this.periods.sort((a, b) => {
    const timeA = a.startTime.split(':').map(Number);
    const timeB = b.startTime.split(':').map(Number);
    return (timeA[0] * 60 + timeA[1]) - (timeB[0] * 60 + timeB[1]);
  });
  
  // Check for overlapping periods
  for (let i = 0; i < this.periods.length - 1; i++) {
    const currentEnd = this.periods[i].endTime.split(':').map(Number);
    const nextStart = this.periods[i + 1].startTime.split(':').map(Number);
    
    const currentEndMinutes = currentEnd[0] * 60 + currentEnd[1];
    const nextStartMinutes = nextStart[0] * 60 + nextStart[1];
    
    if (currentEndMinutes > nextStartMinutes) {
      return next(new Error('Periods cannot overlap'));
    }
  }
  
  next();
});

// STATIC METHODS for optimized queries

// Get student's daily schedule (optimized query)
scheduleSchema.statics.getStudentDailySchedule = function(schoolId, classId, dayOfWeek, academicYear = '2024-25') {
  return this.findOne({
    schoolId,
    class: classId,
    dayOfWeek,
    academicYear,
    isActive: true
  })
  .populate('class', 'name grade section')
  .populate('periods.teacher', 'name email')
  .lean(); // Use lean() for better performance since we don't need mongoose document features
};

// Get teacher's daily schedule (optimized query)
scheduleSchema.statics.getTeacherDailySchedule = function(schoolId, teacherId, dayOfWeek, academicYear = '2024-25') {
  return this.find({
    schoolId,
    'periods.teacher': teacherId,
    dayOfWeek,
    academicYear,
    isActive: true
  })
  .populate('class', 'name grade section')
  .populate('periods.teacher', 'name email')
  .lean();
};

// Get class weekly schedule (optimized query)
scheduleSchema.statics.getClassWeeklySchedule = function(schoolId, classId, academicYear = '2024-25') {
  return this.find({
    schoolId,
    class: classId,
    academicYear,
    isActive: true
  })
  .populate('class', 'name grade section')
  .populate('periods.teacher', 'name email')
  .sort({ dayOfWeek: 1, 'periods.periodNumber': 1 })
  .lean();
};

// Get teacher weekly workload (optimized query)
scheduleSchema.statics.getTeacherWeeklySchedule = function(schoolId, teacherId, academicYear = '2024-25') {
  return this.find({
    schoolId,
    'periods.teacher': teacherId,
    academicYear,
    isActive: true
  })
  .populate('class', 'name grade section')
  .populate('periods.teacher', 'name email')
  .sort({ dayOfWeek: 1, 'periods.periodNumber': 1 })
  .lean();
};

// Get room utilization for a day (hall/lab management)
scheduleSchema.statics.getRoomUtilization = function(schoolId, dayOfWeek, academicYear = '2024-25') {
  return this.find({
    schoolId,
    dayOfWeek,
    academicYear,
    isActive: true,
    'periods.room': { $exists: true, $ne: null }
  })
  .populate('class', 'name grade section')
  .populate('periods.teacher', 'name')
  .sort({ 'periods.startTime': 1 })
  .lean();
};

module.exports = mongoose.model('Schedule', scheduleSchema);
