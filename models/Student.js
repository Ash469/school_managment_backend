const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const studentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Student name is required'],
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
  // Personal Information
  dateOfBirth: {
    type: Date,
    required: [true, 'Date of birth is required']
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    required: [true, 'Gender is required']
  },
  bloodGroup: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    trim: true
  },
  // Address Information
  address: {
    street: {
      type: String,
      required: [true, 'Street address is required'],
      trim: true
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true
    },
    state: {
      type: String,
      required: [true, 'State is required'],
      trim: true
    },
    zipCode: {
      type: String,
      required: [true, 'ZIP code is required'],
      trim: true
    },
    country: {
      type: String,
      required: [true, 'Country is required'],
      trim: true,
      default: 'USA'
    }
  },
  // Class Assignment
  assignedClass: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class'
    // Remove required validation to allow creation without class assignment
  },
  rollNumber: {
    type: String,
    required: [true, 'Roll number is required'],
    trim: true
  },
  // Parent Information
  parentInfo: {
    name: {
      type: String,
      required: [true, 'Parent name is required'],
      trim: true
    },
    contact: {
      type: String,
      required: [true, 'Parent contact is required'],
      trim: true
    },
    email: {
      type: String,
      lowercase: true,
      trim: true
    },
    occupation: {
      type: String,
      trim: true
    }
  },
  // Academic Progress
  academicProgress: [{
    subject: {
      type: String,
      required: true
    },
    grade: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    semester: {
      type: String,
      required: true
    },
    remarks: {
      type: String,
      trim: true
    }
  }],
  // Attendance Tracking
  attendance: [{
    date: {
      type: Date,
      required: true
    },
    status: {
      type: String,
      enum: ['present', 'absent', 'late', 'excused'],
      required: true
    },
    subject: {
      type: String,
      required: true
    },
    remarks: {
      type: String,
      trim: true
    }
  }],
  // Overall Statistics
  statistics: {
    totalDaysPresent: {
      type: Number,
      default: 0
    },
    totalDaysAbsent: {
      type: Number,
      default: 0
    },
    attendancePercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    overallGrade: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
  },
  // Medical Information
  medicalInfo: {
    allergies: [{
      type: String,
      trim: true
    }],
    medications: [{
      name: String,
      dosage: String,
      frequency: String
    }],
    emergencyContact: {
      name: String,
      relationship: String,
      phone: String
    }
  },
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  admissionDate: {
    type: Date,
    default: Date.now
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
studentSchema.index({ schoolId: 1, createdAt: -1 });
studentSchema.index({ schoolId: 1, email: 1 }, { unique: true });
studentSchema.index({ schoolId: 1, assignedClass: 1 });
studentSchema.index({ schoolId: 1, rollNumber: 1 }, { unique: true });

// Hash password before saving
studentSchema.pre('save', async function(next) {
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
  
  // Calculate attendance statistics
  if (this.attendance && this.attendance.length > 0) {
    const totalDays = this.attendance.length;
    const presentDays = this.attendance.filter(att => 
      att.status === 'present' || att.status === 'late'
    ).length;
    
    this.statistics.totalDaysPresent = presentDays;
    this.statistics.totalDaysAbsent = totalDays - presentDays;
    this.statistics.attendancePercentage = Math.round((presentDays / totalDays) * 100);
  }
  
  // Calculate overall grade
  if (this.academicProgress && this.academicProgress.length > 0) {
    const totalGrades = this.academicProgress.reduce((sum, progress) => sum + progress.grade, 0);
    this.statistics.overallGrade = Math.round(totalGrades / this.academicProgress.length);
  }
  
  next();
});

// Compare password method
studentSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('Student', studentSchema);
