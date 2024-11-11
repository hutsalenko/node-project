const Sequelize = require('sequelize');
const sequelize = new Sequelize('node-complete', 'root', 'Alibaba1!', { dialect: 'mysql', host: 'localhost' });

module.exports = sequelize;
