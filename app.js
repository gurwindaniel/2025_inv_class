const express = require('express');
const session = require('express-session');
const pg = require('pg');
require('dotenv').config();
const app = express();
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const router = require('./route/route');
const bodyparser = require('body-parser');
const bcryptjs = require('bcryptjs');
const methodOverride = require('method-override');
const port = process.env.PORT || 3000;

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'MY CAT SECRET',
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());
app.use(methodOverride('_method'));
passport.use(
  'local',
  new LocalStrategy(
    { usernameField: 'user_name', passwordField: 'passwords' },
    async function (user_name, passwords, done) {
      console.log(user_name);
      const client = await pool.connect();
      try {
        await client.query(
          `select * from users where user_name in ($1)`,
          [user_name],
          async function (error, response) {
            if (error) {
              console.log(error);
              return done(error);
            } else if (response.rows[0] == null) {
              return done(null, false, { message: 'Incorrect Username' });
            } else {
              // username is correct test for password
              await bcryptjs.compare(
                passwords,
                response.rows[0].passwords,
                function (error, ismatch) {
                  console.log(`Password ismatch ${ismatch}`);
                  if (ismatch) {
                    return done(null, response.rows[0]);
                  } else {
                    return done(null, false, { message: 'Incorrect Password' });
                  }
                }
              );
            }
          }
        ); //email error
      } catch (e) {
        console.log(`Passport error ${e}`);
      } finally {
        client.release();
      }
    }
  )
); //passport ends

// Serialize user
passport.serializeUser((user, done) => done(null, user.user_id));
//deserialize user
passport.deserializeUser(async (user_id, done) => {
  const client = await pool.connect();
  try {
    await client.query(
      `
    select * from users where user_id in ($1)
    `,
      [user_id],
      function (error, response) {
        if (error) {
          throw error;
        } else {
          return done(error, response.rows[0]);
        }
      }
    );
  } catch (e) {
    console.log(`De-serialise error ${e}`);
  } finally {
    client.release();
  }
});

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
