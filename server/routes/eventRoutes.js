const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');

router.put('/:event_id', eventController.updateEvent);
// Include other routes for completeness
router.post('/', eventController.createEvent);
router.get('/', eventController.getEvents);
router.get('/:event_id', eventController.getEventById);
router.delete('/:event_id', eventController.deleteEvent);
router.post('/register', eventController.registerStudentForEvent);
router.get('/:event_id/students', eventController.getStudentsRegisteredForEvent);

module.exports = router;