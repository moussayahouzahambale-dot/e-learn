const Lesson = require('../models/Lesson');
const mongoose = require('mongoose');
const { normalizeText, hasMinLength } = require('../utils/validation');

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const getLessonsByCourse = async (req, res) => {
  try {
    const { courseId } = req.params;

    if (!isValidObjectId(courseId)) {
      return res.status(400).json({ message: 'ID de cours invalide.' });
    }

    const lessons = await Lesson.find({ course: courseId }).sort({ createdAt: 1 });
    return res.status(200).json(lessons);
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};

const getLessonById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: 'ID de lecon invalide.' });
    }

    const lesson = await Lesson.findById(id).populate('course', 'title');

    if (!lesson) {
      return res.status(404).json({ message: 'Lecon introuvable.' });
    }

    return res.status(200).json(lesson);
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};

const createLesson = async (req, res) => {
  try {
    const { title, content, codeExample, exercise, course } = req.body;
    const normalizedTitle = normalizeText(title);
    const normalizedContent = normalizeText(content);

    if (!normalizedTitle || !normalizedContent || !course) {
      return res.status(400).json({ message: 'Titre, contenu et cours sont obligatoires.' });
    }

    if (!hasMinLength(normalizedTitle, 3)) {
      return res.status(400).json({ message: 'Le titre de la lecon doit contenir au moins 3 caracteres.' });
    }

    if (!hasMinLength(normalizedContent, 10)) {
      return res.status(400).json({ message: 'Le contenu de la lecon doit contenir au moins 10 caracteres.' });
    }

    if (!isValidObjectId(course)) {
      return res.status(400).json({ message: 'Cours invalide.' });
    }

    const lesson = await Lesson.create({
      title: normalizedTitle,
      content: normalizedContent,
      codeExample: normalizeText(codeExample),
      exercise: normalizeText(exercise),
      course
    });

    return res.status(201).json(lesson);
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};

const updateLesson = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, codeExample, exercise } = req.body;
    const normalizedTitle = normalizeText(title);
    const normalizedContent = normalizeText(content);

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: 'ID de lecon invalide.' });
    }

    const lesson = await Lesson.findById(id);
    if (!lesson) {
      return res.status(404).json({ message: 'Lecon introuvable.' });
    }

    if (title) {
      if (!hasMinLength(normalizedTitle, 3)) {
        return res.status(400).json({ message: 'Le titre de la lecon doit contenir au moins 3 caracteres.' });
      }

      lesson.title = normalizedTitle;
    }
    if (content) {
      if (!hasMinLength(normalizedContent, 10)) {
        return res.status(400).json({ message: 'Le contenu de la lecon doit contenir au moins 10 caracteres.' });
      }

      lesson.content = normalizedContent;
    }
    if (typeof codeExample === 'string') {
      lesson.codeExample = normalizeText(codeExample);
    }
    if (typeof exercise === 'string') {
      lesson.exercise = normalizeText(exercise);
    }

    await lesson.save();
    return res.status(200).json(lesson);
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};

const deleteLesson = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: 'ID de lecon invalide.' });
    }

    const lesson = await Lesson.findById(id);

    if (!lesson) {
      return res.status(404).json({ message: 'Lecon introuvable.' });
    }

    await lesson.deleteOne();
    return res.status(200).json({ message: 'Lecon supprimee.' });
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};

module.exports = {
  getLessonsByCourse,
  getLessonById,
  createLesson,
  updateLesson,
  deleteLesson
};
