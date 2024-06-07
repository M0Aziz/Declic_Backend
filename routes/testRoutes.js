const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const Test = require('../models/Test');


// Définir le dossier pour les images téléversées
const uploadDir = path.join(__dirname, '..','public', 'images');
fs.existsSync(uploadDir) || fs.mkdirSync(uploadDir);

// Configuration de Multer pour le stockage des images
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });

// Route POST pour recevoir les données du formulaire et l'image téléversée
router.post('/api/upload', upload.single('image'), async (req, res) => {
  // Traitement des données du formulaire
  try {
  const { nom, prenom } = req.body;
  const image = req.file.filename;
  const newTest = new Test({
    nom: nom,
    prenom: prenom,
    image: image
  });

  // Sauvegarder l'utilisateur en base de données
  await newTest.save();

  // Logique de sauvegarde en base de données ou autre traitement

  res.json({ success: true, message: 'Données enregistrées avec succès.' });

} catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: 'Une erreur est survenue lors de l\'enregistrement des données.' });
  }
});

module.exports = router;
