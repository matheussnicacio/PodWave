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
require('dotenv').config();

var indexRouter = require('./routes/index');
var searchRoutes = require('./modules/search/searchRoutes');

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));

app.use('/api', indexRouter);
app.use('/api', searchRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Rota não encontrada.',
    errors: []
  });
});

module.exports = app;
