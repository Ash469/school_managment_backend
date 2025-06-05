const express = require('express');
const { body, validationResult } = require('express-validator');
const Event = require('../models/Event');
const { auth } = require('../middleware/auth');

const router = express.Router();

const validateEvent = [
  body('title').trim().isLength({ min: 2 }).withMessage('Event title must be at least 2 characters'),
  body('date').isISO8601().withMessage('Please provide a valid date'),
  body('targetAudience').isIn(['students', 'teachers', 'parents', 'all']).withMessage('Invalid target audience')
];

// @route   POST /api/events
// @desc    Create an event
// @access  Private
router.post('/', auth, validateEvent, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, date, description, targetAudience } = req.body;

    const event = new Event({
      title,
      date,
      description,
      targetAudience,
      schoolId: req.schoolId, // Auto-assign from authenticated admin
      createdBy: req.admin.id
    });

    await event.save();

    res.status(201).json({
      message: 'Event created successfully',
      event
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/events
// @desc    Get all events for admin's school
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const events = await Event.find({ schoolId: req.schoolId })
      .sort({ date: 1 });

    res.json(events);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/events/:id
// @desc    Update event details
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const { title, date, description, targetAudience } = req.body;

    const event = await Event.findOneAndUpdate(
      { _id: req.params.id, schoolId: req.schoolId },
      { title, date, description, targetAudience },
      { new: true, runValidators: true }
    );

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.json({
      message: 'Event updated successfully',
      event
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/events/:id
// @desc    Cancel an event
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const event = await Event.findOneAndDelete({
      _id: req.params.id,
      schoolId: req.schoolId
    });

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.json({ message: 'Event cancelled successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
