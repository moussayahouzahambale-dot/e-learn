const Category = require('../models/Category');
const mongoose = require('mongoose');
const Course = require('../models/Course');
const { normalizeText, hasMinLength } = require('../utils/validation');

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const getCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ createdAt: -1 });
    return res.status(200).json(categories);
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};

const createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    const normalizedName = normalizeText(name);
    const normalizedDescription = normalizeText(description);

    if (!normalizedName) {
      return res.status(400).json({ message: 'Le nom de categorie est obligatoire.' });
    }

    if (!hasMinLength(normalizedName, 2)) {
      return res.status(400).json({ message: 'Le nom de categorie doit contenir au moins 2 caracteres.' });
    }

    const exists = await Category.findOne({ name: normalizedName });
    if (exists) {
      return res.status(409).json({ message: 'Cette categorie existe deja.' });
    }

    const category = await Category.create({
      name: normalizedName,
      description: normalizedDescription
    });

    return res.status(201).json(category);
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};

const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const normalizedName = normalizeText(name);

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: 'ID de categorie invalide.' });
    }

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ message: 'Categorie introuvable.' });
    }

    if (name) {
      if (!hasMinLength(normalizedName, 2)) {
        return res.status(400).json({ message: 'Le nom de categorie doit contenir au moins 2 caracteres.' });
      }

      category.name = normalizedName;
    }

    if (typeof description === 'string') {
      category.description = normalizeText(description);
    }

    await category.save();
    return res.status(200).json(category);
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: 'ID de categorie invalide.' });
    }

    const linkedCourses = await Course.countDocuments({ category: id });
    if (linkedCourses > 0) {
      return res.status(409).json({ message: 'Impossible de supprimer cette categorie car des cours y sont rattaches.' });
    }

    const category = await Category.findById(id);

    if (!category) {
      return res.status(404).json({ message: 'Categorie introuvable.' });
    }

    await category.deleteOne();
    return res.status(200).json({ message: 'Categorie supprimee.' });
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};

module.exports = {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory
};
