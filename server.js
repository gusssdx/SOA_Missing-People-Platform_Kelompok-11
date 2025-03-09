const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());

// Import routes
const userRoutes = require('./routes/users');
const missingPersonRoutes = require('./routes/missingPersons');
const reportRoutes = require('./routes/reports');
const foundPersonRoutes = require('./routes/foundPersons');
const claimRoutes = require('./routes/claims');
const notificationRoutes = require('./routes/notifications');

// Gunakan routes
app.use('/users', userRoutes);
app.use('/missing-persons', missingPersonRoutes);
app.use('/reports', reportRoutes);
app.use('/claims', claimRoutes);
app.use('/found-persons', foundPersonRoutes);
app.use('/notifications', notificationRoutes);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
