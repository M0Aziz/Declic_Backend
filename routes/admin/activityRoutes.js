const express = require('express');
const router = express.Router();
const Activity = require('../../models/Activity');
const verifyToken = require('../../middleware/authMiddleware');

// GET all activities
// GET all activities
router.get('/', async (req, res) => {
    try {
        // Récupérer les paramètres de tri de la requête
        const { sort,filter } = req.query;
        
        // Extraire les champs de tri et la direction
        let sortField, sortOrder;
        if (sort) {
            const [field, order] = JSON.parse(sort);
            sortField = field;
            sortOrder = order === 'ASC' ? 1 : -1;
        } else {
            // Définir un tri par défaut si aucun paramètre de tri n'est fourni
            sortField = 'dateStart';
            sortOrder = 1; // Tri ascendant par défaut
        }



        const searchOptions = {};

// Vérifier si un filtre est spécifié dans la requête
// Vérifier si un filtre est spécifié dans la requête
if (filter) {
  // Décoder le filtre JSON de la requête
  const decodedFilter = JSON.parse(decodeURIComponent(filter));
  // Modifier le filtre pour rechercher les noms de famille qui contiennent la sous-chaîne spécifiée
  if (decodedFilter.name) {
      searchOptions.name = { $regex: new RegExp(decodedFilter.name, 'i') };
  }
}
        // Récupérer les activités paginées avec tri
        const pageSize = parseInt(req.query.perPage || 10); // Nombre d'activités par page
        const page = parseInt(req.query.page || 1); // Page actuelle
        const startIndex = (page - 1) * pageSize; // Index de début
        const endIndex = page * pageSize; // Index de fin

        const activities = await Activity.find(searchOptions)
            .populate('organizer', 'firstName lastName')
            .sort({ [sortField]: sortOrder }) // Appliquer le tri
            .skip(startIndex)
            .limit(pageSize);


          

            activities.forEach(activitie => {

              if (activitie.image){

                activitie.image = `http://localhost:5000/images/${activitie.image}`;
              }

            });
        // Nombre total d'activités dans la base de données
        const totalCount = await Activity.countDocuments();
        res.set('Content-Range', `items ${startIndex}-${endIndex}/${totalCount}`);

        // Renvoyer les activités paginées avec _id inclus
        res.json(activities.map(activity => ({
            id: activity._id.toString(), // Convertir l'_id en chaîne de caractères
            ...activity._doc // Inclure le reste des données de l'activité
        })));
    } catch (error) {
        console.error('Erreur lors de la récupération des activités:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération des activités' });
    }
});

// Route pour obtenir une activité par son ID
// Route pour obtenir une activité par son ID
router.get('/:id', async (req, res) => {
  try {
      const activity = await Activity.findById(req.params.id).populate('organizer', 'firstName lastName email profilePicture ');
      if (!activity) {
          return res.status(404).json({ error: 'Activité non trouvée' });
      }
 
      // Ajouter le préfixe au chemin de l'image
      activity.image = `http://localhost:5000/images/${activity.image}`;
activity.organizer.profilePicture = `http://localhost:5000/images/${activity.organizer.profilePicture}`;
      // Convertir l'_id en chaîne de caractères et inclure le reste des données de l'activité
      const formattedActivity = {
          id: activity._id.toString(),
          ...activity._doc
      };
      res.json(formattedActivity);
  } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Erreur lors de la récupération des données de l\'activité' });
  }
});


  
// PUT update activity visibility
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { visibility } = req.body;
    const activity = await Activity.findByIdAndUpdate(req.params.id, { visibility }, { new: true });
    const formattedActivity = {
        id: activity._id.toString(),
        ...activity._doc
    };
    res.json(formattedActivity);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la mise à jour de la visibilité' });
  }
});


// PUT update report status
router.put('/:activityId/reports/:reportId', verifyToken, async (req, res) => {
  try {
    const { status } = req.body;
    const { activityId, reportId } = req.params;

    const activity = await Activity.findById(activityId);
    if (!activity) {
      return res.status(404).json({ error: 'Activité non trouvée' });
    }

    const reportIndex = activity.reported.findIndex(report => report._id.toString() === reportId);
    if (reportIndex === -1) {
      return res.status(404).json({ error: 'Signalement non trouvé dans l\'activité' });
    }

    activity.reported[reportIndex].status = status;
    await activity.save();

    res.json({ message: 'Statut du signalement mis à jour avec succès' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la mise à jour du statut du signalement' });
  }
});




router.delete('/:id', async (req, res) => {
    try {
      const activity = await Activity.findByIdAndUpdate(req.params.id, { visibility: false }, { new: true });
      res.json(activity);
    } catch (error) {
      res.status(500).json({ error: 'Erreur lors de la suppression de l\'activité' });
    }
  });
module.exports = router;
