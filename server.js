const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const authRoutes = require('./routes/auth');
const app = express();
const PORT = process.env.PORT || 5000;
const path = require('path')

require('dotenv').config();


// Import routes
const userRoutes = require('./routes/users');
const missingPersonRoutes = require('./routes/missingPersons');
const reportRoutes = require('./routes/reports');
const foundPersonRoutes = require('./routes/foundPersons');
const claimRoutes = require('./routes/claims');
const notificationRoutes = require('./routes/notifications');
const passport = require('passport');

// Gunakan routes
app.use(cors());
app.use(passport.initialize());
app.use(express.json());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "frontend")));
app.use('/auth', authRoutes);
app.use(express.urlencoded({ extended: true }));

app.use('/users', userRoutes);
app.use('/missing-persons', missingPersonRoutes);
app.use('/reports', reportRoutes);
app.use('/claims', claimRoutes);
app.use('/found-persons', foundPersonRoutes);
app.use('/notifications', notificationRoutes);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
