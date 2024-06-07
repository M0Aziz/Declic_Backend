const express = require('express');
const router = express.Router();
const Newsletter = require('../models/Newsletter');

router.post('/newsletter', async (req, res) => {
  try {
    const { email } = req.body;

    const existingSubscriber = await Newsletter.findOne({ email });

    if (existingSubscriber) {
      return res.status(400).json({ message: "Cet e-mail est déjà inscrit à la newsletter." });
    }

    const newSubscriber = new Newsletter({ email });
    await newSubscriber.save();

    return res.status(201).json({ message: "Inscription à la newsletter réussie !" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Une erreur s'est produite lors de l'inscription à la newsletter." });
  }
});

module.exports = router;
