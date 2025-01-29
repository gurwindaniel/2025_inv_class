const express = require('express');
const pg = require('pg');
require('dotenv').config();
const app = express();
const router = require('./route/route');
const bodyparser = require('body-parser');
const port = process.env.PORT || 3000;

app.set('view engine', 'ejs');

const pool = new pg.Pool({
  user: 'postgres',
  host: 'localhost',
  database: '2025_inv_class',
  password: process.env.PG_PASSWORD,
  port: 5432,
});

global.pool = pool;
app.use(bodyparser.urlencoded({ extended: true }));
app.use(express.json());
app.use('/public', express.static('public'));
app.use('/', router);
app.listen(port, () => {
  console.log(`Server is rumnning in port no ${port}`);
});
