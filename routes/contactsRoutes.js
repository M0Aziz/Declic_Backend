const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');

// Définir le schéma de données pour le formulaire de contact
const ContactSchema = require('../models/Contact');

// Route POST pour soumettre le formulaire de contact
router.post('/', async (req, res) => {
  try {
    const { firstName, lastName, email, subject, message } = req.body;

    // Créer une nouvelle entrée dans la base de données
    const newContact = new ContactSchema({
      firstName,
      lastName,
      email,
      subject,
      message
    });

    // Sauvegarder le message dans la base de données
    await newContact.save();

    // Configurer le service de messagerie
    let transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'spprtgemi@gmail.com',
        pass: 'nfefgwvycewlayzo'
      }
    });

    const logoUrl = 'https://i.postimg.cc/62K82Z6D/Logo.png';
    const facebookIconUrl = 'https://i.postimg.cc/gw8w2spV/facebook-icon.png';
    const tiktokIconUrl = 'https://i.postimg.cc/2bxV45V3/tiktok-icon.png';
    const instagramIconUrl = 'https://i.postimg.cc/gj0FdJKJ/instagram-icon.webp';
    
    let mailOptions = {
      from: 'spprtgemi@gmail.com',
      to: email,
      subject: 'Message reçu avec succès',
      html: `
        <div style="font-family: Arial, sans-serif; color: #333;">
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="${logoUrl}" alt="Logo" style="width: 100px; height: auto;" />
          </div>
          <h2 style="text-align: center; color: #4CAF50;">Message reçu avec succès</h2>
          <p>Bonjour ${firstName} ${lastName},</p>
          <p>Nous vous remercions pour votre message. Votre demande a été reçue avec succès. Nous reviendrons vers vous dans les plus brefs délais.</p>
          <p>Voici un récapitulatif des informations que vous nous avez envoyées :</p>
          <ul style="list-style: none; padding: 0;">
            <li><strong>Prénom:</strong> ${firstName}</li>
            <li><strong>Nom:</strong> ${lastName}</li>
            <li><strong>Email:</strong> ${email}</li>
            <li><strong>Sujet:</strong> ${subject}</li>
            <li><strong>Message:</strong> ${message}</li>
          </ul>
          <p>Si vous avez des questions supplémentaires ou des préoccupations, n'hésitez pas à nous contacter à cette adresse email.</p>
          <p>Cordialement,</p>
          <p><strong>Équipe Déclic</strong></p>
          <div style="text-align: center; margin-top: 20px;">
            <a href="https://facebook.com" style="margin: 0 10px;">
              <img src="${facebookIconUrl}" alt="Facebook" style="width: 30px; height: auto;" />
            </a>
            <a href="https://tiktok.com" style="margin: 0 10px;">
              <img src="${tiktokIconUrl}" alt="TikTok" style="width: 30px; height: auto;" />
            </a>
            <a href="https://instagram.com" style="margin: 0 10px;">
              <img src="${instagramIconUrl}" alt="Instagram" style="width: 30px; height: auto;" />
            </a>
          </div>
          <div style="text-align: center; color: #aaa; margin-top: 20px; font-size: 12px;">
            <p>Vous recevez ce message parce que vous avez contacté Équipe Déclic. Si vous pensez que c'est une erreur, veuillez nous en informer immédiatement.</p>
            <p>&copy; ${new Date().getFullYear()} Équipe Déclic. Tous droits réservés.</p>
          </div>
        </div>
      `
    };
    // Envoyer le mail
    await transporter.sendMail(mailOptions);

    res.status(200).send('Message envoyé avec succès');
  } catch (error) {
    console.error(error);
    res.status(500).send('Une erreur s\'est produite lors de l\'envoi du message.');
  }
});

module.exports = router;
