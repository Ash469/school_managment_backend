const mongoose = require('mongoose');
const Admin = require('../models/Admin');
const Teacher = require('../models/Teacher');
const Student = require('../models/Student');
const Class = require('../models/Class');
const Event = require('../models/Event');
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
    console.log('Cleared existing data');

    // Create dummy admins with schoolId
    const dummyAdmins = [
      {
        name: 'John Doe',
        email: 'admin1@school.com',
        password: 'password123',
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
        password: 'password123',
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

    // Create dummy teachers for first admin
    const dummyTeachers = [
      {
        name: 'Sarah Johnson',
        email: 'sarah.johnson@school.com',
        schoolId: 'SCH001', // Add schoolId
        qualifications: ['MSc Mathematics', 'BEd'],
        role: 'class_teacher',
        performanceMetrics: {
          teachingScore: 8.5,
          punctuality: 9.0
        },
        createdBy: savedAdmins[0]._id
      },
      {
        name: 'Michael Brown',
        email: 'michael.brown@school.com',
        schoolId: 'SCH001', // Add schoolId
        qualifications: ['MSc Physics', 'PhD Physics'],
        role: 'subject_teacher',
        performanceMetrics: {
          teachingScore: 9.2,
          punctuality: 8.8
        },
        createdBy: savedAdmins[0]._id
      }
    ];

    const savedTeachers = await Teacher.insertMany(dummyTeachers);
    console.log('Created dummy teachers');

    // Create dummy students for first admin
    const dummyStudents = [
      {
        name: 'Alice Wilson',
        email: 'alice.wilson@student.com',
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

    console.log('\n=== SEEDING COMPLETED ===');
    console.log('\nAdmin Accounts:');
    dummyAdmins.forEach(admin => {
      console.log(`Email: ${admin.email} | Password: ${admin.password} | School: ${admin.schoolName} | School ID: ${admin.schoolId}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedData();
