const mongoose = require('mongoose');
const Admin = require('../models/Admin');
const Teacher = require('../models/Teacher');
const Student = require('../models/Student');
const Class = require('../models/Class');
const Event = require('../models/Event');
const Schedule = require('../models/Schedule');
const FeeStructure = require('../models/FeeStructure');
const Payment = require('../models/Payment');
const dotenv = require('dotenv');

dotenv.config();

const seedData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await Admin.deleteMany({});
    await Teacher.deleteMany({});
    await Student.deleteMany({});
    await Class.deleteMany({});
    await Event.deleteMany({});
    await Schedule.deleteMany({});
    await FeeStructure.deleteMany({});
    await Payment.deleteMany({});
    console.log('Cleared existing data');

    // Create dummy admins with schoolId
    const dummyAdmins = [
      {
        name: 'John Doe',
        email: 'admin1@school.com',
        password: '$2a$10$P0.pc8u8B1n4GQblm58MY.BmPeEAqoc9dxEnSeGbC2hIJdTVpJaby',
        phone: '+1234567890',
        schoolName: 'Springfield High School',
        schoolId: 'SCH001',
        role: 'school_admin',
        permissions: ['manage_students', 'manage_teachers', 'manage_classes', 'manage_fees', 'view_reports'],
        isActive: true
      },
      {
        name: 'Jane Smith',
        email: 'admin2@school.com',
        password: '$2a$10$P0.pc8u8B1n4GQblm58MY.BmPeEAqoc9dxEnSeGbC2hIJdTVpJaby',
        phone: '+1234567891',
        schoolName: 'Riverside Academy',
        schoolId: 'SCH002',
        role: 'school_admin',
        permissions: ['manage_students', 'manage_teachers', 'manage_classes', 'view_reports'],
        isActive: true
      }
    ];

    const savedAdmins = await Admin.insertMany(dummyAdmins);
    console.log('Created dummy admins');

    // Create dummy teachers for first admin (with passwords)
    const dummyTeachers = [
      {
        name: 'Sarah Johnson',
        email: 'sarah.johnson@school.com',
        password: '$2a$10$P0.pc8u8B1n4GQblm58MY.BmPeEAqoc9dxEnSeGbC2hIJdTVpJaby', // password123
        schoolId: 'SCH001',
        qualifications: ['MSc Mathematics', 'BEd'],
        role: 'class_teacher',
        salary: {
          amount: 50000,
          currency: 'USD'
        },
        performanceMetrics: {
          teachingScore: 8.5,
          punctuality: 9.0
        },
        createdBy: savedAdmins[0]._id
      },
      {
        name: 'Michael Brown',
        email: 'michael.brown@school.com',
        password: '$2a$10$P0.pc8u8B1n4GQblm58MY.BmPeEAqoc9dxEnSeGbC2hIJdTVpJaby', // password123
        schoolId: 'SCH001',
        qualifications: ['MSc Physics', 'PhD Physics'],
        role: 'subject_teacher',
        salary: {
          amount: 55000,
          currency: 'USD'
        },
        performanceMetrics: {
          teachingScore: 9.2,
          punctuality: 8.8
        },
        createdBy: savedAdmins[0]._id
      }
    ];

    const savedTeachers = await Teacher.insertMany(dummyTeachers);
    console.log('Created dummy teachers');

    // Create dummy students for first admin (with passwords)
    const dummyStudents = [
      {
        name: 'Alice Wilson',
        email: 'alice.wilson@student.com',
        password: '$2a$10$P0.pc8u8B1n4GQblm58MY.BmPeEAqoc9dxEnSeGbC2hIJdTVpJaby', // password123
        schoolId: 'SCH001',
        dateOfBirth: new Date('2008-05-15'),
        gender: 'female',
        bloodGroup: 'A+',
        address: {
          street: '123 Oak Street',
          city: 'Springfield',
          state: 'Illinois',
          zipCode: '62701',
          country: 'USA'
        },
        rollNumber: 'STU001',
        parentInfo: {
          name: 'Robert Wilson',
          contact: '+1234567892',
          email: 'robert.wilson@parent.com',
          occupation: 'Engineer'
        },
        academicProgress: [
          { subject: 'Mathematics', grade: 85, semester: 'Fall 2023', remarks: 'Good progress' },
          { subject: 'Physics', grade: 78, semester: 'Fall 2023', remarks: 'Needs improvement' }
        ],
        attendance: [
          { date: new Date('2024-01-15'), status: 'present', subject: 'Mathematics' },
          { date: new Date('2024-01-15'), status: 'present', subject: 'Physics' },
          { date: new Date('2024-01-16'), status: 'late', subject: 'Mathematics' }
        ],
        medicalInfo: {
          allergies: ['Peanuts'],
          emergencyContact: {
            name: 'Mary Wilson',
            relationship: 'Aunt',
            phone: '+1234567899'
          }
        },
        createdBy: savedAdmins[0]._id
      },
      {
        name: 'Bob Davis',
        email: 'bob.davis@student.com',
        password: '$2a$10$P0.pc8u8B1n4GQblm58MY.BmPeEAqoc9dxEnSeGbC2hIJdTVpJaby', // password123
        schoolId: 'SCH001',
        dateOfBirth: new Date('2008-08-22'),
        gender: 'male',
        bloodGroup: 'B+',
        address: {
          street: '456 Pine Avenue',
          city: 'Springfield',
          state: 'Illinois',
          zipCode: '62702',
          country: 'USA'
        },
        rollNumber: 'STU002',
        parentInfo: {
          name: 'Mary Davis',
          contact: '+1234567893',
          email: 'mary.davis@parent.com',
          occupation: 'Doctor'
        },
        academicProgress: [
          { subject: 'Mathematics', grade: 92, semester: 'Fall 2023', remarks: 'Excellent work' },
          { subject: 'Physics', grade: 88, semester: 'Fall 2023', remarks: 'Very good' }
        ],
        attendance: [
          { date: new Date('2024-01-15'), status: 'present', subject: 'Mathematics' },
          { date: new Date('2024-01-15'), status: 'present', subject: 'Physics' },
          { date: new Date('2024-01-16'), status: 'present', subject: 'Mathematics' }
        ],
        medicalInfo: {
          allergies: [],
          emergencyContact: {
            name: 'John Davis',
            relationship: 'Father',
            phone: '+1234567894'
          }
        },
        createdBy: savedAdmins[0]._id
      }
    ];

    // Create students without assignedClass first
    const savedStudents = await Student.insertMany(dummyStudents);
    console.log('Created dummy students');

    // Create dummy classes for first admin
    const dummyClasses = [
      {
        name: 'Grade 10A',
        schoolId: 'SCH001',
        grade: '10',
        section: 'A',
        teacher: savedTeachers[0]._id,
        subjects: ['Mathematics', 'Physics', 'Chemistry'],
        students: [savedStudents[0]._id, savedStudents[1]._id],
        capacity: 40,
        performance: {
          averageGrade: 86.5,
          attendanceRate: 92.0
        },
        createdBy: savedAdmins[0]._id
      }
    ];

    const savedClasses = await Class.insertMany(dummyClasses);
    console.log('Created dummy classes');

    // Update students with class assignment
    await Student.updateMany(
      { _id: { $in: [savedStudents[0]._id, savedStudents[1]._id] } },
      { assignedClass: savedClasses[0]._id }
    );
    console.log('Updated student class assignments');

    // Create dummy events for first admin
    const dummyEvents = [
      {
        title: 'Sports Day',
        schoolId: 'SCH001', // Add schoolId
        date: new Date('2024-03-15'),
        description: 'Annual sports competition for all students',
        targetAudience: 'students',
        createdBy: savedAdmins[0]._id
      },
      {
        title: 'Parent-Teacher Meeting',
        schoolId: 'SCH001', // Add schoolId
        date: new Date('2024-02-20'),
        description: 'Quarterly parent-teacher conference',
        targetAudience: 'parents',
        createdBy: savedAdmins[0]._id
      }
    ];

    await Event.insertMany(dummyEvents);
    console.log('Created dummy events');

    // Create dummy schedules for first admin
    const dummySchedules = [
      // Monday schedule for Grade 10A
      {
        schoolId: 'SCH001',
        class: savedClasses[0]._id,
        dayOfWeek: 'monday',
        periods: [
          {
            periodNumber: 1,
            subject: 'Mathematics',
            teacher: savedTeachers[0]._id,
            startTime: '09:00',
            endTime: '09:45',
            room: 'Room 101'
          },
          {
            periodNumber: 2,
            subject: 'Physics',
            teacher: savedTeachers[1]._id,
            startTime: '09:55',
            endTime: '10:40',
            room: 'Lab 1'
          },
          {
            periodNumber: 3,
            subject: 'Chemistry',
            teacher: savedTeachers[0]._id,
            startTime: '10:50',
            endTime: '11:35',
            room: 'Lab 2'
          },
          {
            periodNumber: 4,
            subject: 'English',
            teacher: savedTeachers[1]._id,
            startTime: '12:30',
            endTime: '13:15',
            room: 'Room 101'
          },
          {
            periodNumber: 5,
            subject: 'History',
            teacher: savedTeachers[0]._id,
            startTime: '13:25',
            endTime: '14:10',
            room: 'Room 102'
          }
        ],
        academicYear: '2024-25',
        createdBy: savedAdmins[0]._id
      },
      // Tuesday schedule for Grade 10A
      {
        schoolId: 'SCH001',
        class: savedClasses[0]._id,
        dayOfWeek: 'tuesday',
        periods: [
          {
            periodNumber: 1,
            subject: 'Physics',
            teacher: savedTeachers[1]._id,
            startTime: '09:00',
            endTime: '09:45',
            room: 'Lab 1'
          },
          {
            periodNumber: 2,
            subject: 'Mathematics',
            teacher: savedTeachers[0]._id,
            startTime: '09:55',
            endTime: '10:40',
            room: 'Room 101'
          },
          {
            periodNumber: 3,
            subject: 'English',
            teacher: savedTeachers[1]._id,
            startTime: '10:50',
            endTime: '11:35',
            room: 'Room 103'
          },
          {
            periodNumber: 4,
            subject: 'Chemistry',
            teacher: savedTeachers[0]._id,
            startTime: '12:30',
            endTime: '13:15',
            room: 'Lab 2'
          },
          {
            periodNumber: 5,
            subject: 'Physical Education',
            teacher: savedTeachers[1]._id,
            startTime: '13:25',
            endTime: '14:10',
            room: 'Playground'
          }
        ],
        academicYear: '2024-25',
        createdBy: savedAdmins[0]._id
      },
      // Wednesday schedule for Grade 10A
      {
        schoolId: 'SCH001',
        class: savedClasses[0]._id,
        dayOfWeek: 'wednesday',
        periods: [
          {
            periodNumber: 1,
            subject: 'Chemistry',
            teacher: savedTeachers[0]._id,
            startTime: '09:00',
            endTime: '09:45',
            room: 'Lab 2'
          },
          {
            periodNumber: 2,
            subject: 'History',
            teacher: savedTeachers[1]._id,
            startTime: '09:55',
            endTime: '10:40',
            room: 'Room 102'
          },
          {
            periodNumber: 3,
            subject: 'Mathematics',
            teacher: savedTeachers[0]._id,
            startTime: '10:50',
            endTime: '11:35',
            room: 'Room 101'
          },
          {
            periodNumber: 4,
            subject: 'Physics',
            teacher: savedTeachers[1]._id,
            startTime: '12:30',
            endTime: '13:15',
            room: 'Lab 1'
          },
          {
            periodNumber: 5,
            subject: 'Art',
            teacher: savedTeachers[0]._id,
            startTime: '13:25',
            endTime: '14:10',
            room: 'Art Room'
          }
        ],
        academicYear: '2024-25',
        createdBy: savedAdmins[0]._id
      }
    ];

    await Schedule.insertMany(dummySchedules);
    console.log('Created dummy schedules');

    // Create dummy fee structures
    const dummyFeeStructures = [
      {
        schoolId: 'SCH001',
        name: 'Grade 10A Annual Fees',
        class: savedClasses[0]._id,
        academicYear: '2024-25',
        feeComponents: [
          { name: 'Tuition Fee', amount: 5000, type: 'tuition' },
          { name: 'Library Fee', amount: 200, type: 'library' },
          { name: 'Sports Fee', amount: 300, type: 'sports' },
          { name: 'Examination Fee', amount: 150, type: 'examination' }
        ],
        dueDate: new Date('2024-04-30'),
        installments: [
          { name: 'First Installment', amount: 2825, dueDate: new Date('2024-02-28') },
          { name: 'Second Installment', amount: 2825, dueDate: new Date('2024-04-30') }
        ],
        createdBy: savedAdmins[0]._id
      }
    ];

    const savedFeeStructures = await FeeStructure.insertMany(dummyFeeStructures);
    console.log('Created dummy fee structures');

    // Create dummy payments for students
    const dummyPayments = [
      {
        schoolId: 'SCH001',
        paymentType: 'fee',
        student: savedStudents[0]._id,
        feeStructure: savedFeeStructures[0]._id,
        amount: 5650,
        paidAmount: 2825,
        paymentDate: new Date('2024-02-25'),
        dueDate: new Date('2024-04-30'),
        paymentMethod: 'bank_transfer',
        transactionId: 'TXN123456',
        paymentHistory: [{
          amount: 2825,
          paymentDate: new Date('2024-02-25'),
          paymentMethod: 'bank_transfer',
          transactionId: 'TXN123456',
          remarks: 'First installment paid',
          recordedBy: savedAdmins[0]._id
        }],
        createdBy: savedAdmins[0]._id
      },
      {
        schoolId: 'SCH001',
        paymentType: 'fee',
        student: savedStudents[1]._id,
        feeStructure: savedFeeStructures[0]._id,
        amount: 5650,
        paidAmount: 0,
        paymentDate: new Date(),
        dueDate: new Date('2024-04-30'),
        paymentMethod: 'pending',
        createdBy: savedAdmins[0]._id
      }
    ];

    // Create dummy salary payments
    const dummySalaryPayments = [
      {
        schoolId: 'SCH001',
        paymentType: 'salary',
        teacher: savedTeachers[0]._id,
        amount: 50000,
        paidAmount: 50000,
        paymentDate: new Date('2024-01-31'),
        dueDate: new Date('2024-01-31'),
        salaryMonth: '2024-01',
        paymentMethod: 'bank_transfer',
        transactionId: 'SAL123456',
        paymentHistory: [{
          amount: 50000,
          paymentDate: new Date('2024-01-31'),
          paymentMethod: 'bank_transfer',
          transactionId: 'SAL123456',
          remarks: 'January salary',
          recordedBy: savedAdmins[0]._id
        }],
        createdBy: savedAdmins[0]._id
      },
      {
        schoolId: 'SCH001',
        paymentType: 'salary',
        teacher: savedTeachers[1]._id,
        amount: 55000,
        paidAmount: 0,
        paymentDate: new Date(),
        dueDate: new Date('2024-02-29'),
        salaryMonth: '2024-02',
        paymentMethod: 'pending',
        createdBy: savedAdmins[0]._id
      }
    ];

    await Payment.insertMany([...dummyPayments, ...dummySalaryPayments]);
    console.log('Created dummy payments');

    console.log('\n=== SEEDING COMPLETED ===');
    console.log('\nAdmin Accounts:');
    dummyAdmins.forEach(admin => {
      console.log(`Email: ${admin.email} | Password: password123 | School: ${admin.schoolName} | School ID: ${admin.schoolId}`);
    });

    console.log('\nTeacher Accounts:');
    dummyTeachers.forEach(teacher => {
      console.log(`Email: ${teacher.email} | Password: password123 | Name: ${teacher.name}`);
    });

    console.log('\nStudent Accounts:');
    dummyStudents.forEach(student => {
      console.log(`Email: ${student.email} | Password: password123 | Name: ${student.name}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedData();
