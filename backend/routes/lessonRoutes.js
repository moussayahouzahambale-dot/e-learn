const express = require('express');
const {
  getLessonsByCourse,
  getLessonById,
  createLesson,
  updateLesson,
  deleteLesson
} = require('../controllers/lessonController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/course/:courseId', getLessonsByCourse);
router.get('/:id', getLessonById);
router.post('/', protect, adminOnly, createLesson);
router.put('/:id', protect, adminOnly, updateLesson);
router.delete('/:id', protect, adminOnly, deleteLesson);

module.exports = router;
