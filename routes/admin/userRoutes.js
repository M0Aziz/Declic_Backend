const express = require('express');
const router = express.Router();
const User = require('../../models/User');
const verifyToken = require('../../middleware/authMiddleware');
const bcrypt = require('bcrypt');
const Activity = require('../../models/Activity');
const Profile = require('../../models/Profile');
const Comment = require('../../models/Comment');
const multer = require('multer');
const fs = require('fs');
const path = require('path');


const uploadDir = path.join(__dirname, '../..','public', 'images');
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
// Route pour récupérer tous les utilisateurs
router.get('/', verifyToken, async (req, res) => {
    try {
// Récupérer les paramètres de tri et de recherche de la requête
const { sort, filter  } = req.query;
const { perPage } = req.query;

// Extraire les champs de tri et la direction
let sortField, sortOrder;
if (sort) {
    const [field, order] = JSON.parse(sort);
    sortField = field;
    sortOrder = order === 'ASC' ? 1 : -1;
} else {
    // Définir un tri par défaut si aucun paramètre de tri n'est fourni
    sortField = 'lastName';
    sortOrder = 1; // Tri ascendant par défaut
}

// Créer un objet pour stocker les options de recherche
const searchOptions = {};

// Vérifier si un filtre est spécifié dans la requête
// Vérifier si un filtre est spécifié dans la requête
if (filter) {
  // Décoder le filtre JSON de la requête
  const decodedFilter = JSON.parse(decodeURIComponent(filter));
  // Modifier le filtre pour rechercher les noms de famille qui contiennent la sous-chaîne spécifiée
  if (decodedFilter.lastName) {
      searchOptions.lastName = { $regex: new RegExp(decodedFilter.lastName, 'i') };
  }
}
const totalCount = await User.countDocuments();

const defaultPageSize = 10;
const pageSize = perPage ? parseInt(perPage) : defaultPageSize;

const page = parseInt(req.query.page || 1); // Page actuelle
const startIndex = (page - 1) * pageSize; // Index de début
const endIndex = Math.min(startIndex + pageSize, totalCount); // Index de fin, en tenant compte du nombre total d'utilisateurs

const users = await User.find(searchOptions) // Appliquer le filtre de recherche
    .sort({ [sortField]: sortOrder }) // Appliquer le tri
    .skip(startIndex)
    .limit(pageSize);


            users.forEach(user => {
              if (user.profilePicture) {
                  user.profilePicture = `http://localhost:5000/images/${user.profilePicture}`;
              }
            });
        // Nombre total d'utilisateurs dans la base de données
        res.set('Content-Range', `users ${startIndex}-${endIndex}/${totalCount}`);

        // Renvoyer les utilisateurs paginés avec id inclus
        res.json(users.map(user => ({
            id: user._id.toString(), // Convertir l'_id en chaîne de caractères
            ...user._doc // Inclure le reste des données de l'utilisateur
        })));
    } catch (error) {
        console.error('Erreur lors de la récupération des utilisateurs :', error);
        res.status(500).json({ error: 'Erreur lors de la récupération des utilisateurs' });
    }
});


router.get('/:id', verifyToken, async (req, res) => {
  try {
    const userId = req.params.id;

    // Trouver l'utilisateur par ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    // Ajouter le préfixe au chemin de l'image si l'utilisateur a une image de profil
    if (user.profilePicture) {
      user.profilePicture = `http://localhost:5000/images/${user.profilePicture}`;
    }

    // Compter le nombre d'événements créés par l'utilisateur
    const eventCount = await Activity.countDocuments({ organizer: userId });

    // Trouver le profil de l'utilisateur
    const profile = await Profile.findOne({ user: userId });

    // Compter le nombre de followers et de followings
    const followerCount = profile ? profile.followers.length : 0;
    const followingCount = profile ? profile.following.length : 0;
    const username = profile ? profile.username : '';

    // Calculer le nombre de commentaires par événement pour l'utilisateur
// Récupérer tous les commentaires de l'utilisateur
const userComments = await Comment.find({ user: userId }).populate('activity');

// Créer un objet pour stocker le nombre de commentaires par événement
const commentCountPerEvent = {};

// Parcourir les commentaires pour les regrouper par événement
userComments.forEach(comment => {
    const activityId = comment.activity._id.toString(); // Convertir l'ID de l'activité en chaîne de caractères
    if (!commentCountPerEvent[activityId]) {
        commentCountPerEvent[activityId] = 1;
    } else {
        commentCountPerEvent[activityId]++;
    }
});

// Afficher l'ID de l'utilisateur pour vérification
console.log('ID de l\'utilisateur sans _id :', userId);

// Afficher les commentaires agrégés par événement
console.log('Commentaires par événement :', commentCountPerEvent);


    // Calculer le nombre de signalements par événement pour l'utilisateur
    const reportCountPerEvent = await Activity.aggregate([
      { $unwind: '$reported' },
      { $match: { 'reported.user': userId } },
      { $group: { _id: '$reported.activity', count: { $sum: 1 } } }
    ]);

    // Convertir l'_id en chaîne de caractères et inclure le reste des données de l'utilisateur
    const formattedUser = {
      id: user._id.toString(),
      ...user._doc,
      eventCount,
      followerCount,
      followingCount,
      username,
      commentCountPerEvent,
      reportCountPerEvent
    };

    res.json(formattedUser);
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'utilisateur :', error);
    res.status(500).json({ error: 'Erreur lors de la récupération de l\'utilisateur' });
  }
});


router.post('/', async (req, res) => {
    try {
      // Extraire les données de la requête
      const { firstName, lastName, email, password } = req.body;
  
      // Vérifier si l'utilisateur existe déjà
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ error: 'Cet utilisateur existe déjà' });
      }
  
      // Hasher le mot de passe
      const hashedPassword = await bcrypt.hash(password, 10);
  
      // Créer un nouvel utilisateur avec le rôle d'administrateur
      const newUser = new User({
        firstName,
        lastName,
        email,
        password: hashedPassword,
        role: 'admin',
      });
  
      // Sauvegarder le nouvel utilisateur dans la base de données
      await newUser.save();
  
      res.status(201).json(newUser);
    } catch (error) {
      console.error('Erreur lors de la création d\'un nouvel administrateur :', error);
      res.status(500).json({ error: 'Erreur lors de la création d\'un nouvel administrateur' });
    }
  });

  router.put('/:id', async (req, res) => {
    try {
        const userId = req.params.id;
        const { suspensionEndDate, reasonForSuspension } = req.body;

        // Vérifier si l'utilisateur existe
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'Utilisateur non trouvé' });
        }

        // Vérifier si la date de suspension est valide
        if (suspensionEndDate && new Date(suspensionEndDate) < new Date()) {
            return res.status(400).json({ error: 'La date de suspension doit être ultérieure à la date actuelle' });
        }

        // Mettre à jour les champs de suspension de l'utilisateur
        if (suspensionEndDate) {
            // Activer la suspension
            user.isSuspended = true;
            user.suspensionEndDate = suspensionEndDate;
            user.reasonForSuspension = reasonForSuspension;
        } else {
            // Désactiver la suspension
            user.isSuspended = false;
            user.suspensionEndDate = null;
            user.reasonForSuspension = null;
        }

        await user.save();

        res.status(200).json({ message: 'Compte utilisateur suspendu/désactivé avec succès' });
    } catch (error) {
        console.error('Erreur lors de la suspension/désactivation du compte utilisateur :', error);
        res.status(500).json({ error: 'Erreur lors de la suspension/désactivation du compte utilisateur' });
    }
});


// Route pour mettre à jour le profil de l'utilisateur
router.put('/profile', verifyToken, upload.single('profilePicture'), async (req, res) => {
  try {
      const userId = req.user; // L'ID de l'utilisateur est extrait du token vérifié
      
      // Recherche de l'utilisateur dans la base de données par son ID
      const user = await User.findById(userId);
      if (!user) {
          return res.status(404).json({ error: 'Utilisateur introuvable' });
      }
      
      let profilePicture = req.body.profilePicture || '';
      const hashedPassword = await bcrypt.hash(req.body.pawwsord, 10);

      // Mettre à jour les champs du profil de l'utilisateur avec les données fournies dans le corps de la requête
      user.firstName = req.body.firstName || user.firstName;
      user.lastName = req.body.lastName || user.lastName;
      user.password = hashedPassword || user.password;
      user.profilePicture = profilePicture || user.profilePicture;

      // Ajoutez d'autres champs de profil à mettre à jour selon vos besoins

      // Enregistrement des modifications dans la base de données
      await user.save();

      // Répondre avec un message de succès
      res.status(200).json({ message: 'Profil utilisateur mis à jour avec succès' });
  } catch (error) {
      console.error('Erreur lors de la mise à jour du profil utilisateur:', error);
      res.status(500).json({ error: 'Erreur lors de la mise à jour du profil utilisateur' });
  }
});

  router.delete('/:id', async (req, res) => {
    try {
        const userId = req.params.id;

        // Vérifier si l'utilisateur existe
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'Utilisateur non trouvé' });
        }

        // Bannir l'utilisateur en définissant le champ 'isBanned' sur true
        user.isBanned = true;
        await user.save();

        res.status(200).json({ message: 'L\'utilisateur a été banni avec succès' });
    } catch (error) {
        console.error('Erreur lors de la suppression et du bannissement de l\'utilisateur :', error);
        res.status(500).json({ error: 'Erreur lors de la suppression et du bannissement de l\'utilisateur' });
    }
});

module.exports = router;
