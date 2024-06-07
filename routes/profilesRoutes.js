

const express = require('express');
const router = express.Router();
const Profile = require('../models/Profile');
const User = require('../models/User');
const Notification = require('../models/Notification');
const Activity = require('../models/Activity');
const Comment = require('../models/Comment');
const verifyToken = require('../middleware/authMiddleware');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

// Middleware pour vérifier si l'ID de l'utilisateur existe



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
/*router.post('/', AuthMiddl, upload.array('additionalImages'), async (req, res) => {
  try {
    console.log('Début de la route POST /'); // Ajout d'un log pour indiquer le début de la route
    
    console.log('Données du formulaire :', req.body); // Affichage des données du formulaire

    // Récupérez les données du formulaire
  
    const CheckUsername = await User.findOne({ username: req.body.username });
    if (CheckUsername) {
      return res.status(400).json({ error: 'Vous devez choisir un autre Username' });
    }

const { bio, interests, profileType, city, birthDate, username } = req.body;
const user = req.user;
console.log('Données extraites du formulaire :', { bio, interests, profileType, city, birthDate, username, user }); // Affichage des données extraites du formulaire

    // Récupérez les noms des fichiers des images téléchargées
    const imageFiles = []; // Tableau pour stocker les noms de fichiers des images

    if (req.files && req.files.length) {
        for (let i = 0; i < req.files.length; i++) {
            const base64Data = req.files[i].buffer.toString('base64'); // Convertir en base64
            const imageType = req.files[i].mimetype.split('/')[1]; // Récupérer l'extension du type de contenu de l'image
            const fileName = `${Date.now() + i}.${imageType}`;
            const filePath = path.join('public/images', fileName); // Chemin de fichier où enregistrer l'image
    
            // Enregistrer l'image sur le serveur
            fs.writeFileSync(filePath, base64Data, 'base64');
    
            // Ajouter le nom du fichier à la liste des images
            imageFiles.push(fileName);
        }
    } else {
        // Gérer le cas où aucun fichier n'est téléchargé
        console.log('Aucun fichier téléchargé');
    }
    
    console.log('Noms de fichiers des images :', imageFiles); // Affichage des noms de fichiers des images

    // Créez le nouveau profil avec les données et les noms des images
    const newProfile = await Profile.create({
      bio,
      interests,
      profileType,
      city,
      birthDate,
      username,
      user,
      additionalImages: imageFiles // Stockez les noms des fichiers des images
    });

    console.log('Nouveau profil créé :', newProfile); // Affichage du nouveau profil créé
    
    // Mettez à jour le champ firstTime de l'utilisateur
    const updatedUser = await User.findById(user);
    if (updatedUser) {
      updatedUser.firstTime = false;
      await updatedUser.save();
    }

    console.log('Utilisateur mis à jour :', updatedUser); // Affichage de l'utilisateur mis à jour

    console.log('Fin de la route POST / avec succès'); // Ajout d'un log pour indiquer la fin de la route avec succès

    res.status(201).json(newProfile);
  } catch (error) {
    console.error('Erreur dans la route POST / :', error); // Affichage des erreurs rencontrées
    res.status(400).json({ message: error.message });
  }
});*/


router.post('/', verifyToken, upload.array('additionalImages'), async (req, res) => {
  try {
    console.log('Début de la route POST /');

    const { bio, interests, profileType, city, birthDate, username } = req.body;
    const user = req.user;

    // Vérifier si le nom d'utilisateur est déjà utilisé
    const existingProfile = await Profile.findOne({ username });
    if (existingProfile) {
      return res.status(400).json({ error: 'Le nom d\'utilisateur est déjà utilisé' });
    }

    // Traitement des images téléchargées
    const imageFiles = req.files.map(file => file.filename);

    // Créer un nouveau profil
    const newProfile = await Profile.create({
      bio,
      interests,
      profileType,
      city,
      birthDate,
      username,
      user,
      additionalImages: imageFiles
    });

    // Mettre à jour le champ firstTime de l'utilisateur
    const updatedUser = await User.findByIdAndUpdate(user, { firstTime: false }, { new: true });

    console.log('Fin de la route POST / avec succès');

    res.status(201).json(newProfile);
  } catch (error) {
    console.error('Erreur dans la route POST / :', error);
    res.status(400).json({ message: error.message });
  }
});

router.get('/getUserImages',verifyToken, async (req, res) => {
  try {
    // Trouver le profil de l'utilisateur actuellement authentifié
    const userProfile = await Profile.findOne({ user: req.user }).select('additionalImages');

    // Vérifier si le profil existe
    if (!userProfile) {
      return res.status(404).json({ message: 'Profil non trouvé' });
    }

    // Renvoyer les additionalImages du profil
    res.json(userProfile.additionalImages);
  } catch (error) {
    console.error('Erreur lors de la récupération des additionalImages :', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
  });

router.get('/:id', async (req, res) => {
    try {
      const profile = await Profile.findById(req.params.id);
      if (!profile) {
        return res.status(404).json({ message: 'Profil non trouvé' });
      }
      res.json(profile);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });


  
// Route pour mettre à jour le profil d'un utilisateur par son ID
router.put('/User', verifyToken, upload.single('profilePicture'), async (req, res) => {
  try {
    console.log('Données de la requête reçue:', req.body); // Afficher les données de la requête

    const { bio, profileType, city, birthDate, firstName, lastName } = req.body;
    let profilePicture = req.body.profilePicture || '';

    

    console.log('Données utilisées pour la mise à jour du profil :', { bio, profileType, city, birthDate, firstName, lastName, profilePicture });

    const updatedProfile = await Profile.findOneAndUpdate(
      { user: req.user }, // Utiliser findOneAndUpdate
      { $set: { bio, birthDate, city, profileType } },
      { new: true }
    );

    console.log('Profil mis à jour:', updatedProfile);

    let updateData = { $set: { firstName, lastName } };

  if (req.file) {
    updateData.$set.profilePicture = req.file.filename;
  }
  
    const user = await User.findOneAndUpdate(
      { _id: req.user },
      updateData,
      { new: true }
    );
    


    if (!updatedProfile || !user) {
      return res.status(404).json({ message: 'Profil non trouvé' });
    }

    console.log('Profil utilisateur mis à jour:', user);

    res.json(updatedProfile);
  } catch (error) {
    console.error('Erreur lors de la mise à jour du profil :', error);
    res.status(400).json({ message: error.message });
  }
});


router.put('/UserImages', verifyToken, upload.array('additionalImages', 5), async (req, res) => {
  try {
    // Récupérer les images existantes de la base de données
    const userProfile = await Profile.findOne({ user: req.user }).select('additionalImages');

    if (!userProfile) {
      return res.status(404).json({ message: 'Profil non trouvé' });
    }

    // Récupérer les noms de fichier des nouvelles images
    const newImages = req.files.map(file => file.filename);
    console.log('New images: ', newImages);

    // Récupérer les noms de fichier des images supprimées
    const removedImages = req.body.removedImages || [];
    console.log('Removed images: ', removedImages);

    // Combiner les images existantes, les nouvelles images et les images supprimées
    const updatedImages = userProfile.additionalImages
      .filter(image => !removedImages.includes(image)) // Retirer les images supprimées
      .concat(newImages); // Ajouter les nouvelles images

    console.log('Updated images: ', updatedImages);

    // Valider le nombre total d'images
    const totalImages = updatedImages.length;
    console.log('Total images: ', totalImages);
    if (totalImages < 2 || totalImages > 5) {
      return res.status(400).json({ message: 'Le nombre d\'images doit être compris entre 2 et 5.' });
    }

    // Mettre à jour les additionalImages dans la base de données
    const updatedProfile = await Profile.findOneAndUpdate(
      { user: req.user },
      { $set: { additionalImages: updatedImages } },
      { new: true }
    );

    console.log('AdditionalImages mis à jour:', updatedProfile.additionalImages);
    res.json(updatedProfile);
  } catch (error) {
    console.error('Erreur lors de la mise à jour des additionalImages :', error);
    res.status(400).json({ message: error.message });
  }
});




router.get('/' , verifyToken, async (req, res) => {
  console.log(req.user);
  try {
    // Trouver le profil de l'utilisateur actuellement authentifié
    const userProfile = await Profile.findOne({ user: req.user }).select('interests');

    // Vérifier si le profil existe
    if (!userProfile) {
      return res.status(404).json({ message: 'Profil non trouvé' });
    }

    // Renvoyer les intérêts de l'utilisateur
    res.json(userProfile.interests);
  } catch (error) {
    console.error('Erreur lors de la récupération des intérêts :', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});


router.get('/Friend/get', verifyToken, async (req, res) => {
  try {
      // Récupérer l'utilisateur à partir du jeton JWT vérifié
      const currentUser = req.user;

      // Rechercher le profil de l'utilisateur actuel avec les amis
      const userProfile = await Profile.findOne({ user: currentUser._id }).populate({
          path: 'friends.user',
          select: 'firstName lastName email profilePicture',
      });

      if (!userProfile) {
          return res.status(404).json({ message: "Profil de l'utilisateur introuvable." });
      }

      // Créer un objet pour stocker les amis uniques par leur ID
      const uniqueFriends = {};

      // Parcourir les amis de l'utilisateur pour ne garder que le dernier enregistrement
      userProfile.friends.forEach((friend) => {
          // Si l'ami existe déjà dans l'objet uniqueFriends
          if (uniqueFriends[friend.user._id]) {
              // Comparer les dates et garder le plus récent
              if (uniqueFriends[friend.user._id].date < friend.date) {
                  uniqueFriends[friend.user._id] = { ...friend.toObject() };
              }
          } else {
              // Si l'ami n'existe pas encore, l'ajouter à l'objet uniqueFriends
              uniqueFriends[friend.user._id] = { ...friend.toObject() };
          }
      });

      // Convertir l'objet uniqueFriends en tableau
      const uniqueFriendsArray = Object.values(uniqueFriends);

      // Récupérer le nom d'utilisateur (username) pour chaque ami
      await Promise.all(uniqueFriendsArray.map(async (friend) => {
          const friendProfile = await Profile.findOne({ user: friend.user._id }).select('username');
          friend.username = friendProfile.username;
      }));

      // Trier les amis par date (du plus récent au plus ancien)
      uniqueFriendsArray.sort((a, b) => b.date - a.date);

      // Répondre avec les amis uniques de l'utilisateur incluant les informations de l'utilisateur
      res.json(uniqueFriendsArray);
  } catch (error) {
      console.error("Erreur lors de la récupération des amis de l'utilisateur:", error);
      res.status(500).json({ message: "Une erreur est survenue lors de la récupération des amis de l'utilisateur." });
  }
});












router.put('/updateUserInterests', verifyToken, async (req, res) => {
  try {
    const { interests } = req.body; // Les nouveaux intérêts envoyés depuis le front-end

    // Trouver le profil de l'utilisateur actuellement authentifié
    const userProfile = await Profile.findOne({ user: req.user });

    // Vérifier si le profil existe
    if (!userProfile) {
      return res.status(404).json({ message: 'Profil non trouvé' });
    }

    // Mettre à jour les intérêts de l'utilisateur dans le profil
    userProfile.interests = interests;

    // Sauvegarder les modifications dans la base de données
    await userProfile.save();

    res.json({ message: 'Intérêts mis à jour avec succès' });
  } catch (error) {
    console.error('Erreur lors de la mise à jour des intérêts :', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});


  
// Route pour supprimer le profil d'un utilisateur par son ID
/*router.delete('/:id', checkUserExists, async (req, res) => {
  try {
    const deletedProfile = await Profile.findByIdAndDelete(req.params.id);
    if (!deletedProfile) {
      return res.status(404).json({ message: 'Profil non trouvé' });
    }
    res.json({ message: 'Profil supprimé avec succès' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/*
// Route pour ajouter un follower à un profil
router.post('/:id/followers', checkUserExists, async (req, res) => {
    try {
      const profile = await Profile.findById(req.params.id);
      if (!profile) {
        return res.status(404).json({ message: 'Profil non trouvé' });
      }
      // Ajouter le follower à la liste
      profile.followers.push(req.body.user);
      await profile.save();
      res.json(profile);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });
  
  // Route pour supprimer un follower d'un profil
  router.delete('/:id/followers/:followerId', checkUserExists, async (req, res) => {
    try {
      const profile = await Profile.findById(req.params.id);
      if (!profile) {
        return res.status(404).json({ message: 'Profil non trouvé' });
      }
      // Retirer le follower de la liste
      profile.followers = profile.followers.filter(follower => follower.toString() !== req.params.followerId);
      await profile.save();
      res.json(profile);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Route pour ajouter un profil à la liste de following d'un utilisateur
  router.post('/:id/following', checkUserExists, async (req, res) => {
    try {
      const profile = await Profile.findById(req.params.id);
      if (!profile) {
        return res.status(404).json({ message: 'Profil non trouvé' });
      }
      // Ajouter le profil à la liste de following
      profile.following.push(req.body.user);
      await profile.save();
      res.json(profile);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });
  
  // Route pour supprimer un profil de la liste de following d'un utilisateur
  router.delete('/:id/following/:followingId', checkUserExists, async (req, res) => {
    try {
      const profile = await Profile.findById(req.params.id);
      if (!profile) {
        return res.status(404).json({ message: 'Profil non trouvé' });
      }
      // Retirer le profil de la liste de following
      profile.following = profile.following.filter(following => following.toString() !== req.params.followingId);
      await profile.save();
      res.json(profile);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
*/


// Route pour ajouter un follower à un profil et mettre à jour la liste de following
/*router.put('/followers/:usernameFollower', verifyToken, async (req, res) => {
  try {
    console.log("Requête PUT reçue pour suivre un utilisateur.");
    
    // Récupérer l'ID de l'utilisateur actuel
    const userId = req.user;
    console.log("ID de l'utilisateur actuel:", userId);
    
    // Récupérer l'objet io pour les notifications en temps réel
    const io = req.io;
    console.log('Socket :', io);
    
    // Récupérer le nom d'utilisateur du follower à ajouter
    console.log("Nom d'utilisateur du follower:", req.params.usernameFollower);
    
    // Rechercher le follower dans la base de données
    const followerProfile = await Profile.findOne({ username: req.params.usernameFollower }).select('user profileType blockedUsers');
    console.log("Profil du follower trouvé:", followerProfile);
    
    // Vérifier si le follower a été trouvé
    if (!followerProfile) {
      console.log("Utilisateur introuvable.");
      throw Error("Utilisateur introuvable");
    }

    // Vérifier si l'utilisateur actuel est dans la blocklist du follower
    if (followerProfile.blockedUsers.includes(userId)) {
      console.log("Impossible d'ajouter le follower, l'utilisateur actuel est bloqué par le follower.");
      throw Error("Impossible d'ajouter le follower, l'utilisateur actuel est bloqué par le follower.");
    }

    // Vérifier si le follower est dans la blocklist de l'utilisateur actuel
    const currentUserProfile = await Profile.findOne({ user: userId }).select('blockedUsers');
    if (currentUserProfile.blockedUsers.includes(followerProfile.user)) {
      console.log("Impossible d'ajouter le follower, le follower est bloqué par l'utilisateur actuel.");
      throw Error("Impossible d'ajouter le follower, le follower est bloqué par l'utilisateur actuel.");
    }
    
  // Mettre à jour les relations d'amitié en fonction du type de profil du follower
if (followerProfile.profileType === 'public') {

          const existingFriendship = await Profile.findOne({
            user: userId,
            'friends.user': followerProfile.user
        });


        await Promise.all([
          Profile.findOneAndUpdate({ user: userId }, { $addToSet: { following: followerProfile.user } }, { new: true }),
          Profile.findOneAndUpdate({ user: followerProfile.user }, { $addToSet: { followers: userId } }, { new: true }),
          ]);


if (existingFriendship) {
    // Si une amitié existe déjà, mettre à jour le statut et la date
    await Promise.all([
        Profile.findOneAndUpdate(
            { user: userId, 'friends.user': followerProfile.user },
            { $set: { 'friends.$.status': 'O', 'friends.$.date': Date.now() } },
            { new: true }
        ),
        Profile.findOneAndUpdate(
            { user: followerProfile.user, 'friends.user': userId },
            { $set: { 'friends.$.status': 'O', 'friends.$.date': Date.now() } },
            { new: true }
        )
    ]);
}else {
  // Si aucune amitié n'existe, ajouter une nouvelle amitié
  
    await Promise(Profile.findOneAndUpdate(
          { user: followerProfile.user },
          { $addToSet: { friends: { user: userId, status: 'O', date: Date.now() } } },
          { new: true }
      )
    );
  
}
}
      else {
        // Mettre à jour seulement la liste des amis du follower en attente de confirmation
        await Profile.findOneAndUpdate(
            { user: followerProfile.user },
            { $addToSet: { friends: { user: userId, status: 'N', date: Date.now() } } },
            { new: true, upsert: true }
        );
      }

    // Envoyer une notification au follower
    console.log("Envoi d'une notification au follower.");
    const username = await Profile.findOne({ user: userId }).select('username');
    const notificationType = followerProfile.profileType === 'public' ? 'add_friends' : 'add_friends_private';
    const notification = new Notification({
      recipient: followerProfile.user,
      type: notificationType,
      content: `${username.username}`,
      date: new Date()
    });
    await notification.save();
    req.io.emit('newNotification', notification);

    // Répondre avec le profil mis à jour du follower
    res.json({ message: "Follower ajouté avec succès" });
  } catch (error) {
    console.log("Erreur lors du traitement de la requête PUT:", error.message);
    res.status(400).json({ message: error.message });
  }
});
*/


router.put('/followers/:usernameFollower', verifyToken, async (req, res) => {
  try {
    console.log("Requête PUT reçue pour suivre un utilisateur.");

    const userId = req.user;
    console.log("ID de l'utilisateur actuel:", userId);

    const io = req.io;
    console.log('Socket :', io);

    const { usernameFollower } = req.params;
    console.log("Nom d'utilisateur du follower:", usernameFollower);

    const followerProfile = await Profile.findOne({ username: usernameFollower }).select('user profileType blockedUsers');
    console.log("Profil du follower trouvé:", followerProfile);

    if (!followerProfile) {
      console.log("Utilisateur introuvable.");
      throw new Error("Utilisateur introuvable");
    }

    if (followerProfile.blockedUsers.includes(userId)) {
      console.log("Impossible d'ajouter le follower, l'utilisateur actuel est bloqué par le follower.");
      throw new Error("Impossible d'ajouter le follower, l'utilisateur actuel est bloqué par le follower.");
    }

    const currentUserProfile = await Profile.findOne({ user: userId }).select('blockedUsers');
    if (currentUserProfile.blockedUsers.includes(followerProfile.user)) {
      console.log("Impossible d'ajouter le follower, le follower est bloqué par l'utilisateur actuel.");
      throw new Error("Impossible d'ajouter le follower, le follower est bloqué par l'utilisateur actuel.");
    }

    if (followerProfile.profileType === 'public') {
      const existingFriendship = await Profile.findOne({ user: followerProfile.user, 'friends.user':userId  });

      const updateFollowing = Profile.findOneAndUpdate(
        { user: userId },
        { $addToSet: { following: followerProfile.user } },
        { new: true }
      );
      const updateFollower = Profile.findOneAndUpdate(
        { user: followerProfile.user },
        { $addToSet: { followers: userId } },
        { new: true }
      );

      if (existingFriendship) {
        await Promise.all([
          updateFollowing,
          updateFollower,
        /*  Profile.findOneAndUpdate(
            { user: userId, 'friends.user': followerProfile.user },
            { $set: { 'friends.$.status': 'O', 'friends.$.date': Date.now() } },
            { new: true }
          ),*/
          Profile.findOneAndUpdate(
            { user: followerProfile.user, 'friends.user': userId },
            { $set: { 'friends.$.status': 'O', 'friends.$.date': Date.now() , 'friends.$.vuByUser' :false } },
            { new: true }
          )
        ]);
      } else {

   
        await Promise.all([
          updateFollowing,
          updateFollower,
          Profile.findOneAndUpdate(
            { user: followerProfile.user },
            { $addToSet: { friends: { user: userId, status: 'O', date: Date.now() } } },
            { new: true }
          )
        ]);
      }
    } else {

      const existingFriendship = await Profile.findOne({ user: followerProfile.user, 'friends.user':userId  });
      console.log(followerProfile.user);
      console.log(userId);

      console.log(existingFriendship);
      if (existingFriendship){
        await Profile.findOneAndUpdate(
          { user: followerProfile.user, 'friends.user': userId  },
          { $set:  { 'friends.$.status': 'N', 'friends.$.date': Date.now() , 'friends.$.vuByUser' :false} },
          { new: true }
        );
        
      }else{
      await Profile.findOneAndUpdate(
        { user: followerProfile.user },
        { $addToSet: { friends: { user: userId, status: 'N', date: Date.now()   } } },
        { new: true, upsert: true }
      );
    }
    }

    console.log("Envoi d'une notification au follower.");
    const username = await Profile.findOne({ user: userId }).select('username');
    const notificationType = followerProfile.profileType === 'public' ? 'add_friends' : 'add_friends_private';
    const notification = new Notification({
      recipient: followerProfile.user,
      type: notificationType,
      content: `${username.username}`,
      date: new Date()
    });
    await notification.save();
    req.io.emit('newNotification', notification);

    res.json({ message: "Follower ajouté avec succès" });
  } catch (error) {
    console.log("Erreur lors du traitement de la requête PUT:", error.message);
    res.status(400).json({ message: error.message });
  }
});


  // Route pour retirer un follower d'un profil et mettre à jour la liste de following
  router.put('/followers/:usernameFollower/remove', verifyToken, async (req, res) => {
    try {
        const userId = req.user._id;
        const usernameFollower = req.params.usernameFollower;

        // Rechercher l'utilisateur actuel
        const user = await Profile.findOne({ user: userId });
        if (!user) {
            throw Error("Utilisateur introuvable");
        }

        // Rechercher le follower dans la base de données
        const follower = await Profile.findOne({ username: usernameFollower });
        if (!follower) {
            throw Error("Follower introuvable");
        }

        // Vérifier si l'utilisateur actuel bloque le follower
        if (user.blockedUsers.includes(follower.user)) {
            throw Error("Impossible de retirer le follower, l'utilisateur actuel bloque le follower");
        }

        // Vérifier si le follower bloque l'utilisateur actuel
        if (follower.blockedUsers.includes(userId)) {
            throw Error("Impossible de retirer le follower, le follower bloque l'utilisateur actuel");
        }

        // Retirer le follower de la liste de followers de l'utilisateur suivi
        user.following.pull(follower.user);
        await user.save();

        // Retirer l'utilisateur de la liste de followers du follower
        follower.followers.pull(userId);
        await follower.save();

        // Mettre à jour le statut de l'amitié dans les deux profils
        const existingFriendshipUser = user.friends.find(friend => friend.user.equals(follower.user));
      /*  if (existingFriendshipUser) {
            existingFriendshipUser.status = 'NF'; // Not Friend
            existingFriendshipUser.date = Date.now(); // Mise à jour de la date
        }*/

        const existingFriendshipFollower = follower.friends.find(friend => friend.user.equals(userId));
        if (existingFriendshipFollower) {
            existingFriendshipFollower.status = 'NF'; // Not Friend
            existingFriendshipFollower.date = Date.now(); // Mise à jour de la date
        }else {

          follower.friends.push({ user: userId, status: 'NF', date: new Date() }); // Confirmed

        }

        await user.save();
        await follower.save();

        res.json({ message: "Follower retiré avec succès" });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});


router.put('/followers/private/:userId', verifyToken, async (req, res) => {
  try {
    const myUserId = req.user._id;
    const targetUserId = req.params.userId;

    // Rechercher l'utilisateur actuel
    const user = await Profile.findOne({ user: myUserId });
    if (!user) {
      throw Error("Utilisateur introuvable");
    }

    // Rechercher l'utilisateur cible
    const targetUser = await Profile.findOne({ user: targetUserId });
    if (!targetUser) {
      throw Error("Utilisateur cible introuvable");
    }

    // Vérifier si l'utilisateur actuel est bloqué par l'utilisateur cible
    if (targetUser.blockedUsers.includes(myUserId)) {
      throw Error("Impossible d'accepter l'amitié, vous êtes bloqué par l'utilisateur cible.");
    }

    // Vérifier si l'utilisateur cible est bloqué par l'utilisateur actuel
    if (user.blockedUsers.includes(targetUserId)) {
      throw Error("Impossible d'accepter l'amitié, l'utilisateur cible est bloqué.");
    }

    // Rechercher l'ID du targetUserId dans la liste des amis de l'utilisateur actuel
    const existingFriendshipIndex = user.friends.findIndex(friend => friend.user.equals(targetUserId));

    // Si l'amitié existe
    if (existingFriendshipIndex !== -1) {
      // Si l'action est d'accepter l'amitié
      if (req.body.action === 'accept') {
        // Mettre à jour le statut et la date de l'amitié existante
        user.friends[existingFriendshipIndex].status = 'O'; // Confirmed
        user.friends[existingFriendshipIndex].date = new Date();
      } else if (req.body.action === 'delete') {
        // Si l'action est de supprimer l'amitié
        user.friends[existingFriendshipIndex].status = 'D'; // Deleted
      }
    } else {
      // Si l'amitié n'existe pas encore et que l'action est d'accepter l'amitié
      if (req.body.action === 'accept') {
        // Ajouter une nouvelle amitié
        user.friends.push({ user: targetUserId, status: 'O', date: new Date() }); // Confirmed
      }
    }

    // Mettre à jour les relations d'amitié en fonction de l'action 'accept'
    if (req.body.action === 'accept') {
      await Promise.all([
        Profile.findOneAndUpdate({ user: myUserId }, { $addToSet: { followers: targetUserId } }, { new: true }),
        Profile.findOneAndUpdate({ user: targetUserId }, { $addToSet: { following: myUserId } }, { new: true })
      ]);
    }

    // Sauvegarder les modifications
    await Promise.all([user.save(), targetUser.save()]);

    const notification = new Notification({
      recipient: targetUserId,
      type: 'add_friends_private-accepet',
      content: user.username,
      date: new Date()
    });
    await notification.save();

    // Émettre l'événement via socket pour informer l'organisateur de la nouvelle notification
    req.io.emit('newNotification', notification);


    
    res.json({ message: "Statut de l'amitié mis à jour avec succès" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});




router.put('/cancel/friendrequest/:username', verifyToken, async (req, res) => {
  try {
    // ID de l'utilisateur actuel
    const myUserId = req.user._id;

    // ID de l'autre utilisateur
    const otherUserId = req.params.username;

    // Rechercher le profil de l'autre utilisateur
    const otherUserProfile = await Profile.findOne({ username: otherUserId });
    if (!otherUserProfile) {
      throw new Error("Profil de l'autre utilisateur introuvable");
    }

    // Vérifier si l'utilisateur actuel a envoyé une demande d'ami à l'autre utilisateur
    const friendRequest = otherUserProfile.friends.find(friend => friend.user.equals(myUserId) && friend.status === 'N');
    if (!friendRequest) {
      throw new Error("Aucune demande d'ami en attente de cet utilisateur");
    }

    // Mettre à jour le statut de la demande d'ami en annulant la demande
    friendRequest.status = 'D'; // 'D' pour annulé

    // Enregistrer les modifications dans la base de données
    await otherUserProfile.save();

    res.json({ message: "Demande d'ami annulée avec succès" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});



// Route pour marquer la notification comme lue
router.put('/friends/:friendId/markAsRead', verifyToken, async (req, res) => {
  try {
    // Récupérer l'ID de la notification à marquer comme lue
    const friendId = req.params.friendId;
const myId = req.user;
    // Rechercher l'ami dans la base de données et le marquer comme vu
  // Rechercher l'ami dans la base de données et le marquer comme vu
const userProfile = await Profile.findOneAndUpdate(
  { 'friends._id' : friendId }, // Filtrer par votre ID utilisateur et l'ID de l'ami
  { $set: { 'friends.$.vuByUser': true } }, // Mettre à jour le champ vuByUser du friend correspondant
  { new: true }
);

if (!userProfile) {
  throw new Error("Impossible de trouver l'ami dans votre profil");
}
    res.json({ message: "Ami marqué comme lu avec succès" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});





  // Route pour supprimer le profil et l'utilisateur par son ID
router.delete('/:id', async (req, res) => {
    try {
      const deletedProfile = await Profile.findByIdAndUpdate(req.params.id);
      if (!deletedProfile) {
        return res.status(404).json({ message: 'Profil non trouvé' });
        
      }
  
      // Supprimer l'utilisateur de la liste de following des autres utilisateurs
      await Profile.updateMany(
        { followers: deletedProfile.user },
        { $pull: { followers: deletedProfile.user } }
      );
  
      // Supprimer l'utilisateur de la liste de followers des autres utilisateurs
      await Profile.updateMany(
        { following: deletedProfile.user },
        { $pull: { following: deletedProfile.user } }
      );

      await Profile.findByIdAndUpdate(req.params.id, { followers: [], following: [] });

  

      console.log('ID de l\'utilisateur à désactiver :', deletedProfile.user);

      // Modifier les informations de l'utilisateur dans le modèle User
      const updatedUser = await User.findByIdAndUpdate(
        deletedProfile.user,
        {
          firstName: 'utilisateur',
          lastName: 'declic',
          email: `utilisateur_declic_${Math.random().toString(36).substring(7)}@declic.com`,
          username: `declic_${Math.random().toString(36).substring(7)}`
        },
        { new: true }
      );
      if (!updatedUser) {
        return res.status(404).json({ message: 'Utilisateur non trouvé' });
      }
  
      // Mettre à jour la visibilité des commentaires de l'utilisateur à false
      await Comment.updateMany({ user: deletedProfile.user }, { visibility: false });
      const updatedEvents = await Activity.find({ organizer: deletedProfile.user });
    //  console.log('Updated Events:', updatedEvents); // Ajoutez cette ligne pour vérifier les événements récupérés

      // Mettre à jour la visibilité des activités de l'utilisateur
       await Activity.updateMany(
        { organizer: deletedProfile.user },
        { visibility: false }
      );
  
      // Créer les notifications pour les participants et les personnes en liste d'attente des événements
      /*const eventIds = updatedEvents.map(event => event._id);
      const eventParticipants = await Profile.find({ $or: [{ participants: { $in: eventIds } }, { waitingList: { $in: eventIds } }] });
      const notificationPromises = eventParticipants.map(async participant => {
        const eventNotifications = [];
        if (participant.participants && participant.participants.length > 0) {
          const participantsToNotify = participant.participants.filter(participantId => eventIds.includes(participantId));
          const participantNotifications = participantsToNotify.map(participantId => ({
            recipient: participantId,
            type: 'event_deleted',
            content: `L'événement auquel vous avez participé a été supprimé par l'utilisateur.`,
            date: new Date()
          }));
          eventNotifications.push(...participantNotifications);
        }
        if (participant.waitingList && participant.waitingList.length > 0) {
          const waitingListToNotify = participant.waitingList.filter(waitingId => eventIds.includes(waitingId));
          const waitingListNotifications = waitingListToNotify.map(waitingId => ({
            recipient: waitingId,
            type: 'event_deleted',
            content: `L'événement auquel vous étiez en liste d'attente a été supprimé par l'utilisateur.`,
            date: new Date()
          }));
          eventNotifications.push(...waitingListNotifications);
        }
        return Notification.insertMany(eventNotifications);
      });
      await Promise.all(notificationPromises);*/
      // Créer les notifications pour les participants et les personnes en liste d'attente des événements
      // Créer les notifications pour les participants et les personnes en liste d'attente des événements
     // Créer les notifications pour les participants et les personnes en liste d'attente des événements
     const currentDate = new Date();
     const participantIds = updatedEvents.flatMap(event => event.participants);
     const waitingListIds = updatedEvents.flatMap(event => event.waitingList);
     const userIds = [...participantIds, ...waitingListIds];
     const eventParticipants = await Profile.find({ user: { $in: userIds } });
     
     console.log('Event Participants:', eventParticipants);
     
     const notificationPromises = [];
     
     eventParticipants.forEach(async participant => {
         const eventNotifications = [];
     
         // Rechercher les événements auxquels l'utilisateur participe
         const participantEvents = updatedEvents.filter(event => {
             return event.participants.includes(participant.user) || event.waitingList.includes(participant.user);
         });
     
         participantEvents.forEach(event => {
             const eventDate = event.date;
             // Vérifier si la date de l'événement est future
             if (eventDate > currentDate) {
                 const notificationContent = `L'événement "${event.description}" auquel vous avez participé a été supprimé par l'utilisateur.`;
                 const notification = {
                     recipient: participant.user,
                     type: 'event_deleted',
                     content: notificationContent,
                     date: new Date()
                 };
                 eventNotifications.push(notification);
             }
         });
     
         if (eventNotifications.length > 0) {
             console.log(`Adding notifications for participant: ${participant.user}`);
             notificationPromises.push(Notification.insertMany(eventNotifications));
         }
     });
     
     try {
         console.log('Waiting for notification promises...');
         await Promise.all(notificationPromises);
         console.log('All notifications have been processed.');
     } catch (error) {
         console.error('Error inserting notifications:', error);
         throw error;
     }
     
      res.json({ message: 'Profil et utilisateur supprimés avec succès' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  


  router.get('/blocklistUser', async (req, res) => {
    res.json({message : 'hello'})
  });
  
  


 
  

module.exports = router;
