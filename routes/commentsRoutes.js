const express = require('express');
const router = express.Router();
const Comment = require('../models/Comment');
const Activity = require('../models/Activity');
const verifyToken = require('../middleware/authMiddleware');
const User = require('../models/User');
const Profile = require('../models/Profile');
const Notification = require('../models/Notification'); 
// Route pour poster un commentaire sur une activité
router.post('/:activityId/comment',verifyToken, async (req, res) => {
  try {
    const { activityId } = req.params;
    const { content}  = req.body;
const user = req.user._id;
const io = req.io;
    // Vérifier si l'activité est visible
    const activity = await Activity.findById(activityId);
    if (!activity) {
      return res.status(404).json({ message: 'Activité non trouvée' });
    }
    if (!activity.visibility) {
      return res.status(403).json({ message: 'L\'activité n\'est pas visible' });
    }
    console.log(activity.participants.includes(user))

    if (activity.organizer.toString() !== user.toString() && !activity.participants.includes(user)) {
      return res.status(403).json({ message: 'Vous devez être inscrit à l\'activité pour poster un commentaire' });
    }
    const isOrganizer = user.equals(activity.organizer);

    if (isOrganizer) {
      // Vérifier s'il existe déjà des commentaires
      const existingComments = await Comment.find({ activity: activityId });
      if (existingComments.length === 0) {
        return res.status(403).json({ message: 'L\'organisateur ne peut pas commenter tant qu\'il n\'y a pas de commentaires.' });
      }
    }
    // Créer le commentaire
    const newComment = await Comment.create({ user, activity: activityId, content, date: new Date() });

    if (!isOrganizer) {
      // Traiter les notifications pour l'organisateur
      let notification = await Notification.findOne({ recipient: activity.organizer, type: 'new-commentaire', content: activityId });

      if (notification) {
        // Mettre à jour la date et l'état de la notification existante
        notification.date = new Date();
        notification.vu = false;
        notification.vuByUser = false;
        await notification.save();
      } else {
        // Créer une nouvelle notification
        notification = new Notification({
          recipient: activity.organizer,
          type: 'new-commentaire',
          content: activityId,
          date: new Date()
        });
        await notification.save();
      }
      io.emit('newNotification', notification);
    }
    const commenters = await Comment.find({ activity: activityId }).distinct('user');
    for (const commenterId of commenters) {
      if (!commenterId.equals(activity.organizer) && !commenterId.equals(user)) {
        let notification = await Notification.findOne({ recipient: commenterId, type: 'new-commentaire', content: activityId });

        if (notification) {
          // Mettre à jour la date et l'état de la notification existante
          notification.date = new Date();
          notification.vu = false;
          notification.vuByUser = false;
          await notification.save();
        } else {
          // Créer une nouvelle notification
          notification = new Notification({
            recipient: commenterId,
            type: 'new-commentaire',
            content: activityId,
            date: new Date()
          });
          await notification.save();
        }

        // Émettre l'événement via socket pour informer le commentateur de la nouvelle notification
        io.emit('newNotification', notification);
      }
    }

    res.status(201).json(newComment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Route pour récupérer les commentaires d'une activité
router.get('/:activityId/comments', async (req, res) => {
  try {
    const { activityId } = req.params;
    const page = req.query.page || 1; // Récupérer le numéro de la page depuis la requête ou utiliser la première page par défaut
    const limit = 10; // Nombre de commentaires par page

    // Vérifier si l'activité est visible
    const activity = await Activity.findById(activityId);
    if (!activity) {
      return res.status(404).json({ message: 'Activité non trouvée' });
    }
    if (!activity.visibility) {
      return res.status(403).json({ message: 'L\'activité n\'est pas visible' });
    }

    // Calculer l'index de départ pour la pagination
    const startIndex = (page - 1) * limit;
    const commentsQuery = Comment.find({ activity: activityId });

    // Récupérer le nombre total de commentaires
    const totalComments = await Comment.countDocuments({ activity: activityId });
    const comments = await Comment.find({ activity: activityId })
    .populate('user', 'firstName lastName profilePicture') // Inclure seulement le champ user
    .sort({ date: 1 }) // Trier par ordre décroissant pour les commentaires les plus récents en premier
    .skip(startIndex) // Ignorer les commentaires précédents
    .limit(limit); // Limiter le nombre de commentaires par page

// Parcourir les commentaires et ajouter les informations du profil utilisateur
for (let comment of comments) {
    if (comment.user) {
        const profile = await Profile.findOne({ user: comment.user._id }).select('username');
        if (profile) {
          console.log('profile',profile);

            comment.user.username = profile.username;
        }
    }
}

res.json({ comments, totalComments }); // Retourner à la fois les commentaires et le nombre total de commentaires



  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


router.get('/:commentId', async (req, res) => {
  try {
    const { commentId } = req.params;
    
    // Requête pour trouver le commentaire par son ID
    const comment = await Comment.findById(commentId).populate('user', 'firstName lastName profilePicture');
    
    if (!comment) {
      return res.status(404).json({ message: 'Commentaire non trouvé' });
    }

    // Retourner le commentaire avec les détails de l'utilisateur associés
    res.status(200).json(comment);
  } catch (error) {
    console.error('Une erreur s\'est produite lors de la récupération du commentaire :', error);
    res.status(500).json({ message: 'Une erreur s\'est produite lors de la récupération du commentaire' });
  }
});

module.exports = router;
