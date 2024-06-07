// routes/dashboard.js

const express = require('express');
const router = express.Router();
const User = require('../../models/User');
const Activity = require('../../models/Activity');
const Contact = require('../../models/Contact');
const verifyToken = require('../../middleware/authMiddleware');
const Newsletter = require('../../models/Newsletter');
const Profile = require('../../models/Profile');
// Endpoint pour récupérer le nombre total d'utilisateurs
router.get('/total-users', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    res.json({ totalUsers });
  } catch (error) {
    console.error('Erreur lors de la récupération du nombre total d\'utilisateurs :', error);
    res.status(500).json({ message: 'Erreur lors de la récupération du nombre total d\'utilisateurs' });
  }
});

// Endpoint pour récupérer le nombre total d'événements
router.get('/total-events', async (req, res) => {
  try {
    const totalEvents = await Activity.countDocuments();
    res.json({ totalEvents });
  } catch (error) {
    console.error('Erreur lors de la récupération du nombre total d\'événements :', error);
    res.status(500).json({ message: 'Erreur lors de la récupération du nombre total d\'événements' });
  }
});

// Endpoint pour récupérer le nombre total de contacts
router.get('/total-contacts', async (req, res) => {
  try {
    const totalContacts = await Contact.countDocuments();
    res.json({ totalContacts });
  } catch (error) {
    console.error('Erreur lors de la récupération du nombre total de contacts :', error);
    res.status(500).json({ message: 'Erreur lors de la récupération du nombre total de contacts' });
  }
});

// Endpoint pour récupérer le nombre total de newsletters
router.get('/total-newsletters', async (req, res) => {
  try {
    const totalNewsletters = await Newsletter.countDocuments();
    res.json({ totalNewsletters });
  } catch (error) {
    console.error('Erreur lors de la récupération du nombre total de newsletters :', error);
    res.status(500).json({ message: 'Erreur lors de la récupération du nombre total de newsletters' });
  }
});


// Route pour obtenir le nombre d'événements par ville
router.get('/events-by-city', async (req, res) => {
  try {
    const eventCountByCity = await Activity.aggregate([
      {
        $group: {
          _id: '$city',
          eventCount: { $sum: 1 }
        }
      }
    ]);


    res.json(eventCountByCity);
  } catch (error) {
    console.error('Erreur lors de la récupération du nombre d\'événements par ville :', error);
    res.status(500).json({ message: 'Erreur lors de la récupération du nombre d\'événements par ville' });
  }
});

// Route pour obtenir le nombre d'utilisateurs par ville
router.get('/users-by-city', async (req, res) => {
  try {
    const userCountByCity = await Profile.aggregate([
        {
          $group: {
            _id: '$city',
            userCount: { $sum: 1 }
          }
        }
      ]);

    // Pour chaque ville, remplacer l'ID par le nom de la ville
 

    res.json(userCountByCity);
  } catch (error) {
    console.error('Erreur lors de la récupération du nombre d\'utilisateurs par ville :', error);
    res.status(500).json({ message: 'Erreur lors de la récupération du nombre d\'utilisateurs par ville' });
  }
});




// Route pour récupérer les statistiques sur les utilisateurs
router.get('/user-stats', async (req, res) => {
    try {
      // Nombre d'utilisateurs en ligne
      const onlineUsersCount = await User.countDocuments({ isLoggedIn: true });
  
      // Date d'il y a 24 heures
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      // Nombre d'utilisateurs connectés récemment
      const recentUsersCount = await User.countDocuments({ lastLogin: { $gt: oneDayAgo } });
  
      // Date d'il y a plus de 10 jours
      const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
      // Nombre d'utilisateurs inactifs depuis plus de 10 jours
      const inactiveUsersCount = await User.countDocuments({ isLoggedIn: false, lastLogin: { $lt: tenDaysAgo } });
  
      // Envoyer les statistiques en tant que réponse
      res.json({
        onlineUsersCount,
        recentUsersCount,
        inactiveUsersCount
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques des utilisateurs :', error);
      res.status(500).json({ message: 'Erreur lors de la récupération des statistiques des utilisateurs' });
    }
  });


  router.get('/user-stats-inactive', async (req, res) => {
    try {
      const currentDate = new Date();
  
      // Calculer le nombre d'utilisateurs suspendus mais dont la suspension est expirée
      const expiredSuspendedUserCount = await User.countDocuments({
        isSuspended: true,
        suspensionEndDate: { $lte: currentDate }
      });
  
      // Calculer le nombre d'utilisateurs suspendus dont la suspension est toujours en cours
      const activeSuspendedUserCount = await User.countDocuments({
        isSuspended: true,
        suspensionEndDate: { $gt: currentDate }
      });
  
      // Calculer le nombre d'utilisateurs bannis
      const bannedUserCount = await User.countDocuments({ isBanned: true });
  
      // Calculer le nombre d'utilisateurs inactifs (firstTime à true)
      const inactiveUserCount = await User.countDocuments({ firstTime: true });
  
      res.json({
        expiredSuspendedUserCount,
        activeSuspendedUserCount,
        bannedUserCount,
        inactiveUserCount,
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques des utilisateurs :', error);
      res.status(500).json({ message: 'Erreur lors de la récupération des statistiques des utilisateurs' });
    }
  });
  


  router.get('/user-event-stats', async (req, res) => {
    try {
      const userEventStats = await User.aggregate([
        {
          $lookup: {
            from: 'activities',
            localField: '_id',
            foreignField: 'organizer',
            as: 'events'
          }
        },
        {
          $project: {
            _id: 1,
            firstName: 1,
            lastName: 1,
            email: 1,
            eventCount: { $size: '$events' }
          }
        }
      ]);
  
      res.json(userEventStats);
    } catch (error) {
      console.error('Error fetching user event stats:', error);
      res.status(500).json({ message: 'Error fetching user event stats' });
    }
  });
  


  router.get('/user-comment-stats', async (req, res) => {
    try {
      const userCommentStats = await User.aggregate([
        {
          $lookup: {
            from: 'comments',
            localField: '_id',
            foreignField: 'user',
            as: 'comments'
          }
        },
        {
          $project: {
            _id: 1,
            firstName: 1,
            lastName: 1,
            email: 1,
            commentCount: { $size: '$comments' }
          }
        }
      ]);
  
      res.json(userCommentStats);
    } catch (error) {
      console.error('Error fetching user comment stats:', error);
      res.status(500).json({ message: 'Error fetching user comment stats' });
    }
  });

  


  router.get('/top-user-stats', async (req, res) => {
    try {
      const topUserStats = await User.aggregate([
        {
          $lookup: {
            from: 'activities',
            localField: '_id',
            foreignField: 'organizer',
            as: 'events'
          }
        },
        {
          $lookup: {
            from: 'comments',
            localField: '_id',
            foreignField: 'user',
            as: 'comments'
          }
        },
        {
          $project: {
            _id: 1,
            firstName: 1,
            lastName: 1,
            email: 1,
            eventCount: { $size: '$events' },
            commentCount: { $size: '$comments' }
          }
        },
        { $sort: { eventCount: -1, commentCount: -1 } },
        { $limit: 1 }
      ]);
  
      res.json(topUserStats);
    } catch (error) {
      console.error('Error fetching top user stats:', error);
      res.status(500).json({ message: 'Error fetching top user stats' });
    }
  });
  




  router.get('/profilePicture', verifyToken, async (req, res) => {
  try {
    // Récupérez l'identifiant de l'utilisateur à partir des informations stockées dans la requête
    const userId = req.user;

    // Recherchez l'utilisateur dans la base de données par son identifiant
    const user = await User.findById(userId);

    // Vérifiez si l'utilisateur existe et s'il a une photo de profil
    if (!user || !user.profilePicture) {
      return res.status(404).json({ message: 'Photo de profil non trouvée' });
    }

    // Renvoyez l'URL de la photo de profil de l'utilisateur
    res.json({ profilePicture: user.profilePicture });
  } catch (error) {
    console.error('Erreur lors de la récupération de la photo de profil de l\'utilisateur :', error);
    res.status(500).json({ message: 'Erreur lors de la récupération de la photo de profil de l\'utilisateur' });
  }
});
module.exports = router;
