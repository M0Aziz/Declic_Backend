const mongoose = require('mongoose');

// Définir le schéma du modèle
const testSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: true
  },
  prenom: {
    type: String,
    required: true
  },
  image: {
    type: String, // Ou vous pouvez utiliser un autre type de champ approprié pour stocker le chemin de l'image
    required: true
  }
});

// Créer le modèle à partir du schéma
const Test = mongoose.model('Test', testSchema);

module.exports = Test;
