import User from './User.js';
import RefreshToken from './RefreshToken.js';
import MeasurementHistory from './MeasurementHistory.js';
import FavoriteConversion from './FavoriteConversion.js';

User.hasMany(RefreshToken, { foreignKey: 'userId', as: 'refreshTokens' });
RefreshToken.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(MeasurementHistory, { foreignKey: 'userId', as: 'measurementHistory' });
MeasurementHistory.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(FavoriteConversion, { foreignKey: 'userId', as: 'favoriteConversions' });
FavoriteConversion.belongsTo(User, { foreignKey: 'userId', as: 'user' });

export { User, RefreshToken, MeasurementHistory, FavoriteConversion };