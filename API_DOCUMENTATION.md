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

## Test Accounts
Use these seeded accounts for testing:
- **Email**: `admin1@school.com` | **Password**: `password123` | **School**: Springfield High School | **School ID**: SCH001
- **Email**: `admin2@school.com` | **Password**: `password123` | **School**: Riverside Academy | **School ID**: SCH002

---

## Multi-Tenant Architecture

This system supports multiple schools with complete data isolation:

- **School ID**: Each school has a unique identifier (SCH001-SCH99999)
- **Data Isolation**: All data is automatically filtered by schoolId
- **Auto-Assignment**: schoolId is automatically assigned to all records based on admin's school
- **Fast Queries**: Database indexes ensure optimal performance for school-specific queries

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

### 2. Login Admin
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

### 3. Get Admin Profile
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

### 4. Update Admin
**PUT** `/api/admin/:id`
**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "name": "Updated Admin Name",
  "email": "updated@school.com",
  "phone": "+9876543210",
  "schoolName": "Updated School Name",
  "permissions": ["manage_students", "manage_teachers"]
}
```

**Note:** schoolId cannot be updated after creation.

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
  "qualifications": ["MSc Biology", "BEd"],
  "role": "subject_teacher",
  "assignedClass": "507f1f77bcf86cd799439014"
}
```

**Note:** `assignedClass` is optional and should be a valid Class ObjectId.

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
  "parentInfo": {
    "name": "David Smith",
    "contact": "+1234567894"
  }
}
```

**Response:**
```json
{
  "message": "Student enrolled successfully",
  "student": {
    "_id": "507f1f77bcf86cd799439013",
    "name": "Charlie Smith",
    "email": "charlie.smith@student.com",
    "schoolId": "SCH001",
    "parentInfo": {
      "name": "David Smith",
      "contact": "+1234567894"
    },
    "academicProgress": [],
    "createdBy": "507f1f77bcf86cd799439011",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### 2. Get All Students (School-Specific)
**GET** `/api/students`
**Headers:** `Authorization: Bearer <token>`

**Description:** Returns only students from the authenticated admin's school.

**Response:**
```json
[
  {
    "_id": "507f1f77bcf86cd799439013",
    "name": "Alice Wilson",
    "email": "alice.wilson@student.com",
    "schoolId": "SCH001",
    "parentInfo": {
      "name": "Robert Wilson",
      "contact": "+1234567892"
    },
    "academicProgress": [
      {
        "subject": "Mathematics",
        "grade": 85,
        "semester": "Fall 2023"
      }
    ],
    "createdBy": "507f1f77bcf86cd799439011",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
]
```

### 3. Update Student
**PUT** `/api/students/:id`
**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "name": "Alice Wilson Updated",
  "parentInfo": {
    "name": "Robert Wilson",
    "contact": "+1234567999"
  },
  "academicProgress": [
    {
      "subject": "Mathematics",
      "grade": 90,
      "semester": "Spring 2024"
    },
    {
      "subject": "Physics",
      "grade": 82,
      "semester": "Spring 2024"
    }
  ]
}
```

### 4. Get Student Progress
**GET** `/api/students/:id/progress`
**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "studentId": "507f1f77bcf86cd799439013",
  "studentName": "Alice Wilson",
  "academicProgress": [
    {
      "subject": "Mathematics",
      "grade": 85,
      "semester": "Fall 2023"
    },
    {
      "subject": "Physics",
      "grade": 78,
      "semester": "Fall 2023"
    }
  ]
}
```

### 5. Delete Student
**DELETE** `/api/students/:id`
**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "message": "Student removed successfully"
}
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
  "teacher": "507f1f77bcf86cd799439012",
  "subjects": ["Mathematics", "Physics", "Chemistry", "Biology"]
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
    "teacher": {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Sarah Johnson",
      "email": "sarah.johnson@school.com"
    },
    "subjects": ["Mathematics", "Physics", "Chemistry", "Biology"],
    "students": [],
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

## Database Performance & Architecture

### Indexing Strategy
The system uses optimized indexes for fast multi-tenant queries:

```javascript
// Compound indexes for each model
{ schoolId: 1, createdAt: -1 }     // Fast school-specific listing
{ schoolId: 1, email: 1 }          // Unique email per school
{ schoolId: 1, name: 1 }           // Unique names per school (classes)
{ schoolId: 1, date: 1 }           // Event date sorting
```

### Data Isolation
- **Automatic Filtering**: All queries automatically filter by schoolId
- **Unique Constraints**: Email uniqueness scoped to individual schools
- **Performance**: Indexes ensure O(log n) query performance per school
- **Scalability**: System can handle thousands of schools efficiently

### Security Features
- **School-Level Access Control**: Users can only access their school's data
- **JWT-Based Authentication**: Secure token-based authentication
- **Input Validation**: Comprehensive validation for all endpoints
- **SQL Injection Prevention**: MongoDB and proper validation prevent attacks

---

## Error Responses

### Validation Error (400)
```json
{
  "errors": [
    {
      "msg": "Name must be at least 2 characters",
      "param": "name",
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
  "message": "Access denied. Insufficient permissions."
}
```

### Not Found (404)
```json
{
  "message": "Teacher not found"
}
```

### Duplicate Entry (400)
```json
{
  "message": "Teacher already exists with this email in your school"
}
```

### Server Error (500)
```json
{
  "message": "Server error"
}
```

---

## School ID System

### Format
- **Pattern**: SCH + 3-5 digits (e.g., SCH001, SCH1234, SCH99999)
- **Auto-generation**: If not provided during registration, system generates unique ID
- **Validation**: Must match regex pattern `/^SCH[0-9]{3,5}$/`
- **Uniqueness**: Each school ID must be unique across the system

### Usage
- **School Identification**: Unique identifier for each school
- **Data Isolation**: All data queries filtered by schoolId
- **Auto-Assignment**: Automatically assigned to all records
- **Immutable**: Cannot be changed after admin creation

### Generator Algorithm
```javascript
// Starts from SCH001 and increments to SCH99999
// Checks for uniqueness before assignment
// Fails if all IDs are exhausted (extremely unlikely)
```

---

## Testing Instructions

### 1. Setup
1. Run `npm run seed` to populate test data with multiple schools
2. Start server with `npm run dev`
3. Use Postman, curl, or any API testing tool

### 2. Multi-School Testing
1. **Login as School 1**: `admin1@school.com` / `password123` (SCH001)
2. **Login as School 2**: `admin2@school.com` / `password123` (SCH002)
3. **Verify Data Isolation**: Each admin only sees their school's data
4. **Test Cross-School Access**: Attempt to access other school's records (should fail)

### 3. Sample cURL Commands

**Login School 1:**
```bash
curl -X POST http://localhost:5000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin1@school.com","password":"password123"}'
```

**Get School-Specific Teachers:**
```bash
curl -X GET http://localhost:5000/api/teachers \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

**Create School-Specific Student:**
```bash
curl -X POST http://localhost:5000/api/students \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -d '{"name":"Test Student","email":"test@student.com","parentInfo":{"name":"Test Parent","contact":"+1234567890"}}'
```

### 4. Performance Testing
- **Large Dataset**: Create multiple schools with hundreds of records each
- **Query Performance**: Test response times for school-specific queries
- **Concurrent Access**: Test multiple schools accessing simultaneously
- **Index Verification**: Use MongoDB explain() to verify index usage

---

## API Rate Limiting & Production Notes

### Recommended Production Settings
- **Rate Limiting**: 100 requests per minute per IP
- **CORS**: Configure for specific frontend domains
- **HTTPS**: Use SSL certificates in production
- **Environment Variables**: Secure JWT secrets and database credentials
- **Logging**: Implement comprehensive logging for monitoring
- **Backup**: Regular database backups with school-level restoration

### Monitoring Endpoints
Consider adding these endpoints for production monitoring:
- `GET /api/health` - System health check
- `GET /api/stats` - Database statistics per school
- `GET /api/admin/analytics` - School-specific analytics

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
