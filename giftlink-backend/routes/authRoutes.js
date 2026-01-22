const express = require('express');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const connectToDatabase = require('../models/db');
const logger = require('../logger');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;

/* ===========================
   REGISTER USER
=========================== */
router.post(
  '/register',
  [
    body('email').isEmail().withMessage('Invalid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('firstName').notEmpty().withMessage('First name is required'),
    body('lastName').notEmpty().withMessage('Last name is required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.error('Validation failed', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const db = await connectToDatabase();
      const collection = db.collection('users');

      const { email, password, firstName, lastName } = req.body;

      const existingUser = await collection.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ error: 'Email already exists' });
      }

      const salt = await bcryptjs.genSalt(10);
      const hashedPassword = await bcryptjs.hash(password, salt);

      const result = await collection.insertOne({
        email,
        firstName,
        lastName,
        password: hashedPassword,
        createdAt: new Date(),
      });

      const payload = {
        user: { id: result.insertedId.toString() },
      };

      const authtoken = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });

      logger.info('User registered successfully');
      res.status(201).json({ authtoken, email });
    } catch (error) {
      logger.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
);

/* ===========================
   LOGIN USER
=========================== */
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Invalid email'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.error('Validation failed', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const db = await connectToDatabase();
      const collection = db.collection('users');

      const { email, password } = req.body;

      const user = await collection.findOne({ email });
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const passwordMatch = await bcryptjs.compare(password, user.password);
      if (!passwordMatch) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const payload = {
        user: { id: user._id.toString() },
      };

      const authtoken = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });

      logger.info('User logged in successfully');
      res.status(200).json({
        authtoken,
        userName: user.firstName,
        userEmail: user.email,
      });
    } catch (error) {
      logger.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
);

/* ===========================
   UPDATE USER
=========================== */
router.put(
  '/update',
  [
    body('firstName').notEmpty().withMessage('First name is required'),
    body('lastName').notEmpty().withMessage('Last name is required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.error('Validation failed', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const email = req.headers.email;
    if (!email) {
      return res.status(400).json({ error: 'Email not found in headers' });
    }

    try {
      const db = await connectToDatabase();
      const collection = db.collection('users');

      const { firstName, lastName } = req.body;

      const result = await collection.findOneAndUpdate(
        { email },
        {
          $set: {
            firstName,
            lastName,
            updatedAt: new Date(),
          },
        },
        { returnDocument: 'after' }
      );

      if (!result.value) {
        return res.status(404).json({ error: 'User not found' });
      }

      const payload = {
        user: { id: result.value._id.toString() },
      };

      const authtoken = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });

      logger.info('User updated successfully');
      res.status(200).json({ authtoken });
    } catch (error) {
      logger.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
);

module.exports = router;
