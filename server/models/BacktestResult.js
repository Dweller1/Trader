const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const BacktestResult = sequelize.define(
  'BacktestResult',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    strategy_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    ticker: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    date_from: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    date_to: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    initial_capital: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    total_return: {
      type: DataTypes.FLOAT,
    },
    sharpe_ratio: {
      type: DataTypes.FLOAT,
    },
    max_drawdown: {
      type: DataTypes.FLOAT,
    },
    win_rate: {
      type: DataTypes.FLOAT,
    },
    total_trades: {
      type: DataTypes.INTEGER,
    },
    equity_curve: {
      type: DataTypes.JSONB,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: 'backtest_results',
    timestamps: false,
  }
);

module.exports = BacktestResult;
