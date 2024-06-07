const request = require('supertest');
const express = require('express');
const notificationRoutes = require('../routes/notificationsRoutes');
const Notification = require('../models/Notification');
const jwt = require('jsonwebtoken');
jest.mock('jsonwebtoken');
jest.mock('../models/Notification');

const verifyToken  = require('../middleware/authMiddleware');

  

const app = express();
app.use(express.json());
app.use('/notifications', notificationRoutes);

const User = require('../models/User');
jest.mock('../models/User');


// Avant vos tests
beforeAll(() => {
  User.findOne = jest.fn().mockResolvedValue({ _id: 'userId' });
});

describe('Notification Routes', () => {



  describe('PUT /notifications/:notificationId/markAsRead/', () => {
    it('should mark a notification as read', async () => {
      Notification.findByIdAndUpdate.mockResolvedValue({ vuByUser: true });

      const response = await request(app)
        .put('/notifications/dummyNotificationId/markAsRead/')
        .send();

      expect(response.statusCode).toBe(200);
      expect(response.body.message).toBe('Notification marquée comme lue avec succès.');
    });
  });


});
