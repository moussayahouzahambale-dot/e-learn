const Course = require('../models/Course');
const mongoose = require('mongoose');
const Lesson = require('../models/Lesson');
const { normalizeText, hasMinLength } = require('../utils/validation');

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const getCourses = async (req, res) => {
  try {
    const { category, level } = req.query;
    const filter = {};

    if (category) {
      filter.category = category;
    }

    if (level) {
      filter.level = level;
    }

    const courses = await Course.find(filter)
      .populate('category', 'name description')
      .sort({ createdAt: -1 });

    return res.status(200).json(courses);
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};

const searchCourses = async (req, res) => {
  try {
    const { q = '' } = req.query;

    const courses = await Course.find({
      title: { $regex: q, $options: 'i' }
    })
      .populate('category', 'name')
      .sort({ createdAt: -1 });

    return res.status(200).json(courses);
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};

const getCourseById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: 'ID de cours invalide.' });
    }

    const course = await Course.findById(id).populate('category', 'name description');

    if (!course) {
      return res.status(404).json({ message: 'Cours introuvable.' });
    }

    return res.status(200).json(course);
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};

const createCourse = async (req, res) => {
  try {
    const { title, description, category, level } = req.body;
    const normalizedTitle = normalizeText(title);
    const normalizedDescription = normalizeText(description);

    if (!normalizedTitle || !normalizedDescription || !category || !level) {
      return res.status(400).json({ message: 'Tous les champs du cours sont obligatoires.' });
    }

    if (!hasMinLength(normalizedTitle, 3)) {
      return res.status(400).json({ message: 'Le titre du cours doit contenir au moins 3 caracteres.' });
    }

    if (!hasMinLength(normalizedDescription, 10)) {
      return res.status(400).json({ message: 'La description du cours doit contenir au moins 10 caracteres.' });
    }

    if (!isValidObjectId(category)) {
      return res.status(400).json({ message: 'Categorie invalide.' });
    }

    const course = await Course.create({
      title: normalizedTitle,
      description: normalizedDescription,
      category,
      level
    });

    const populated = await course.populate('category', 'name description');
    return res.status(201).json(populated);
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};

const updateCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, category, level } = req.body;
    const normalizedTitle = normalizeText(title);
    const normalizedDescription = normalizeText(description);

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: 'ID de cours invalide.' });
    }

    if (category && !isValidObjectId(category)) {
      return res.status(400).json({ message: 'Categorie invalide.' });
    }

    const course = await Course.findById(id);
    if (!course) {
      return res.status(404).json({ message: 'Cours introuvable.' });
    }

    if (title) {
      if (!hasMinLength(normalizedTitle, 3)) {
        return res.status(400).json({ message: 'Le titre du cours doit contenir au moins 3 caracteres.' });
      }

      course.title = normalizedTitle;
    }
    if (description) {
      if (!hasMinLength(normalizedDescription, 10)) {
        return res.status(400).json({ message: 'La description du cours doit contenir au moins 10 caracteres.' });
      }

      course.description = normalizedDescription;
    }
    if (category) {
      course.category = category;
    }
    if (level) {
      course.level = level;
    }

    await course.save();
    const populated = await course.populate('category', 'name description');

    return res.status(200).json(populated);
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};

const deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: 'ID de cours invalide.' });
    }

    const course = await Course.findById(id);

    if (!course) {
      return res.status(404).json({ message: 'Cours introuvable.' });
    }

    await Lesson.deleteMany({ course: id });
    await course.deleteOne();
    return res.status(200).json({ message: 'Cours supprime.' });
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};

module.exports = {
  getCourses,
  searchCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse
};
