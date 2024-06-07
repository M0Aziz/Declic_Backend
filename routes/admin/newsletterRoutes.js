const express = require('express');
const router = express.Router();
const Newsletter = require('../../models/Newsletter');
const verifyToken = require('../../middleware/authMiddleware');
// GET all newsletter entries
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
        
        
        const totalCount = await Newsletter.countDocuments();
        
        const defaultPageSize = 10;
        const pageSize = perPage ? parseInt(perPage) : defaultPageSize;
        
        const page = parseInt(req.query.page || 1); // Page actuelle
        const startIndex = (page - 1) * pageSize; // Index de début
        const endIndex = Math.min(startIndex + pageSize, totalCount); // Index de fin, en tenant compte du nombre total d'utilisateurs
        
        const newsletters = await Newsletter.find() // Appliquer le filtre de recherche
            .sort({ [sortField]: sortOrder }) // Appliquer le tri
            .skip(startIndex)
            .limit(pageSize);
               

      

        res.set('Content-Range', `newsletters ${startIndex}-${endIndex}/${totalCount}`);
        res.json(newsletters.map(newsletter => ({ id: newsletter._id.toString(), ...newsletter._doc })));
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.get('/:id', verifyToken, async (req, res) => {
    try {
        const newsletter = await Newsletter.findById(req.params.id);
        if (!newsletter) return res.status(404).json({ message: 'Newsletter entry not found' });
        res.json({ id: newsletter._id.toString(), ...newsletter._doc });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
