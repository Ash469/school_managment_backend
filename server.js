const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/database');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/fees', require('./routes/feeRoutes'));
app.use('/api/classes', require('./routes/classRoutes'));
app.use('/api/teachers', require('./routes/teacherRoutes'));
app.use('/api/students', require('./routes/studentRoutes'));
app.use('/api/events', require('./routes/eventRoutes'));
app.use('/api/schedules', require('./routes/scheduleRoutes'));

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'School Management System API' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
