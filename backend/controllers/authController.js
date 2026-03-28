const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { normalizeText, hasMinLength, isValidEmail } = require('../utils/validation');
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';

const signToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      isAdmin: user.isAdmin
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

const register = async (req, res) => {
  try {
    const { name, email, password, adminSecret } = req.body;
    const normalizedName = normalizeText(name);
    const normalizedEmail = normalizeText(email).toLowerCase();

    if (!normalizedName || !normalizedEmail || !password) {
      return res.status(400).json({ message: 'Nom, email et mot de passe sont obligatoires.' });
    }

    if (!hasMinLength(normalizedName, 2)) {
      return res.status(400).json({ message: 'Le nom doit contenir au moins 2 caracteres.' });
    }

    if (!isValidEmail(normalizedEmail)) {
      return res.status(400).json({ message: 'Adresse email invalide.' });
    }

    if (String(password).length < 8) {
      return res.status(400).json({ message: 'Le mot de passe doit contenir au moins 8 caracteres.' });
    }

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({ message: 'Un compte existe deja avec cet email.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const shouldBeAdmin = Boolean(process.env.ADMIN_SECRET) && adminSecret === process.env.ADMIN_SECRET;

    const user = await User.create({
      name: normalizedName,
      email: normalizedEmail,
      password: hashedPassword,
      isAdmin: shouldBeAdmin
    });

    const token = signToken(user);

    return res.status(201).json({
      message: 'Inscription reussie.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin
      }
    });
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur lors de l inscription.' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = normalizeText(email).toLowerCase();

    if (!normalizedEmail || !password) {
      return res.status(400).json({ message: 'Email et mot de passe requis.' });
    }

    if (!isValidEmail(normalizedEmail)) {
      return res.status(400).json({ message: 'Adresse email invalide.' });
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({ message: 'Identifiants invalides.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Identifiants invalides.' });
    }

    const token = signToken(user);

    return res.status(200).json({
      message: 'Connexion reussie.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin
      }
    });
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur lors de la connexion.' });
  }
};

const me = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur introuvable.' });
    }

    return res.status(200).json(user);
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};

module.exports = {
  register,
  login,
  me
};
