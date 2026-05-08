import app from './app.js';
import sequelize from './config/database.js';
import './models/index.js';

const PORT = process.env.PORT || 3000;

sequelize.sync({ alter: true }) 
    .then(() => {
        console.log('Database connected and synced successfully.');
        app.listen(PORT, () => {
            console.log(`Server is running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
        });
    })
    .catch(err => {
        console.error('Failed to sync database:', err);
        process.exit(1);
    });