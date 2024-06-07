// middleware/authMiddleware.js

const User = require('../models/User');
const jwt = require('jsonwebtoken')
const verifyToken = async (req, res, next) => {
      // Check if Authorization header is present
  if (!req.headers.authorization) {
    return res.status(401).json({ error: 'Authorization header missing' });
  }

  // Extract the token from the Authorization header
  const token = req.headers.authorization.split(' ')[1]; // Authorization: 'Bearer <token>'

  if (!token) {
    return res.status(401).json({ error: 'Token non fourni' });
  }
   
  
    try {
        const {_id} = await jwt.verify(token,process.env.SECRET)
      // Vérifier si le token correspond à un utilisateur dans la base de données
      const user = await User.findOne({ _id }).select('_id'); // Chercher l'utilisateur par le token
      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }
      // Si le token est valide, ajoutez l'utilisateur à la requête et passez au middleware suivant
      req.user = user;
      next();
    } catch (error) {
      console.error('Erreur de vérification du token :', error);
      res.status(500).json({ error: 'Erreur lors de la vérification du token' });
    }
  };
  

module.exports = verifyToken;
