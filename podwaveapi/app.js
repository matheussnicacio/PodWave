/*
var express = require('express');
var logger = require('morgan');
var cors = require('cors');
require('dotenv').config();

var indexRouter = require('./routes/index');

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));

app.use('/api', indexRouter);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Rota não encontrada.',
    errors: []
  });
});

module.exports = app;
*/

var express = require('express');
var logger = require('morgan');
var cors = require('cors');
var path = require('path');
require('dotenv').config();

var indexRouter = require('./routes/index');
var searchRoutes = require('./modules/search/searchRoutes');
var userRoutes = require('./modules/user/userRoutes');
var episodeRoutes = require('./modules/episode/episodeRoutes');
var errorHandler = require('./middlewares/errorHandler');

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));

// Serve a pasta de uploads publicamente, em /uploads/... . Precisa vir
// antes das rotas da API para não competir com nenhum middleware de
// autenticação/roteamento montado sob /api: arquivos estáticos aqui são
// sempre públicos, de propósito (foto de perfil não é dado sensível).
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

app.use('/api', indexRouter);
app.use('/api', searchRoutes);
app.use('/api', userRoutes);
app.use('/api', episodeRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Rota não encontrada.',
    errors: []
  });
});

app.use(errorHandler);

// config/associations precisa ser carregado ANTES do sequelize.sync():
// é ele quem declara User.hasMany(Episode)/Episode.belongsTo(User) por
// cima dos models já definidos. Se o sync rodasse antes dessas linhas
// serem executadas, o Sequelize sincronizaria a tabela `episodes` sem
// saber que a coluna userId é uma FK de verdade — criaria a coluna comum,
// mas sem a constraint de chave estrangeira no banco.
require('./config/associations');

const sequelize = require('./config/database');
sequelize.sync({ alter: true })
  .then(() => console.log('Banco de dados sincronizado!'))
  .catch(err => console.error('Erro ao sincronizar banco:', err));

module.exports = app;
