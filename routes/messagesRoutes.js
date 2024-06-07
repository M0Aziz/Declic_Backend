const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const Notification = require('../models/Notification');
const Profile = require('../models/Profile');
const User = require('../models/User');
const multer = require('multer');

const verifyToken = require('../middleware/authMiddleware');



const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/images'); // Définissez le répertoire de destination des fichiers téléchargés
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname); // Définissez le nom de fichier pour le fichier téléchargé
  },
});

// Configuration de Multer avec filtrage de fichier personnalisé
const upload = multer({ storage: storage });


// Route pour envoyer un message
router.post('/', verifyToken, upload.single('image'), async (req, res) => {
  try {
    const sender = req.user;
    const content = req.body.content;
    const recipientId = await Profile.findOne({ username: req.body.username }).select('user');

    let newMessage;

    // Vérifiez s'il y a un fichier téléchargé
    if (req.file) {
      const fileType = req.file.fieldname === 'image' ? 'image' : 'voice';

      // Si un fichier a été téléchargé, il s'agit probablement d'une image ou d'un fichier vocal
      newMessage = await Message.create({
        sender: sender._id,
        recipient: recipientId.user,
        content: req.file.filename, // Enregistrez le chemin d'accès du fichier dans la base de données
        type: fileType,

        date: new Date(),
      });
    } else {


      console.log('sender',sender._id)
      console.log('recipientId.user',recipientId.user)

      // Sinon, c'est un message texte
      newMessage = await Message.create({
        sender: sender._id,
        recipient: recipientId.user,
        content: content,
        type: 'text',
        date: new Date(),
      });
    }

    // Envoyer une notification au destinataire
    const notificationContent = `Vous avez reçu un nouveau message de la part de ${sender._id}.`;
    const newNotification = new Notification({
      recipient: recipientId.user,
      type: 'new_message',
      content: notificationContent,
      date: new Date(),
    });
    await newNotification.save();
    req.io.emit('newMessage', newMessage);

    res.status(201).json(newMessage);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.post('/voice', verifyToken, upload.single('file'), async (req, res) => {
  try {
    const sender = req.user;
    const recipientId = await Profile.findOne({ username: req.body.username }).select('user');

    let newMessage;

    // Vérifiez s'il y a un fichier vocal téléchargé
    if (req.file) {
      // Créez un nouveau message vocal
      newMessage = await Message.create({
        sender: sender._id,
        recipient: recipientId.user,
        content: req.file.filename, // Enregistrez le chemin d'accès du fichier vocal dans la base de données
        type: 'voice', // Définissez le type de message comme vocal
        date: new Date(),
      });
    }

    // Envoyez une notification au destinataire
    const notificationContent = `Vous avez reçu un nouveau message vocal de la part de ${sender._id}.`;
    const newNotification = new Notification({
      recipient: recipientId.user,
      type: 'new_message',
      content: notificationContent,
      date: new Date(),
    });
    await newNotification.save();
    req.io.emit('newMessage', newMessage);

    res.status(201).json(newMessage);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});



/*router.get('/', verifyToken, async (req, res) => {
  try {
    const senderId = req.user;
// Récupérer les destinataires des messages envoyés par l'utilisateur actuel
const userMessagesSent = await Message.find({ sender: senderId }).distinct('recipient');
const userMessagesReceived = await Message.find({ recipient: senderId }).distinct('sender');
// Fusionner les deux tableaux
// Fusionner les deux tableaux tout en éliminant les doublons
// Fusionner les deux tableaux tout en éliminant les doublons
let userIds = [...userMessagesSent, ...userMessagesReceived];

// Supprimer les doublons en comparant les chaînes de caractères représentant les identifiants d'objet
userIds = userIds.filter((userId, index) => {
  const stringId = userId.toString();
  return userIds.findIndex(id => id.toString() === stringId) === index;
});




    const usersProfile = await Profile.find({ user: { $in: userIds } });
    const users = await User.find({ _id: { $in: userIds } });
    
    // Créer un objet pour stocker les détails des utilisateurs avec qui l'utilisateur actuel a échangé des messages
    const usersMap = new Map();
    users.forEach(user => {
      usersMap.set(user._id.toString(), { firstName: user.firstName, lastName: user.lastName, profilePicture: user.profilePicture, isLoggedIn : user.isLoggedIn , lastLogin : user.lastLogin  });
    });
    
    console.log('usersMap :',usersMap);
    // Ajouter les détails supplémentaires des profils à l'objet usersMap
    usersProfile.forEach(profile => {
      const userDetails = usersMap.get(profile.user.toString());
      if (userDetails) {
 
        userDetails.username = profile.username;
        // Ajoutez d'autres détails de profil au besoin
      }
    });
    
    // Créer un tableau d'objets contenant les détails des utilisateurs avec qui l'utilisateur actuel a échangé des messages
    const usersWithMessages = userIds.map(userId => {
      const userMapKey = userId.toString(); // Convertir l'ObjectId en chaîne de caractères
      return {
        id: userId,
        ...usersMap.get(userMapKey) // Utiliser la chaîne de caractères comme clé
      };
    });
    
console.log('usersWithMessages :',usersWithMessages);
    res.json(usersWithMessages);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});*/


/*
router.get('/', verifyToken, async (req, res) => {
  try {
    const senderId = req.user;

    // Récupérer les destinataires des messages envoyés par l'utilisateur actuel
    const userMessagesSent = await Message.find({ sender: senderId }).distinct('recipient');
    const userMessagesReceived = await Message.find({ recipient: senderId }).distinct('sender');

    // Fusionner les deux tableaux tout en éliminant les doublons
    let userIds = [...userMessagesSent, ...userMessagesReceived].filter((userId, index, array) => array.indexOf(userId) === index);

    // Récupérer les profils des utilisateurs
    const usersProfile = await Profile.find({ user: { $in: userIds } });
    const users = await User.find({ _id: { $in: userIds } });

    // Créer un objet pour stocker les détails des utilisateurs avec qui l'utilisateur actuel a échangé des messages
    const usersMap = new Map();
    users.forEach(user => {
      usersMap.set(user._id.toString(), { firstName: user.firstName, lastName: user.lastName, profilePicture: user.profilePicture, isLoggedIn: user.isLoggedIn, lastLogin: user.lastLogin, username: '' });
    });

    // Ajouter les détails supplémentaires des profils à l'objet usersMap
    usersProfile.forEach(profile => {
      const userDetails = usersMap.get(profile.user.toString());
      if (userDetails) {
        userDetails.username = profile.username;
      }
    });

    // Pour chaque utilisateur, rechercher le dernier message échangé avec cet utilisateur
    const usersWithMessages = await Promise.all(userIds.map(async userId => {
      const userMapKey = userId.toString();
      const lastMessage = await Message.findOne({
        $or: [
          { sender: senderId, recipient: userId },
          { sender: userId, recipient: senderId }
        ]
      }).sort({ date: -1 });

      return {
        id: userId,
        ...usersMap.get(userMapKey),
        lastMessage: lastMessage || null
      };
    }));

    console.log('usersWithMessages:', usersWithMessages);

    res.json(usersWithMessages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});*/

router.get('/', verifyToken, async (req, res) => {
  try {
    const senderId = req.user;

    // Récupérer les destinataires des messages envoyés par l'utilisateur actuel
    const userMessagesSent = await Message.find({ sender: senderId }).distinct('recipient');
    const userMessagesReceived = await Message.find({ recipient: senderId }).distinct('sender');

    // Fusionner les deux tableaux tout en éliminant les doublons
   
   
   // let userIds = [...userMessagesSent, ...userMessagesReceived].filter((userId, index, array) => array.indexOf(userId) === index);


    let userIds = [...userMessagesSent, ...userMessagesReceived];

    // Supprimer les doublons en comparant les chaînes de caractères représentant les identifiants d'objet
    userIds = userIds.filter((userId, index) => {
      const stringId = userId.toString();
      return userIds.findIndex(id => id.toString() === stringId) === index;
    });
    

    // Pour chaque utilisateur, rechercher le dernier message échangé avec cet utilisateur
    const usersWithMessages = await Promise.all(userIds.map(async userId => {
      let lastMessage = null;
      
      // Chercher le dernier message où l'utilisateur actuel est le destinataire ou l'expéditeur
      const sentMessage = await Message.findOne({ sender: senderId, recipient: userId }).sort({ date: -1 });
      const receivedMessage = await Message.findOne({ sender: userId, recipient: senderId }).sort({ date: -1 });

      // Sélectionner le dernier message parmi les deux
      if (sentMessage && (!receivedMessage || sentMessage.date > receivedMessage.date)) {
        lastMessage = sentMessage;
      } else if (receivedMessage) {
        lastMessage = receivedMessage;
      }

      if (lastMessage && lastMessage.sender.toString() === senderId.toString()) {
        lastMessage.vuByUser = true;
        await lastMessage.save();
      }

      const unreadCountForUser = await Message.countDocuments({
        recipient: senderId,
        sender: userId,
        vuByUser: false
      });
      // Récupérer les profils des utilisateurs
      const user = await User.findById(userId);
      const userProfile = await Profile.findOne({ user: userId });

      return {
        id: userId,
        firstName: user.firstName,
        lastName: user.lastName,
        profilePicture: user.profilePicture,
        isLoggedIn: user.isLoggedIn,
        lastLogin: user.lastLogin,
        username: userProfile.username,
        lastMessage: lastMessage,
        unreadCount: unreadCountForUser

      };
    }));


   /* const unreadCount = usersWithMessages.reduce((total, user) => {
      if (user.lastMessage && !user.lastMessage.vuByUser) {
        return total + 1;
      }
      return total;
    }, 0);

    console.log('Nombre de messages non lus:', unreadCount);
    //console.log('usersWithMessages:', usersWithMessages);*/

    res.json(usersWithMessages); 
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/navbarMessage', verifyToken, async (req, res) => {
  try {
    const senderId = req.user;

    // Récupérer les destinataires des messages envoyés par l'utilisateur actuel
    const userMessagesSent = await Message.find({ sender: senderId }).distinct('recipient');
    const userMessagesReceived = await Message.find({ recipient: senderId }).distinct('sender');

    let userIds = [...userMessagesSent, ...userMessagesReceived];

    // Supprimer les doublons en comparant les chaînes de caractères représentant les identifiants d'objet
    userIds = userIds.filter((userId, index) => {
      const stringId = userId.toString();
      return userIds.findIndex(id => id.toString() === stringId) === index;
    });

    // Limiter le nombre d'utilisateurs à cinq
    userIds = userIds.slice(0, 5);
    
    // Pour chaque utilisateur, rechercher le dernier message échangé avec cet utilisateur
    const usersWithMessages = await Promise.all(userIds.map(async userId => {
      let lastMessage = null;
      
      // Chercher le dernier message où l'utilisateur actuel est le destinataire ou l'expéditeur
      const sentMessage = await Message.findOne({ sender: senderId, recipient: userId }).sort({ date: -1 });
      const receivedMessage = await Message.findOne({ sender: userId, recipient: senderId }).sort({ date: -1 });

      // Sélectionner le dernier message parmi les deux
      if (sentMessage && (!receivedMessage || sentMessage.date > receivedMessage.date)) {
        lastMessage = sentMessage;
      } else if (receivedMessage) {
        lastMessage = receivedMessage;
      }

      if (lastMessage && lastMessage.sender.toString() === senderId.toString()) {
        lastMessage.vuByUser = true;
        await lastMessage.save();
      }

      const unreadCountForUser = await Message.countDocuments({
        recipient: senderId,
        sender: userId,
        vuByUser: false
      });
      // Récupérer les profils des utilisateurs
      const user = await User.findById(userId);
      const userProfile = await Profile.findOne({ user: userId });

      return {
        id: userId,
        firstName: user.firstName,
        lastName: user.lastName,
        profilePicture: user.profilePicture,
        isLoggedIn: user.isLoggedIn,
        lastLogin: user.lastLogin,
        username: userProfile.username,
        lastMessage: lastMessage,
        unreadCount: unreadCountForUser
      };
    }));

    res.json(usersWithMessages); 
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});




router.get('/:username', verifyToken , async (req, res) => {
  try {
    const senderId = req.user;

    recipientId = await Profile.findOne({ username : req.params.username }).select('user ');

   /* const areFriends = await checkIfFriends(senderId, recipientId.user);
    if (!areFriends) {
      return res.status(400).json({ message: 'Vous ne pouvez envoyer des messages qu\'aux utilisateurs que vous suivez mutuellement' });
    }*/
    // Récupérer les messages envoyés par l'utilisateur actuel à d'autres utilisateurs
    const userMessages = await Message.find({ sender: senderId }).sort({ date: -1 });
    // Créer un ensemble pour stocker les IDs uniques des destinataires des messages
    const uniqueUserIds = new Set();
    userMessages.forEach(message => {
      uniqueUserIds.add(message.recipient.toString());
    });
    // Convertir l'ensemble en un tableau d'IDs uniques
    const userIds = Array.from(uniqueUserIds);
    // Récupérer les profils des destinataires des messages
    const usersProfile = await Profile.find({ user: { $in: userIds } });
    const users = await User.find({ _id: { $in: userIds } });
    
    // Créer un objet pour stocker les détails des utilisateurs avec qui l'utilisateur actuel a échangé des messages
    const usersMap = new Map();
    users.forEach(user => {
      usersMap.set(user._id.toString(), { firstName: user.firstName, lastName: user.lastName, profilePicture: user.profilePicture, isLoggedIn : user.isLoggedIn , lastLogin : user.lastLogin  });
    });
    
    // Ajouter les détails supplémentaires des profils à l'objet usersMap
    usersProfile.forEach(profile => {
      const userDetails = usersMap.get(profile.user.toString());
      if (userDetails) {
 
        userDetails.username = profile.username;
        userDetails.followers = profile.followers;
        userDetails.following = profile.following;
        userDetails.blockedUsers = profile.blockedUsers;
        // Ajoutez d'autres détails de profil au besoin
      }
    });
    

    console.log(usersProfile,userDetails);
    // Créer un tableau d'objets contenant les détails des utilisateurs avec qui l'utilisateur actuel a échangé des messages
    const usersWithMessages = userIds.map(userId => ({
      id: userId,
      ...usersMap.get(userId)
    }));
    res.json(usersWithMessages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});



// Backend route to mark messages as read
router.put('/mark-as-read/:username', verifyToken , async (req, res) => {
  recipientId = await Profile.findOne({ username : req.params.username }).select('user');


  try {
    // Mettez à jour les messages dans la base de données pour marquer comme "vu"
    await Message.updateMany(
      { sender: recipientId.user, recipient: req.user._id, vuByUser: false },
      { $set: { vuByUser: true } }

    );

  /*  await Notification.updateMany(
      { type: 'new_message', recipient: req.user._id, vuByUser: false },
      { $set: { vuByUser: true } }
    );*/

    // Répondre avec un message de succès
    res.status(200).json({ success: true, message: 'Messages and notifications marked as read successfully' });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});


router.put('/mark', verifyToken, async (req, res) => {
  try {
    // Mettez à jour les notifications dans la base de données pour les marquer comme lues
    await Notification.updateMany(
      { type: 'new_message', recipient: req.user._id, vuByUser: false },
      { $set: { vuByUser: true } }
    );

    // Répondre avec un message de succès
    res.status(200).json({ success: true, message: 'Notifications marked as read successfully' });
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});



router.get('/:username/get', verifyToken , async (req, res) => {
  try {
    const senderId = req.user;
    const recipient = await Profile.findOne({ username: req.params.username }).select('user');

    // Vérifier d'abord s'il y a eu un échange de messages entre les utilisateurs
    const hasMessages = await checkIfMessagesExchanged(senderId, recipient.user);

    if (hasMessages) {

      await Message.updateMany({
        recipient: senderId,
        sender: recipient.user,
        vuByUser: false
      }, { vuByUser: true });

      // Compter les messages non lus
      const unreadCount = await Message.countDocuments({
        recipient: senderId,
        sender: recipient.user,
        vuByUser: false
      });
      // Si des messages ont été échangés, récupérer les messages
      const messages = await Message.find({
        $or: [
          { sender: senderId, recipient: recipient.user },
          { sender: recipient.user, recipient: senderId }
        ]
      }).sort({ date: 1 });


      //console.log(messages);
      return res.json({messages,unreadCount});
    }

  

    // Si aucun message n'a été échangé, vérifier s'ils sont amis
    const areFriends = await checkIfFriends(senderId, recipient.user);

    if (!areFriends) {
      return res.status(400).json({ message: 'Vous ne pouvez envoyer des messages qu\'aux utilisateurs que vous suivez mutuellement' });
    }

    // Si ils sont amis et n'ont pas échangé de messages, renvoyer un message approprié
    return res.status(400).json({ message: 'Vous n\'avez pas encore échangé de messages avec cet utilisateur.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


async function checkIfMessagesExchanged(userId1, userId2) {
  try {
    // Vérifier s'il y a des messages échangés entre les deux utilisateurs
    const messages = await Message.find({
      $or: [
        { sender: userId1, recipient: userId2 },
        { sender: userId2, recipient: userId1 }
      ]
    });

    return messages.length > 0; // Renvoyer true s'il y a des messages, sinon false
  } catch (error) {
    console.error('Erreur lors de la vérification des messages échangés :', error);
    return false; // En cas d'erreur, retourner false
  }
}

async function checkIfFriends(userId1, userId2) {
  try {
    // Récupérer les profils des deux utilisateurs
    const profile1 = await Profile.findOne({ user: userId1 });
    const profile2 = await Profile.findOne({ user: userId2 });
    console.log('userId1 1:', userId1);
    console.log('userId2 2:', userId2);
    const isBlocked1 = profile2.blockedUsers.includes(userId1._id);
    const isBlocked2 = profile1.blockedUsers.includes(userId2);

    if (isBlocked1 || isBlocked2) {
      return false; // Si l'un des utilisateurs est bloqué par l'autre, retourner false
    }
    const isFriend1 = profile1.followers.includes(userId2) && profile1.following.includes(userId2);
    console.log('Friend 1:', isFriend1);
const isFriend2 = profile2.followers.includes(userId1._id) && profile2.following.includes(userId1._id);
console.log('isFriend2 : ', isFriend2);

   

    // Vérifier si les deux utilisateurs se suivent mutuellement
    return isFriend1 && isFriend2;
  } catch (error) {
    console.error('Erreur lors de la vérification des amis :', error);
    return false; // En cas d'erreur, retourner false
  }
}


module.exports = checkIfFriends;


// Route pour signaler un message à l'administrateur
router.put('/report/:messageId', async (req, res) => {
  try {
    const { messageId } = req.params;

    // Trouver le message à signaler
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message non trouvé' });
    }

    // Incrémenter le nombre de signalements
    message.reported = (message.reported || 0) + 1;
    await message.save();

    // Envoyer une notification à l'administrateur
    const notificationContent = `Le message avec l'ID ${messageId} a été signalé par un utilisateur.`;
    const newNotification = new Notification({
      recipient: 'admin', // Utilisez l'ID de l'administrateur ici
      type: 'message_reported',
      content: notificationContent,
      date: new Date()
    });
    await newNotification.save();

    res.json({ message: 'Message signalé avec succès' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
