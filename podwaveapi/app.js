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
var likeRoutes = require('./modules/like/likeRoutes');
var commentRoutes = require('./modules/comment/commentRoutes');
var followRoutes = require('./modules/follow/followRoutes');
var playlistRoutes = require('./modules/playlist/playlistRoutes');
var notificationRoutes = require('./modules/notification/notificationRoutes');
var reportRoutes = require('./modules/report/reportRoutes');
var adminRoutes = require('./modules/admin/adminRoutes');
var errorHandler = require('./middlewares/errorHandler');

var app = express();

app.use(logger('dev'));

// Aula 14: o cors vem ANTES dos parsers. Se o express.json() recusar o corpo
// (ex.: o logout mandando o texto "null", que não é um objeto JSON), ele
// responde 400 ali mesmo e a requisição nunca chega ao cors. Sem o cabeçalho
// Access-Control-Allow-Origin, o navegador esconde o 400 e mostra um "erro
// de CORS" no Console. Com o cors primeiro, TODA resposta (inclusive os
// erros dos parsers) sai com o cabeçalho, e o erro real aparece.
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Serve a pasta de uploads publicamente, em /uploads/... . Precisa vir
// antes das rotas da API para não competir com nenhum middleware de
// autenticação/roteamento montado sob /api: arquivos estáticos aqui são
// sempre públicos, de propósito (foto de perfil não é dado sensível).
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

app.use('/api', indexRouter);
app.use('/api', searchRoutes);
app.use('/api', userRoutes);
app.use('/api', episodeRoutes);
app.use('/api', likeRoutes);
app.use('/api', commentRoutes);
app.use('/api', followRoutes);
app.use('/api', playlistRoutes);
app.use('/api', notificationRoutes);
app.use('/api', reportRoutes);
// Aula 15 — painel de administração: depois das rotas de denúncia e antes do
// 404. A guarda (isAuthenticated + isAdmin) está DENTRO do adminRoutes, numa
// linha só (router.use('/admin', ...)).
app.use('/api', adminRoutes);

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
