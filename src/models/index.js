import User from './User.js';
import RefreshToken from './RefreshToken.js';
import MeasurementHistory from './MeasurementHistory.js';

User.hasMany(RefreshToken, { foreignKey: 'userId', as: 'refreshTokens' });
RefreshToken.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(MeasurementHistory, { foreignKey: 'userId', as: 'measurementHistory' });
MeasurementHistory.belongsTo(User, { foreignKey: 'userId', as: 'user' });

export { User, RefreshToken, MeasurementHistory };