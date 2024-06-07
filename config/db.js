const mongoose = require('mongoose');

const connectDB = async () => {
 
  try {
    await mongoose.connect('mongodb://localhost:27017/declic', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connexion à MongoDB réussie');
  } catch (error) {
    console.error('Erreur lors de la connexion à MongoDB:', error.message);
    process.exit(1); // Quitte l'application avec un code d'erreur
  }
};

module.exports = connectDB;
