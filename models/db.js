const { Sequelize } = require('sequelize');
const sequelize = new Sequelize('edukecx2', 'root', '', {
  host: 'localhost',
  port: '3306',
  dialect: 'mysql',
  dialectModule: require('mysql2'),
});
sequelize.authenticate()
.then(()=>{
  console.log("autenticado");
}).catch(()=>{
  console.log("erro");
});
module.exports = sequelize;