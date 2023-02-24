const { Sequelize } = require('sequelize');
const db = require('./db');
const UserConfig = db.define('userconfig', {
    id:{
        type: Sequelize.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    nick:{
        type: Sequelize.STRING(50),
        allowNull: false
    },
    email:{
        type: Sequelize.STRING,
        allowNull: false
    },
    senha:{
        type: Sequelize.STRING,
        allowNull: false
    },
    skin:{
        type: Sequelize.STRING(50),
        defaultValue: '0,0:0,0,0,0,0:0,0,0,0:0',
    },
    pontos:{
        type: Sequelize.STRING(5),
        defaultValue: '0',
    },
    plano:{
        type:   Sequelize.ENUM,
        values: ['N', 'S'],
        defaultValue: 'N',
    },
    stats:{
        type: Sequelize.STRING(20),
        defaultValue: '0',
    },
    endereco:{
        type: Sequelize.STRING(15),
    },
});
UserConfig.sync();
module.exports = UserConfig;