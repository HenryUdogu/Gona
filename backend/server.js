const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const session = require('express-session'); 
const passport = require('passport');
require('./config/passport');
require('dotenv').config();

const authRoutes     = require('./routes/auth');
const farmRoutes     = require('./routes/farms');
const cropRoutes     = require('./routes/crops');
const employeeRoutes = require('./routes/employees');
const activityRoutes = require('./routes/activities');

const app = express();

app.use(cors({
  origin: [process.env.FRONTEND_URL, 'http://localhost:5173'],
  credentials: true
}));
app.use(express.json());

// ADD THIS BLOCK
app.use(session({
  secret: process.env.SESSION_SECRET || 'gona-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 10 * 60 * 1000, // 10 minutes
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    httpOnly: true
  }
}));
app.use(passport.initialize());
app.use(passport.session());

app.get('/', (req, res) => {
  res.json({ message: 'Gona API is running' });
});

app.use('/api/auth',       authRoutes);
app.use('/api/farms',      farmRoutes);
app.use('/api/crops',      cropRoutes);
app.use('/api/employees',  employeeRoutes);
app.use('/api/activities', activityRoutes);

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(process.env.PORT || 5000, () => {
      console.log('Server running on port 5000');
    });
  })
  .catch((err) => console.log(err));