const express = require('express');
const router = express.Router();
const Contact = require('../../models/Contact');
const verifyToken = require('../../middleware/authMiddleware');
// GET all contacts
router.get('/', verifyToken, async (req, res) => {
    try {
        const { sort  } = req.query;
const { perPage } = req.query;

// Extraire les champs de tri et la direction
let sortField, sortOrder;
if (sort) {
    const [field, order] = JSON.parse(sort);
    sortField = field;
    sortOrder = order === 'DESC' ? 1 : -1;
} else {
    // Définir un tri par défaut si aucun paramètre de tri n'est fourni
    sortField = 'date';
    sortOrder = 1; // Tri ascendant par défaut
}


const totalCount = await Contact.countDocuments();

const defaultPageSize = 10;
const pageSize = perPage ? parseInt(perPage) : defaultPageSize;

const page = parseInt(req.query.page || 1); // Page actuelle
const startIndex = (page - 1) * pageSize; // Index de début
const endIndex = Math.min(startIndex + pageSize, totalCount); // Index de fin, en tenant compte du nombre total d'utilisateurs

const contacts = await Contact.find() // Appliquer le filtre de recherche
    .sort({ [sortField]: sortOrder }) // Appliquer le tri
    .skip(startIndex)
    .limit(pageSize);
       



        res.set('Content-Range', `contacts ${startIndex}-${endIndex}/${totalCount}`);
        res.json(contacts.map(contact => ({ id: contact._id.toString(), ...contact._doc })));
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.get('/:id', verifyToken, async (req, res) => {
    try {
        const contact = await Contact.findById(req.params.id);
        if (!contact) return res.status(404).json({ message: 'Contact not found' });
        res.json({ id: contact._id.toString(), ...contact._doc });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
