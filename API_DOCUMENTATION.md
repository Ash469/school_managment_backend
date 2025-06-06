# School Management System API Documentation

## Base URL
```
http://localhost:5000
```

## Authentication
Most endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

## Multi-User Authentication System

The system supports three types of users with separate login endpoints:

### User Types
1. **Admin**: Full system management (schoolId-scoped)
2. **Teacher**: View schedules, salary records, class management
3. **Student**: View schedules, fee records, academic progress

### Test Accounts
Use these seeded accounts for testing:

**Admin Accounts:**
- **Email**: `admin1@school.com` | **Password**: `password123` | **School**: Springfield High School | **School ID**: SCH001
- **Email**: `admin2@school.com` | **Password**: `password123` | **School**: Riverside Academy | **School ID**: SCH002

**Teacher Accounts (SCH001):**
- **Email**: `sarah.johnson@school.com` | **Password**: `password123` | **Name**: Sarah Johnson
- **Email**: `michael.brown@school.com` | **Password**: `password123` | **Name**: Michael Brown

**Student Accounts (SCH001):**
- **Email**: `alice.wilson@student.com` | **Password**: `password123` | **Name**: Alice Wilson
- **Email**: `bob.davis@student.com` | **Password**: `password123` | **Name**: Bob Davis

---

## Multi-Tenant Architecture

This system supports multiple schools with complete data isolation:

- **School ID**: Each school has a unique identifier (SCH001-SCH99999)
- **Data Isolation**: All data is automatically filtered by schoolId
- **Auto-Assignment**: schoolId is automatically assigned to all records based on admin's school
- **Fast Queries**: Database indexes ensure optimal performance for school-specific queries

---

## Authentication Endpoints

### 1. Admin Login
**POST** `/api/admin/login`

**Body:**
```json
{
  "email": "admin1@school.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "admin": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "admin1@school.com",
    "schoolName": "Springfield High School",
    "schoolId": "SCH001",
    "role": "school_admin",
    "permissions": ["manage_students", "manage_teachers", "manage_classes", "manage_fees", "view_reports"]
  }
}
```

### 2. Teacher Login
**POST** `/api/auth/teacher/login`

**Body:**
```json
{
  "email": "sarah.johnson@school.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439012",
    "name": "Sarah Johnson",
    "email": "sarah.johnson@school.com",
    "role": "class_teacher",
    "schoolId": "SCH001",
    "assignedClass": {
      "_id": "507f1f77bcf86cd799439014",
      "name": "Grade 10A",
      "grade": "10",
      "section": "A"
    },
    "userType": "teacher"
  }
}
```

### 3. Student Login
**POST** `/api/auth/student/login`

**Body:**
```json
{
  "email": "alice.wilson@student.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439013",
    "name": "Alice Wilson",
    "email": "alice.wilson@student.com",
    "rollNumber": "STU001",
    "schoolId": "SCH001",
    "assignedClass": {
      "_id": "507f1f77bcf86cd799439014",
      "name": "Grade 10A",
      "grade": "10",
      "section": "A"
    },
    "userType": "student"
  }
}
```

### 4. Get User Profile (Multi-Type)
**GET** `/api/auth/profile`
**Headers:** `Authorization: Bearer <token>`

**Description:** Returns profile data based on user type (admin/teacher/student)

**Response for Student:**
```json
{
  "_id": "507f1f77bcf86cd799439013",
  "name": "Alice Wilson",
  "email": "alice.wilson@student.com",
  "schoolId": "SCH001",
  "rollNumber": "STU001",
  "assignedClass": {
    "_id": "507f1f77bcf86cd799439014",
    "name": "Grade 10A",
    "subjects": ["Mathematics", "Physics", "Chemistry"]
  },
  "academicProgress": [...],
  "userType": "student"
}
```

---

## Admin Endpoints

### 1. Register Admin
**POST** `/api/admin/register`

**Body:**
```json
{
  "name": "Test Admin",
  "email": "test@school.com",
  "password": "password123",
  "phone": "+1234567890",
  "schoolName": "Test High School",
  "schoolId": "SCH003",
  "role": "school_admin",
  "permissions": ["manage_students", "manage_teachers", "manage_classes"]
}
```

**Note:** `schoolId` is optional. If not provided, one will be auto-generated in format SCH001-SCH99999.

**Response:**
```json
{
  "message": "Admin registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "admin": {
    "id": "507f1f77bcf86cd799439011",
    "name": "Test Admin",
    "email": "test@school.com",
    "schoolName": "Test High School",
    "schoolId": "SCH003",
    "role": "school_admin",
    "permissions": ["manage_students", "manage_teachers", "manage_classes"]
  }
}
```

### 2. Get Admin Profile
**GET** `/api/admin/profile`
**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "John Doe",
  "email": "admin1@school.com",
  "phone": "+1234567890",
  "schoolName": "Springfield High School",
  "schoolId": "SCH001",
  "role": "school_admin",
  "permissions": ["manage_students", "manage_teachers", "manage_classes", "manage_fees", "view_reports"],
  "isActive": true,
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

---

## Teacher Endpoints

**Note:** All teacher operations are automatically scoped to the admin's school (schoolId).

### 1. Add Teacher
**POST** `/api/teachers`
**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "name": "Emma Wilson",
  "email": "emma.wilson@school.com",
  "password": "teacher123",
  "qualifications": ["MSc Biology", "BEd"],
  "role": "subject_teacher",
  "salary": {
    "amount": 52000,
    "currency": "USD"
  },
  "assignedClass": "507f1f77bcf86cd799439014"
}
```

**Note:** `password` is required for teacher login. `assignedClass` is optional.

**Response:**
```json
{
  "message": "Teacher added successfully",
  "teacher": {
    "_id": "507f1f77bcf86cd799439012",
    "name": "Emma Wilson",
    "email": "emma.wilson@school.com",
    "schoolId": "SCH001",
    "qualifications": ["MSc Biology", "BEd"],
    "role": "subject_teacher",
    "salary": {
      "amount": 52000,
      "currency": "USD"
    },
    "assignedClass": {
      "_id": "507f1f77bcf86cd799439014",
      "name": "Grade 10A"
    },
    "performanceMetrics": {
      "teachingScore": 0,
      "punctuality": 0
    },
    "createdBy": "507f1f77bcf86cd799439011",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### 2. Get All Teachers (School-Specific)
**GET** `/api/teachers`
**Headers:** `Authorization: Bearer <token>`

**Description:** Returns only teachers from the authenticated admin's school with populated class information.

**Response:**
```json
[
  {
    "_id": "507f1f77bcf86cd799439012",
    "name": "Sarah Johnson",
    "email": "sarah.johnson@school.com",
    "schoolId": "SCH001",
    "qualifications": ["MSc Mathematics", "BEd"],
    "role": "class_teacher",
    "assignedClass": {
      "_id": "507f1f77bcf86cd799439014",
      "name": "Grade 10A"
    },
    "performanceMetrics": {
      "teachingScore": 8.5,
      "punctuality": 9.0
    },
    "createdBy": "507f1f77bcf86cd799439011",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
]
```

### 3. Update Teacher
**PUT** `/api/teachers/:id`
**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "name": "Sarah Johnson Updated",
  "qualifications": ["MSc Mathematics", "BEd", "MEd Leadership"],
  "assignedClass": "507f1f77bcf86cd799439015",
  "performanceMetrics": {
    "teachingScore": 9.0,
    "punctuality": 9.5
  }
}
```

### 4. Get Teacher Performance
**GET** `/api/teachers/:id/performance`
**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "teacherId": "507f1f77bcf86cd799439012",
  "teacherName": "Sarah Johnson",
  "performanceMetrics": {
    "teachingScore": 8.5,
    "punctuality": 9.0
  }
}
```

### 5. Delete Teacher
**DELETE** `/api/teachers/:id`
**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "message": "Teacher removed successfully"
}
```

---

## Student Endpoints

**Note:** All student operations are automatically scoped to the admin's school (schoolId).

### 1. Enroll Student
**POST** `/api/students`
**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "name": "Charlie Smith",
  "email": "charlie.smith@student.com",
  "password": "student123",
  "dateOfBirth": "2008-03-15",
  "gender": "male",
  "rollNumber": "STU003",
  "address": {
    "street": "789 Main St",
    "city": "Springfield",
    "state": "Illinois",
    "zipCode": "62701",
    "country": "USA"
  },
  "parentInfo": {
    "name": "David Smith",
    "contact": "+1234567894",
    "email": "david.smith@parent.com"
  }
}
```

**Note:** `password` is required for student login.

---

## Schedule Management Endpoints

**Note:** All schedule operations are automatically scoped to the admin's school (schoolId).

### 1. Create Class Schedule
**POST** `/api/schedules`
**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "class": "507f1f77bcf86cd799439014",
  "dayOfWeek": "monday",
  "periods": [
    {
      "periodNumber": 1,
      "subject": "Mathematics",
      "teacher": "507f1f77bcf86cd799439012",
      "startTime": "09:00",
      "endTime": "09:45",
      "room": "Room 101"
    },
    {
      "periodNumber": 2,
      "subject": "Physics",
      "teacher": "507f1f77bcf86cd799439013",
      "startTime": "09:55",
      "endTime": "10:40",
      "room": "Lab 1"
    }
  ],
  "academicYear": "2024-25"
}
```

**Response:**
```json
{
  "message": "Schedule created successfully",
  "schedule": {
    "_id": "507f1f77bcf86cd799439015",
    "schoolId": "SCH001",
    "class": {
      "_id": "507f1f77bcf86cd799439014",
      "name": "Grade 10A",
      "grade": "10",
      "section": "A"
    },
    "dayOfWeek": "monday",
    "periods": [
      {
        "periodNumber": 1,
        "subject": "Mathematics",
        "teacher": {
          "_id": "507f1f77bcf86cd799439012",
          "name": "Sarah Johnson",
          "email": "sarah.johnson@school.com"
        },
        "startTime": "09:00",
        "endTime": "09:45",
        "room": "Room 101"
      }
    ],
    "academicYear": "2024-25",
    "createdBy": "507f1f77bcf86cd799439011"
  }
}
```

### 2. Get Student's Daily Schedule (OPTIMIZED)
**GET** `/api/schedules/student/:classId/daily/:dayOfWeek`
**Headers:** `Authorization: Bearer <token>`

**Example:** `/api/schedules/student/507f1f77bcf86cd799439014/daily/monday`

**Response:**
```json
{
  "dayOfWeek": "monday",
  "class": {
    "_id": "507f1f77bcf86cd799439014",
    "name": "Grade 10A",
    "grade": "10",
    "section": "A"
  },
  "periods": [
    {
      "periodNumber": 1,
      "subject": "Mathematics",
      "teacher": {
        "_id": "507f1f77bcf86cd799439012",
        "name": "Sarah Johnson",
        "email": "sarah.johnson@school.com"
      },
      "startTime": "09:00",
      "endTime": "09:45",
      "room": "Room 101"
    },
    {
      "periodNumber": 2,
      "subject": "Physics",
      "teacher": {
        "_id": "507f1f77bcf86cd799439013",
        "name": "Michael Brown",
        "email": "michael.brown@school.com"
      },
      "startTime": "09:55",
      "endTime": "10:40",
      "room": "Lab 1"
    }
  ],
  "totalPeriods": 2
}
```

### 3. Get Teacher's Daily Schedule (OPTIMIZED)
**GET** `/api/schedules/teacher/:teacherId/daily/:dayOfWeek`
**Headers:** `Authorization: Bearer <token>`

**Example:** `/api/schedules/teacher/507f1f77bcf86cd799439012/daily/monday`

**Response:**
```json
{
  "dayOfWeek": "monday",
  "teacher": {
    "name": "Sarah Johnson",
    "email": "sarah.johnson@school.com"
  },
  "periods": [
    {
      "periodNumber": 1,
      "subject": "Mathematics",
      "startTime": "09:00",
      "endTime": "09:45",
      "room": "Room 101",
      "className": "Grade 10A",
      "classGrade": "10",
      "classSection": "A"
    },
    {
      "periodNumber": 3,
      "subject": "Chemistry",
      "startTime": "10:50",
      "endTime": "11:35",
      "room": "Lab 2",
      "className": "Grade 10A",
      "classGrade": "10",
      "classSection": "A"
    }
  ],
  "totalPeriods": 2,
  "totalClasses": 1
}
```

### 4. Get Class Weekly Schedule (OPTIMIZED)
**GET** `/api/schedules/class/:classId/weekly`
**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "class": {
    "_id": "507f1f77bcf86cd799439014",
    "name": "Grade 10A",
    "grade": "10",
    "section": "A"
  },
  "weeklySchedule": {
    "monday": {
      "periods": [...],
      "totalPeriods": 5
    },
    "tuesday": {
      "periods": [...],
      "totalPeriods": 5
    },
    "wednesday": {
      "periods": [...],
      "totalPeriods": 5
    },
    "thursday": null,
    "friday": null,
    "saturday": null
  },
  "academicYear": "2024-25"
}
```

### 5. Get Teacher's Weekly Workload (OPTIMIZED)
**GET** `/api/schedules/teacher/:teacherId/weekly`
**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "teacherId": "507f1f77bcf86cd799439012",
  "weeklyWorkload": {
    "monday": [
      {
        "class": {
          "_id": "507f1f77bcf86cd799439014",
          "name": "Grade 10A"
        },
        "periods": [...]
      }
    ],
    "tuesday": [...],
    "wednesday": [...],
    "thursday": [],
    "friday": [],
    "saturday": []
  },
  "statistics": {
    "totalPeriodsPerWeek": 15,
    "totalClassesHandled": 2,
    "averagePeriodsPerDay": 2.5
  },
  "academicYear": "2024-25"
}
```

### 6. Get Room Utilization (OPTIMIZED)
**GET** `/api/schedules/room-utilization/:dayOfWeek`
**Headers:** `Authorization: Bearer <token>`

**Example:** `/api/schedules/room-utilization/monday`

**Response:**
```json
{
  "dayOfWeek": "monday",
  "roomUtilization": {
    "Room 101": [
      {
        "startTime": "09:00",
        "endTime": "09:45",
        "subject": "Mathematics",
        "teacher": "Sarah Johnson",
        "class": "Grade 10A (10A)",
        "periodNumber": 1
      },
      {
        "startTime": "12:30",
        "endTime": "13:15",
        "subject": "English",
        "teacher": "Michael Brown",
        "class": "Grade 10A (10A)",
        "periodNumber": 4
      }
    ],
    "Lab 1": [
      {
        "startTime": "09:55",
        "endTime": "10:40",
        "subject": "Physics",
        "teacher": "Michael Brown",
        "class": "Grade 10A (10A)",
        "periodNumber": 2
      }
    ]
  },
  "totalRooms": 2,
  "academicYear": "2024-25"
}
```

### 7. Get Weekly Overview
**GET** `/api/schedules/weekly-overview`
**Headers:** `Authorization: Bearer <token>`

**Description:** Returns all schedules grouped by day of the week for admin dashboard.

---

## Fee Management Endpoints

**Note:** All fee operations are automatically scoped to the admin's school (schoolId).

### 1. Create Fee Structure
**POST** `/api/fees/structure`
**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "name": "Grade 10A Annual Fees 2024-25",
  "class": "507f1f77bcf86cd799439014",
  "feeComponents": [
    {
      "name": "Tuition Fee",
      "amount": 5000,
      "type": "tuition",
      "isOptional": false
    },
    {
      "name": "Library Fee",
      "amount": 200,
      "type": "library",
      "isOptional": false
    },
    {
      "name": "Sports Fee",
      "amount": 300,
      "type": "sports",
      "isOptional": true
    },
    {
      "name": "Examination Fee",
      "amount": 150,
      "type": "examination",
      "isOptional": false
    }
  ],
  "dueDate": "2024-04-30T00:00:00.000Z",
  "installments": [
    {
      "name": "First Installment",
      "amount": 2825,
      "dueDate": "2024-02-28T00:00:00.000Z"
    },
    {
      "name": "Second Installment",
      "amount": 2825,
      "dueDate": "2024-04-30T00:00:00.000Z"
    }
  ],
  "academicYear": "2024-25"
}
```

**Response:**
```json
{
  "message": "Fee structure created successfully",
  "feeStructure": {
    "_id": "507f1f77bcf86cd799439016",
    "schoolId": "SCH001",
    "name": "Grade 10A Annual Fees 2024-25",
    "class": {
      "_id": "507f1f77bcf86cd799439014",
      "name": "Grade 10A",
      "grade": "10",
      "section": "A"
    },
    "feeComponents": [...],
    "totalAmount": 5650,
    "dueDate": "2024-04-30T00:00:00.000Z",
    "installments": [...],
    "academicYear": "2024-25",
    "isActive": true,
    "createdBy": "507f1f77bcf86cd799439011"
  },
  "studentsCount": 2
}
```

**Note:** Automatically creates pending payment records for all students in the specified class.

### 2. Get Fee Payment Status
**GET** `/api/fees/structure/:id/payments`
**Headers:** `Authorization: Bearer <token>`

**Description:** Get detailed payment status for a specific fee structure showing which students have paid.

**Response:**
```json
{
  "feeStructure": {
    "_id": "507f1f77bcf86cd799439016",
    "name": "Grade 10A Annual Fees 2024-25",
    "class": {
      "name": "Grade 10A",
      "grade": "10",
      "section": "A"
    },
    "totalAmount": 5650
  },
  "payments": [
    {
      "_id": "507f1f77bcf86cd799439017",
      "student": {
        "_id": "507f1f77bcf86cd799439013",
        "name": "Alice Wilson",
        "email": "alice.wilson@student.com",
        "rollNumber": "STU001"
      },
      "amount": 5650,
      "paidAmount": 2825,
      "remainingAmount": 2825,
      "status": "partial",
      "dueDate": "2024-04-30T00:00:00.000Z",
      "paymentMethod": "bank_transfer",
      "transactionId": "TXN123456",
      "paymentHistory": [
        {
          "amount": 2825,
          "paymentDate": "2024-02-25T00:00:00.000Z",
          "paymentMethod": "bank_transfer",
          "transactionId": "TXN123456",
          "remarks": "First installment paid"
        }
      ]
    },
    {
      "_id": "507f1f77bcf86cd799439018",
      "student": {
        "_id": "507f1f77bcf86cd799439014",
        "name": "Bob Davis",
        "email": "bob.davis@student.com",
        "rollNumber": "STU002"
      },
      "amount": 5650,
      "paidAmount": 0,
      "remainingAmount": 5650,
      "status": "pending",
      "dueDate": "2024-04-30T00:00:00.000Z",
      "paymentMethod": "pending"
    }
  ],
  "statistics": {
    "totalStudents": 2,
    "paidStudents": 0,
    "partialStudents": 1,
    "pendingStudents": 1,
    "overdueStudents": 0,
    "totalAmount": 11300,
    "paidAmount": 2825,
    "remainingAmount": 8475
  }
}
```

### 3. Record Fee Payment
**POST** `/api/fees/payment`
**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "paymentId": "507f1f77bcf86cd799439017",
  "amount": 2825,
  "paymentMethod": "online",
  "transactionId": "TXN789012",
  "remarks": "Second installment - online payment",
  "paymentDate": "2024-04-25T00:00:00.000Z"
}
```

**Response:**
```json
{
  "message": "Payment recorded successfully",
  "payment": {
    "_id": "507f1f77bcf86cd799439017",
    "student": {
      "name": "Alice Wilson",
      "email": "alice.wilson@student.com"
    },
    "amount": 5650,
    "paidAmount": 5650,
    "remainingAmount": 0,
    "status": "completed",
    "paymentHistory": [
      {
        "amount": 2825,
        "paymentDate": "2024-02-25T00:00:00.000Z",
        "paymentMethod": "bank_transfer",
        "transactionId": "TXN123456",
        "remarks": "First installment paid"
      },
      {
        "amount": 2825,
        "paymentDate": "2024-04-25T00:00:00.000Z",
        "paymentMethod": "online",
        "transactionId": "TXN789012",
        "remarks": "Second installment - online payment"
      }
    ]
  }
}
```

### 4. Get Student's Fee Records (Student Dashboard)
**GET** `/api/fees/student/my-fees`
**Headers:** `Authorization: Bearer <student_token>`

**Description:** Students can view their own fee payment history.

**Response:**
```json
[
  {
    "_id": "507f1f77bcf86cd799439017",
    "feeStructure": {
      "_id": "507f1f77bcf86cd799439016",
      "name": "Grade 10A Annual Fees 2024-25",
      "feeComponents": [
        {
          "name": "Tuition Fee",
          "amount": 5000,
          "type": "tuition"
        },
        {
          "name": "Library Fee",
          "amount": 200,
          "type": "library"
        }
      ],
      "dueDate": "2024-04-30T00:00:00.000Z",
      "academicYear": "2024-25"
    },
    "amount": 5650,
    "paidAmount": 5650,
    "remainingAmount": 0,
    "status": "completed",
    "dueDate": "2024-04-30T00:00:00.000Z",
    "paymentHistory": [...]
  }
]
```

---

## Salary Management Endpoints

### 1. Create Salary Structure
**POST** `/api/fees/salary/structure`
**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "teacher": "507f1f77bcf86cd799439012",
  "amount": 50000,
  "salaryMonth": "2024-03",
  "dueDate": "2024-03-31T00:00:00.000Z",
  "remarks": "March 2024 salary"
}
```

**Response:**
```json
{
  "message": "Salary structure created successfully",
  "payment": {
    "_id": "507f1f77bcf86cd799439019",
    "schoolId": "SCH001",
    "paymentType": "salary",
    "teacher": {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Sarah Johnson",
      "email": "sarah.johnson@school.com"
    },
    "amount": 50000,
    "paidAmount": 0,
    "remainingAmount": 50000,
    "salaryMonth": "2024-03",
    "status": "pending",
    "dueDate": "2024-03-31T00:00:00.000Z",
    "paymentMethod": "pending",
    "remarks": "March 2024 salary"
  }
}
```

### 2. Get Salary Payment Status
**GET** `/api/fees/salary`
**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `month` (optional): Filter by specific month (YYYY-MM format)
- `status` (optional): Filter by payment status

**Example:** `/api/fees/salary?month=2024-03&status=pending`

**Response:**
```json
{
  "salaryPayments": [
    {
      "_id": "507f1f77bcf86cd799439019",
      "teacher": {
        "_id": "507f1f77bcf86cd799439012",
        "name": "Sarah Johnson",
        "email": "sarah.johnson@school.com",
        "role": "class_teacher"
      },
      "amount": 50000,
      "paidAmount": 0,
      "remainingAmount": 50000,
      "salaryMonth": "2024-03",
      "status": "pending",
      "dueDate": "2024-03-31T00:00:00.000Z",
      "paymentMethod": "pending"
    },
    {
      "_id": "507f1f77bcf86cd799439020",
      "teacher": {
        "_id": "507f1f77bcf86cd799439013",
        "name": "Michael Brown",
        "email": "michael.brown@school.com",
        "role": "subject_teacher"
      },
      "amount": 55000,
      "paidAmount": 55000,
      "remainingAmount": 0,
      "salaryMonth": "2024-03",
      "status": "completed",
      "dueDate": "2024-03-31T00:00:00.000Z",
      "paymentMethod": "bank_transfer",
      "transactionId": "SAL789012"
    }
  ],
  "statistics": {
    "totalTeachers": 2,
    "paidTeachers": 1,
    "partialTeachers": 0,
    "pendingTeachers": 1,
    "overdueTeachers": 0,
    "totalAmount": 105000,
    "paidAmount": 55000,
    "remainingAmount": 50000
  }
}
```

### 3. Record Salary Payment
**POST** `/api/fees/salary/payment`
**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "paymentId": "507f1f77bcf86cd799439019",
  "amount": 50000,
  "paymentMethod": "bank_transfer",
  "transactionId": "SAL345678",
  "remarks": "March 2024 salary payment",
  "paymentDate": "2024-03-30T00:00:00.000Z"
}
```

**Response:**
```json
{
  "message": "Salary payment recorded successfully",
  "payment": {
    "_id": "507f1f77bcf86cd799439019",
    "teacher": {
      "name": "Sarah Johnson",
      "email": "sarah.johnson@school.com"
    },
    "amount": 50000,
    "paidAmount": 50000,
    "remainingAmount": 0,
    "status": "completed",
    "salaryMonth": "2024-03",
    "paymentMethod": "bank_transfer",
    "transactionId": "SAL345678",
    "paymentHistory": [
      {
        "amount": 50000,
        "paymentDate": "2024-03-30T00:00:00.000Z",
        "paymentMethod": "bank_transfer",
        "transactionId": "SAL345678",
        "remarks": "March 2024 salary payment"
      }
    ]
  }
}
```

### 4. Get Teacher's Salary Records (Teacher Dashboard)
**GET** `/api/fees/teacher/my-salary`
**Headers:** `Authorization: Bearer <teacher_token>`

**Description:** Teachers can view their own salary payment history.

**Response:**
```json
[
  {
    "_id": "507f1f77bcf86cd799439019",
    "amount": 50000,
    "paidAmount": 50000,
    "remainingAmount": 0,
    "salaryMonth": "2024-03",
    "status": "completed",
    "dueDate": "2024-03-31T00:00:00.000Z",
    "paymentMethod": "bank_transfer",
    "transactionId": "SAL345678",
    "paymentHistory": [...]
  },
  {
    "_id": "507f1f77bcf86cd799439021",
    "amount": 50000,
    "paidAmount": 0,
    "remainingAmount": 50000,
    "salaryMonth": "2024-04",
    "status": "pending",
    "dueDate": "2024-04-30T00:00:00.000Z",
    "paymentMethod": "pending"
  }
]
```

---

## Class Endpoints

**Note:** All class operations are automatically scoped to the admin's school (schoolId).

### 1. Create Class
**POST** `/api/classes`
**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "name": "Grade 11B",
  "grade": "11",
  "section": "B",
  "teacher": "507f1f77bcf86cd799439012",
  "subjects": ["Mathematics", "Physics", "Chemistry", "Biology"],
  "capacity": 40
}
```

**Response:**
```json
{
  "message": "Class created successfully",
  "class": {
    "_id": "507f1f77bcf86cd799439014",
    "name": "Grade 11B",
    "schoolId": "SCH001",
    "grade": "11",
    "section": "B",
    "teacher": {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Sarah Johnson",
      "email": "sarah.johnson@school.com"
    },
    "subjects": ["Mathematics", "Physics", "Chemistry", "Biology"],
    "students": [],
    "capacity": 40,
    "currentEnrollment": 0,
    "performance": {
      "averageGrade": 0,
      "attendanceRate": 0
    },
    "createdBy": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "admin1@school.com"
    },
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### 2. Get All Classes (School-Specific)
**GET** `/api/classes`
**Headers:** `Authorization: Bearer <token>`

**Description:** Returns only classes from the authenticated admin's school.

**Response:**
```json
[
  {
    "_id": "507f1f77bcf86cd799439014",
    "name": "Grade 10A",
    "schoolId": "SCH001",
    "teacher": {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Sarah Johnson",
      "email": "sarah.johnson@school.com"
    },
    "subjects": ["Mathematics", "Physics", "Chemistry"],
    "students": [
      {
        "_id": "507f1f77bcf86cd799439013",
        "name": "Alice Wilson",
        "email": "alice.wilson@student.com"
      }
    ],
    "performance": {
      "averageGrade": 86.5,
      "attendanceRate": 92.0
    },
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
]
```

### 3. Update Class
**PUT** `/api/classes/:id`
**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "name": "Grade 10A Advanced",
  "teacher": "507f1f77bcf86cd799439015",
  "subjects": ["Advanced Mathematics", "Physics", "Chemistry", "Computer Science"]
}
```

### 4. Get Class Performance
**GET** `/api/classes/:id/performance`
**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "classId": "507f1f77bcf86cd799439014",
  "className": "Grade 10A",
  "performance": {
    "averageGrade": 86.5,
    "attendanceRate": 92.0
  },
  "studentsCount": 2
}
```

### 5. Delete Class
**DELETE** `/api/classes/:id`
**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "message": "Class deleted successfully"
}
```

---

## Event Endpoints

**Note:** All event operations are automatically scoped to the admin's school (schoolId).

### 1. Create Event
**POST** `/api/events`
**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "title": "Science Fair",
  "date": "2024-04-20T09:00:00.000Z",
  "description": "Annual science exhibition for all grades",
  "targetAudience": "students"
}
```

**Response:**
```json
{
  "message": "Event created successfully",
  "event": {
    "_id": "507f1f77bcf86cd799439015",
    "title": "Science Fair",
    "schoolId": "SCH001",
    "date": "2024-04-20T09:00:00.000Z",
    "description": "Annual science exhibition for all grades",
    "targetAudience": "students",
    "createdBy": "507f1f77bcf86cd799439011",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### 2. Get All Events (School-Specific)
**GET** `/api/events`
**Headers:** `Authorization: Bearer <token>`

**Description:** Returns only events from the authenticated admin's school.

**Response:**
```json
[
  {
    "_id": "507f1f77bcf86cd799439015",
    "title": "Sports Day",
    "schoolId": "SCH001",
    "date": "2024-03-15T00:00:00.000Z",
    "description": "Annual sports competition for all students",
    "targetAudience": "students",
    "createdBy": "507f1f77bcf86cd799439011",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  },
  {
    "_id": "507f1f77bcf86cd799439016",
    "title": "Parent-Teacher Meeting",
    "schoolId": "SCH001",
    "date": "2024-02-20T00:00:00.000Z",
    "description": "Quarterly parent-teacher conference",
    "targetAudience": "parents",
    "createdBy": "507f1f77bcf86cd799439011",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
]
```

### 3. Update Event
**PUT** `/api/events/:id`
**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "title": "Updated Sports Day",
  "date": "2024-03-20T08:00:00.000Z",
  "description": "Annual sports competition - Updated schedule",
  "targetAudience": "all"
}
```

### 4. Delete Event
**DELETE** `/api/events/:id`
**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "message": "Event cancelled successfully"
}
```

---

## Dashboard Performance Optimizations

### Schedule Query Optimizations

The system includes highly optimized queries for dashboard performance:

1. **Student Daily Schedule**: O(log n) lookup using compound indexes
2. **Teacher Daily Schedule**: Optimized aggregation with teacher-specific filtering
3. **Room Utilization**: Fast room-based queries for facility management
4. **Weekly Workload**: Efficient teacher workload calculation

### Database Indexing Strategy

```javascript
// Schedule Performance Indexes
{ schoolId: 1, class: 1, dayOfWeek: 1, isActive: 1 }       // Student dashboard
{ schoolId: 1, 'periods.teacher': 1, dayOfWeek: 1 }       // Teacher dashboard
{ schoolId: 1, 'periods.room': 1, dayOfWeek: 1 }          // Room utilization
{ schoolId: 1, academicYear: 1, isActive: 1 }             // Admin overview

// Fee Management Indexes  
{ schoolId: 1, paymentType: 1, status: 1 }                // Payment tracking
{ schoolId: 1, student: 1, paymentType: 1 }               // Student fees
{ schoolId: 1, teacher: 1, paymentType: 1 }               // Teacher salary
{ schoolId: 1, salaryMonth: 1 }                           // Monthly reports
```

### Static Methods for Optimized Queries

The Schedule model includes static methods for fast dashboard queries:

```javascript
// Optimized static methods
Schedule.getStudentDailySchedule(schoolId, classId, dayOfWeek)
Schedule.getTeacherDailySchedule(schoolId, teacherId, dayOfWeek)
Schedule.getClassWeeklySchedule(schoolId, classId)
Schedule.getTeacherWeeklySchedule(schoolId, teacherId)
Schedule.getRoomUtilization(schoolId, dayOfWeek)
```

---

## Security Features

### Multi-Level Authentication
- **JWT-Based**: Secure token-based authentication for all user types
- **Password Hashing**: bcrypt with salt rounds for password security
- **User Type Validation**: Automatic user type detection and validation
- **School-Level Isolation**: Complete data isolation between schools

### Access Control
- **Role-Based Access**: Different endpoints for admin/teacher/student
- **School-Scoped Data**: Automatic filtering by schoolId
- **Permission-Based**: Admin permissions control feature access
- **Self-Service Dashboards**: Students/teachers can only access their own data

### Data Protection
- **Input Validation**: Comprehensive validation for all endpoints
- **SQL Injection Prevention**: MongoDB and proper validation prevent attacks
- **Cross-School Protection**: Users cannot access other schools' data
- **Secure Headers**: Authorization headers required for protected routes

---

## Error Responses

### Validation Error (400)
```json
{
  "errors": [
    {
      "msg": "Fee amount must be a positive number",
      "param": "feeComponents.0.amount",
      "location": "body"
    }
  ]
}
```

### Unauthorized (401)
```json
{
  "message": "No token, authorization denied"
}
```

### Forbidden (403)
```json
{
  "message": "Access denied. Admin only."
}
```

### Not Found (404)
```json
{
  "message": "Fee structure not found"
}
```

### Business Logic Error (400)
```json
{
  "message": "Payment amount exceeds remaining balance"
}
```

### Server Error (500)
```json
{
  "message": "Server error"
}
```

---

## Password Management

### Password Requirements
- **Minimum Length**: 6 characters
- **Hashing**: bcrypt with salt rounds (10)
- **Storage**: Only hashed passwords stored in database
- **Validation**: Password comparison using bcrypt.compare()

### User Account Creation
- **Admin Registration**: Self-registration with school creation
- **Teacher Addition**: Created by admin with initial password
- **Student Enrollment**: Created by admin with initial password
- **Password Reset**: Manual process through admin (future: email reset)

### Login Flow
1. User submits email/password to appropriate endpoint
2. System finds user by email and user type
3. Password verified using bcrypt.compare()
4. JWT token generated with userType and schoolId
5. Token returned for subsequent API calls

---

## Multi-Tenant Data Flow

### School Registration Flow
1. Admin registers with optional schoolId
2. System generates unique schoolId if not provided
3. All subsequent data automatically tagged with schoolId
4. Teachers and students inherit admin's schoolId

### Data Isolation Mechanism
1. **Automatic Filtering**: All queries automatically include schoolId filter
2. **Compound Indexes**: Fast school-specific data retrieval
3. **Validation**: Cross-school data access prevented at API level
4. **Authentication Context**: schoolId included in JWT and request context

### Performance Characteristics
- **Query Time**: O(log n) for school-specific queries
- **Scalability**: Linear scaling with number of schools
- **Index Efficiency**: Compound indexes ensure optimal performance
- **Memory Usage**: Efficient indexing strategy minimizes memory overhead

---

## Testing Instructions

### 1. Multi-User Authentication Testing
```bash
# Test Admin Login
curl -X POST http://localhost:5000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin1@school.com","password":"password123"}'

# Test Teacher Login  
curl -X POST http://localhost:5000/api/auth/teacher/login \
  -H "Content-Type: application/json" \
  -d '{"email":"sarah.johnson@school.com","password":"password123"}'

# Test Student Login
curl -X POST http://localhost:5000/api/auth/student/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice.wilson@student.com","password":"password123"}'
```

### 2. Schedule Testing
```bash
# Get Student Daily Schedule
curl -X GET http://localhost:5000/api/schedules/student/CLASS_ID/daily/monday \
  -H "Authorization: Bearer STUDENT_TOKEN"

# Get Teacher Daily Schedule  
curl -X GET http://localhost:5000/api/schedules/teacher/TEACHER_ID/daily/monday \
  -H "Authorization: Bearer TEACHER_TOKEN"

# Get Room Utilization
curl -X GET http://localhost:5000/api/schedules/room-utilization/monday \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

### 3. Fee Management Testing
```bash
# Create Fee Structure
curl -X POST http://localhost:5000/api/fees/structure \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{"name":"Test Fees","class":"CLASS_ID","feeComponents":[{"name":"Tuition","amount":1000,"type":"tuition"}],"dueDate":"2024-12-31"}'

# Record Payment
curl -X POST http://localhost:5000/api/fees/payment \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{"paymentId":"PAYMENT_ID","amount":500,"paymentMethod":"cash","paymentDate":"2024-01-15"}'

# Get Student Fees
curl -X GET http://localhost:5000/api/fees/student/my-fees \
  -H "Authorization: Bearer STUDENT_TOKEN"
```

### 4. Salary Management Testing
```bash
# Create Salary Structure
curl -X POST http://localhost:5000/api/fees/salary/structure \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{"teacher":"TEACHER_ID","amount":50000,"salaryMonth":"2024-01","dueDate":"2024-01-31"}'

# Get Teacher Salary Records
curl -X GET http://localhost:5000/api/fees/teacher/my-salary \
  -H "Authorization: Bearer TEACHER_TOKEN"
```

---

## Production Considerations

### Environment Variables Required
```env
MONGODB_URI=mongodb://localhost:27017/school_management
JWT_SECRET=your_super_secure_jwt_secret_here
PORT=5000
NODE_ENV=production
```

### Recommended Production Settings
- **Rate Limiting**: 100 requests per minute per IP
- **CORS**: Configure for specific frontend domains  
- **HTTPS**: Use SSL certificates in production
- **Monitoring**: Implement comprehensive logging and monitoring
- **Backup**: Regular database backups with school-level restoration
- **Caching**: Redis caching for frequently accessed schedules
- **Load Balancing**: Multiple server instances behind load balancer

### Security Checklist
- [ ] Secure JWT secret (32+ characters)
- [ ] HTTPS enforced in production
- [ ] Input validation on all endpoints
- [ ] Rate limiting implemented
- [ ] Database connections secured
- [ ] Error logging configured
- [ ] File upload restrictions (if implemented)
- [ ] CORS properly configured

---

## API Summary

| Feature | Admin | Teacher | Student | Endpoints |
|---------|-------|---------|---------|-----------|
| Authentication | ✅ | ✅ | ✅ | 4 |
| Schedule Management | ✅ | ✅ (view) | ✅ (view) | 12 |
| Fee Management | ✅ | ❌ | ✅ (view) | 8 |
| Salary Management | ✅ | ✅ (view) | ❌ | 4 |
| Student Management | ✅ | ❌ | ❌ | 5 |
| Teacher Management | ✅ | ❌ | ❌ | 5 |
| Class Management | ✅ | ❌ | ❌ | 5 |
| Event Management | ✅ | ❌ | ❌ | 4 |

**Total Endpoints**: 47 comprehensive endpoints covering all school management needs.

---

## Notes
- All dates should be in ISO 8601 format
- Phone validation requires valid mobile phone format  
- Email validation is enforced on all email fields
- JWT tokens expire after 24 hours
- All responses include appropriate HTTP status codes
- schoolId is automatically managed - never manually specified in request bodies
- Cross-school data access is completely prevented at the API level
- Database queries are optimized with compound indexes for fast multi-tenant performance
- Password authentication required for all user types (admin/teacher/student)
- Fee and salary management includes comprehensive payment tracking
- Schedule system supports complex timetable management with room allocation
- Real-time dashboard queries optimized for sub-100ms response times
