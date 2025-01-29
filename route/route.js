const express = require('express');
const { request } = require('http');
const bcyrptjs = require('bcryptjs');
const router = express.Router();

router.get('/', async (request, response) => {
  const client = await pool.connect();
  try {
    const value = await client.query('Select now()');

    console.log(value);

    const users = {
      title: 'Login',
      name: 'inventory',
      value: value.rows[0],
    };
    response.render('login', { users: users });
  } catch (e) {
    console.log(`Login Page error : ${e}`);
  } finally {
    client.release();
  }
});

//users page
router.get('/users', async (request, response) => {
  const client = await pool.connect();
  try {
    const roles = await client.query('select * from roles');
    const users = await client.query(
      'select * from users u join roles r on u.role_id=r.role_id'
    );

    console.log(roles.rows);
    return response.render('users', {
      roles: roles.rows,
      list_users: users.rows,
    });
  } catch (e) {
    console.log(`Role Page error : ${e}`);
  } finally {
    client.release();
  }
});

//post users
router.post('/userpost', async (request, response) => {
  const client = await pool.connect();
  const users = request.body;
  const hashed_password = await bcyrptjs.hash(
    String(request.body.passwords),
    10
  );
  console.log(hashed_password);
  try {
    console.log(users);
    const user_name = await client.query(
      `select user_name from users where user_name in ($1)`,
      [request.body.user_name]
    );
    if (user_name.rows[0]) {
      return response.send('duplicate').status(200);
    } else {
      await client.query(
        'insert into users (user_name,passwords,role_id) values ($1,$2,$3)',
        [request.body.user_name, hashed_password, request.body.role_id]
      );
      return response.send(request.body);
    }
  } catch (e) {
    console.log(`User Post Page error : ${e}`);
  } finally {
    client.release();
  }
});

router.get('/addressload', async (request, response) => {
  return response.render('address');
});

module.exports = router;
