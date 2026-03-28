const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/e-learn';
    await mongoose.connect(mongoUri);
    console.log('MongoDB connecte avec succes.');
  } catch (error) {
    console.error('Erreur connexion MongoDB:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
