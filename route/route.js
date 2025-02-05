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

//edit users
//user edit
router.post('/useredit', async (request, response) => {
  console.log(request.body);
  const client = await pool.connect();
  const user_name = request.body.user_name;
  const passwords = request.body.passwords;
  const role_id = request.body.role_id;
  const user_id = request.body.user_id;
  const users_check = {};
  users_check.user_name = user_name;
  users_check.passwords = passwords;
  users_check.role_id = role_id;
  try {
    const user_data = await client.query(
      `select * from users where user_id in ($1)`,
      [user_id]
    );
    const users = user_data.rows[0];
    console.log(`User from data ${users.user_name}`);
    console.log(`users to check ${users_check.user_name}`);
    edit_keys = [];
    for (let key in users_check) {
      if (users[key] != users_check[key]) {
        edit_keys.push(key);
      }
    }
    console.log(edit_keys);
    if (edit_keys[0] != null) {
      console.log(edit_keys);
      for (let i = 0; i < edit_keys.length; i++) {
        if (edit_keys[i] == 'passwords') {
          users_check[edit_keys[i]] = await bcyrptjs.hash(passwords, 10);
        } else if (edit_keys[i] == 'role_id') {
          users_check[i] = parseInt(users_check[edit_keys[i]]);
        }

        const query = `update users set ${edit_keys[i]}=$1 where user_id in ($2)`;
        await client.query(query, [users_check[edit_keys[i]], user_id]);
      }

      return response.send(request.body).status(200);
    }
    return response.send(request.body).status(200);
  } catch (e) {
    console.log(`user edit error ${e}`);
  } finally {
    client.release();
  }
});

router.get('/addressload', async (request, response) => {
  return response.render('address');
});

module.exports = router;
