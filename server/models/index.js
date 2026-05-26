const User = require('./User');
const Strategy = require('./Strategy');
const BacktestResult = require('./BacktestResult');
const RefreshToken = require('./RefreshToken');

User.hasMany(Strategy, {
  foreignKey: 'user_id',
  onDelete: 'CASCADE',
  hooks: true,
});
Strategy.belongsTo(User, { foreignKey: 'user_id' });

Strategy.hasMany(BacktestResult, {
  foreignKey: 'strategy_id',
  onDelete: 'CASCADE',
  hooks: true,
});
BacktestResult.belongsTo(Strategy, { foreignKey: 'strategy_id' });

User.hasMany(RefreshToken, {
  foreignKey: 'user_id',
  onDelete: 'CASCADE',
  hooks: true,
});
RefreshToken.belongsTo(User, { foreignKey: 'user_id' });

module.exports = { User, Strategy, BacktestResult, RefreshToken };
