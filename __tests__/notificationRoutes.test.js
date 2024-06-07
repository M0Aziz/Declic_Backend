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


    describe('GET /notifications/', () => {
        it('should retrieve notifications for the current user', async () => {
          const token = 'dummyToken';
          const userId = 'dummyUserId';
          
          // Mocking the JWT token verification
          jwt.verify.mockReturnValue({ _id: userId });
          
          // Making a mock request object with headers containing the token
          const req = {
            headers: {
              authorization: `Bearer ${token}`
            }
          };
    
          // Mocking the response object
          const res = {};
          res.status = jest.fn().mockReturnValue(res);
          res.json = jest.fn();
    
          // Mocking the User.findOne function to resolve with a user
          User.findOne.mockResolvedValue({ _id: userId });
    
          // Calling the verifyToken middleware function with the mock request, response, and next
          await verifyToken(req, res, () => {});
    
          // Expecting that the req.user property has been set with the user ID
          expect(req.user).toBe(userId);
        });
      });

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
