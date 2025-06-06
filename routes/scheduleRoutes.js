const express = require('express');
const { body, validationResult } = require('express-validator');
const Schedule = require('../models/Schedule');
const Class = require('../models/Class');
const Teacher = require('../models/Teacher');
const { auth } = require('../middleware/auth');

const router = express.Router();

const validateSchedule = [
  body('class').isMongoId().withMessage('Please provide a valid class ID'),
  body('dayOfWeek').isIn(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']).withMessage('Invalid day of week'),
  body('periods').isArray({ min: 1 }).withMessage('At least one period is required'),
  body('periods.*.periodNumber').isInt({ min: 1, max: 10 }).withMessage('Period number must be between 1 and 10'),
  body('periods.*.subject').trim().isLength({ min: 1 }).withMessage('Subject is required'),
  body('periods.*.teacher').isMongoId().withMessage('Please provide a valid teacher ID'),
  body('periods.*.startTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Start time must be in HH:MM format'),
  body('periods.*.endTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('End time must be in HH:MM format')
];

// @route   POST /api/schedules
// @desc    Create class schedule
// @access  Private
router.post('/', auth, validateSchedule, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { class: classId, dayOfWeek, periods, academicYear } = req.body;

    // Verify class exists and belongs to the same school
    const classData = await Class.findOne({ _id: classId, schoolId: req.schoolId });
    if (!classData) {
      return res.status(400).json({ message: 'Invalid class or class does not belong to your school' });
    }

    // Verify all teachers exist and belong to the same school
    const teacherIds = periods.map(p => p.teacher);
    const teachers = await Teacher.find({ _id: { $in: teacherIds }, schoolId: req.schoolId });
    if (teachers.length !== teacherIds.length) {
      return res.status(400).json({ message: 'One or more teachers do not belong to your school' });
    }

    // Check if schedule already exists for this class and day
    const existingSchedule = await Schedule.findOne({
      schoolId: req.schoolId,
      class: classId,
      dayOfWeek,
      academicYear: academicYear || '2024-25'
    });

    if (existingSchedule) {
      return res.status(400).json({ message: 'Schedule already exists for this class and day' });
    }

    const schedule = new Schedule({
      schoolId: req.schoolId,
      class: classId,
      dayOfWeek,
      periods,
      academicYear: academicYear || '2024-25',
      createdBy: req.admin.id
    });

    await schedule.save();
    await schedule.populate([
      { path: 'class', select: 'name grade section' },
      { path: 'periods.teacher', select: 'name email' }
    ]);

    res.status(201).json({
      message: 'Schedule created successfully',
      schedule
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/schedules
// @desc    Get all schedules for admin's school
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { classId, dayOfWeek, academicYear } = req.query;
    
    let filter = { schoolId: req.schoolId };
    
    if (classId) filter.class = classId;
    if (dayOfWeek) filter.dayOfWeek = dayOfWeek;
    if (academicYear) filter.academicYear = academicYear;

    const schedules = await Schedule.find(filter)
      .populate('class', 'name grade section')
      .populate('periods.teacher', 'name email')
      .sort({ dayOfWeek: 1, 'periods.periodNumber': 1 });

    res.json(schedules);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/schedules/class/:classId
// @desc    Get weekly schedule for a specific class
// @access  Private
router.get('/class/:classId', auth, async (req, res) => {
  try {
    const { academicYear } = req.query;
    
    const schedules = await Schedule.find({
      schoolId: req.schoolId,
      class: req.params.classId,
      academicYear: academicYear || '2024-25'
    })
    .populate('class', 'name grade section')
    .populate('periods.teacher', 'name email')
    .sort({ dayOfWeek: 1, 'periods.periodNumber': 1 });

    if (!schedules.length) {
      return res.status(404).json({ message: 'No schedule found for this class' });
    }

    res.json(schedules);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/schedules/teacher/:teacherId
// @desc    Get schedule for a specific teacher
// @access  Private
router.get('/teacher/:teacherId', auth, async (req, res) => {
  try {
    const { academicYear } = req.query;
    
    const schedules = await Schedule.find({
      schoolId: req.schoolId,
      'periods.teacher': req.params.teacherId,
      academicYear: academicYear || '2024-25'
    })
    .populate('class', 'name grade section')
    .populate('periods.teacher', 'name email')
    .sort({ dayOfWeek: 1, 'periods.periodNumber': 1 });

    res.json(schedules);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/schedules/:id
// @desc    Update class schedule
// @access  Private
router.put('/:id', auth, validateSchedule, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { class: classId, dayOfWeek, periods, academicYear } = req.body;

    // Verify class exists and belongs to the same school
    const classData = await Class.findOne({ _id: classId, schoolId: req.schoolId });
    if (!classData) {
      return res.status(400).json({ message: 'Invalid class or class does not belong to your school' });
    }

    // Verify all teachers exist and belong to the same school
    const teacherIds = periods.map(p => p.teacher);
    const teachers = await Teacher.find({ _id: { $in: teacherIds }, schoolId: req.schoolId });
    if (teachers.length !== teacherIds.length) {
      return res.status(400).json({ message: 'One or more teachers do not belong to your school' });
    }

    const schedule = await Schedule.findOneAndUpdate(
      { _id: req.params.id, schoolId: req.schoolId },
      { class: classId, dayOfWeek, periods, academicYear },
      { new: true, runValidators: true }
    )
    .populate('class', 'name grade section')
    .populate('periods.teacher', 'name email');

    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }

    res.json({
      message: 'Schedule updated successfully',
      schedule
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/schedules/:id
// @desc    Delete class schedule
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const schedule = await Schedule.findOneAndDelete({
      _id: req.params.id,
      schoolId: req.schoolId
    });

    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }

    res.json({ message: 'Schedule deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/schedules/weekly-overview
// @desc    Get weekly overview of all classes
// @access  Private
router.get('/weekly-overview', auth, async (req, res) => {
  try {
    const { academicYear } = req.query;
    
    const schedules = await Schedule.find({
      schoolId: req.schoolId,
      academicYear: academicYear || '2024-25'
    })
    .populate('class', 'name grade section')
    .populate('periods.teacher', 'name email')
    .sort({ dayOfWeek: 1, 'periods.periodNumber': 1 });

    // Group by day of week
    const weeklyOverview = {
      monday: [],
      tuesday: [],
      wednesday: [],
      thursday: [],
      friday: [],
      saturday: []
    };

    schedules.forEach(schedule => {
      weeklyOverview[schedule.dayOfWeek].push(schedule);
    });

    res.json(weeklyOverview);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/schedules/student/:classId/daily/:dayOfWeek
// @desc    Get student's daily schedule (OPTIMIZED for student dashboard)
// @access  Private
router.get('/student/:classId/daily/:dayOfWeek', auth, async (req, res) => {
  try {
    const { classId, dayOfWeek } = req.params;
    const { academicYear } = req.query;

    // Validate class belongs to school
    const classData = await Class.findOne({ _id: classId, schoolId: req.schoolId });
    if (!classData) {
      return res.status(404).json({ message: 'Class not found or does not belong to your school' });
    }

    // Use optimized static method
    const schedule = await Schedule.getStudentDailySchedule(
      req.schoolId, 
      classId, 
      dayOfWeek.toLowerCase(), 
      academicYear
    );

    if (!schedule) {
      return res.status(404).json({ message: 'No schedule found for this day' });
    }

    res.json({
      dayOfWeek: dayOfWeek.toLowerCase(),
      class: schedule.class,
      periods: schedule.periods,
      totalPeriods: schedule.periods.length
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/schedules/teacher/:teacherId/daily/:dayOfWeek
// @desc    Get teacher's daily schedule (OPTIMIZED for teacher dashboard)
// @access  Private
router.get('/teacher/:teacherId/daily/:dayOfWeek', auth, async (req, res) => {
  try {
    const { teacherId, dayOfWeek } = req.params;
    const { academicYear } = req.query;

    // Validate teacher belongs to school
    const teacher = await Teacher.findOne({ _id: teacherId, schoolId: req.schoolId });
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found or does not belong to your school' });
    }

    // Use optimized static method
    const schedules = await Schedule.getTeacherDailySchedule(
      req.schoolId, 
      teacherId, 
      dayOfWeek.toLowerCase(), 
      academicYear
    );

    // Transform data for teacher dashboard
    const teacherSchedule = schedules.map(schedule => ({
      class: schedule.class,
      periods: schedule.periods.filter(period => 
        period.teacher._id.toString() === teacherId
      )
    })).filter(item => item.periods.length > 0);

    // Flatten and sort all periods by time
    const allPeriods = teacherSchedule.reduce((acc, item) => {
      item.periods.forEach(period => {
        acc.push({
          ...period,
          className: item.class.name,
          classGrade: item.class.grade,
          classSection: item.class.section
        });
      });
      return acc;
    }, []).sort((a, b) => {
      const timeA = a.startTime.split(':').map(Number);
      const timeB = b.startTime.split(':').map(Number);
      return (timeA[0] * 60 + timeA[1]) - (timeB[0] * 60 + timeB[1]);
    });

    res.json({
      dayOfWeek: dayOfWeek.toLowerCase(),
      teacher: {
        name: teacher.name,
        email: teacher.email
      },
      periods: allPeriods,
      totalPeriods: allPeriods.length,
      totalClasses: teacherSchedule.length
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/schedules/class/:classId/weekly
// @desc    Get class weekly schedule (OPTIMIZED)
// @access  Private
router.get('/class/:classId/weekly', auth, async (req, res) => {
  try {
    const { classId } = req.params;
    const { academicYear } = req.query;

    // Use optimized static method
    const schedules = await Schedule.getClassWeeklySchedule(
      req.schoolId, 
      classId, 
      academicYear
    );

    if (!schedules.length) {
      return res.status(404).json({ message: 'No weekly schedule found for this class' });
    }

    // Group by day of week
    const weeklySchedule = {
      monday: null,
      tuesday: null,
      wednesday: null,
      thursday: null,
      friday: null,
      saturday: null
    };

    schedules.forEach(schedule => {
      weeklySchedule[schedule.dayOfWeek] = {
        periods: schedule.periods,
        totalPeriods: schedule.periods.length
      };
    });

    res.json({
      class: schedules[0].class,
      weeklySchedule,
      academicYear: academicYear || '2024-25'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/schedules/teacher/:teacherId/weekly
// @desc    Get teacher's weekly workload (OPTIMIZED)
// @access  Private
router.get('/teacher/:teacherId/weekly', auth, async (req, res) => {
  try {
    const { teacherId } = req.params;
    const { academicYear } = req.query;

    // Use optimized static method
    const schedules = await Schedule.getTeacherWeeklySchedule(
      req.schoolId, 
      teacherId, 
      academicYear
    );

    // Process and group by day
    const weeklyWorkload = {
      monday: [],
      tuesday: [],
      wednesday: [],
      thursday: [],
      friday: [],
      saturday: []
    };

    let totalPeriodsPerWeek = 0;
    const classesHandled = new Set();

    schedules.forEach(schedule => {
      const teacherPeriods = schedule.periods.filter(period => 
        period.teacher._id.toString() === teacherId
      );

      if (teacherPeriods.length > 0) {
        weeklyWorkload[schedule.dayOfWeek].push({
          class: schedule.class,
          periods: teacherPeriods
        });
        
        totalPeriodsPerWeek += teacherPeriods.length;
        classesHandled.add(schedule.class.name);
      }
    });

    res.json({
      teacherId,
      weeklyWorkload,
      statistics: {
        totalPeriodsPerWeek,
        totalClassesHandled: classesHandled.size,
        averagePeriodsPerDay: Math.round(totalPeriodsPerWeek / 6 * 10) / 10
      },
      academicYear: academicYear || '2024-25'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/schedules/room-utilization/:dayOfWeek
// @desc    Get room utilization for a specific day (OPTIMIZED)
// @access  Private
router.get('/room-utilization/:dayOfWeek', auth, async (req, res) => {
  try {
    const { dayOfWeek } = req.params;
    const { academicYear } = req.query;

    // Use optimized static method
    const schedules = await Schedule.getRoomUtilization(
      req.schoolId, 
      dayOfWeek.toLowerCase(), 
      academicYear
    );

    // Group by room and time slots
    const roomUtilization = {};

    schedules.forEach(schedule => {
      schedule.periods.forEach(period => {
        if (period.room) {
          if (!roomUtilization[period.room]) {
            roomUtilization[period.room] = [];
          }
          
          roomUtilization[period.room].push({
            startTime: period.startTime,
            endTime: period.endTime,
            subject: period.subject,
            teacher: period.teacher.name,
            class: `${schedule.class.name} (${schedule.class.grade}${schedule.class.section})`,
            periodNumber: period.periodNumber
          });
        }
      });
    });

    // Sort periods by start time for each room
    Object.keys(roomUtilization).forEach(room => {
      roomUtilization[room].sort((a, b) => {
        const timeA = a.startTime.split(':').map(Number);
        const timeB = b.startTime.split(':').map(Number);
        return (timeA[0] * 60 + timeA[1]) - (timeB[0] * 60 + timeB[1]);
      });
    });

    res.json({
      dayOfWeek: dayOfWeek.toLowerCase(),
      roomUtilization,
      totalRooms: Object.keys(roomUtilization).length,
      academicYear: academicYear || '2024-25'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
