const express = require('express');
const { request } = require('http');
const bcyrptjs = require('bcryptjs');
const passport = require('passport');
const router = express.Router();
const auth = require('../middleware/auth');

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

const role_name = async (request, response) => {
  const client = await pool.connect();
  try {
    const role_name = await client.query(
      `
      select r.role_name from users u join roles r on u.role_id=r.role_id where u.user_name=$1;
      `,
      [request.user.user_name]
    );
    return role_name.rows[0].role_name;
  } catch (e) {
  } finally {
    client.release();
  }
};

//users page
router.get('/users', auth.isAuth, async (request, response) => {
  // console.log(request.user);
  const client = await pool.connect();
  try {
    const roles = await client.query('select * from roles');
    const users = await client.query(
      'select * from users u join roles r on u.role_id=r.role_id'
    );

    // console.log(roles.rows);
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
  // console.log(hashed_password);
  try {
    const user_name = await client.query(
      `select user_name from users where user_name in ($1)`,
      [request.body.user_name]
    );
    // const us = await client.query(`select user_dup_check($1,$2)`, [
    //   request.body.user_name,
    //   request.body.role_id,
    // ]);
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
    // console.log(`User from data ${users.user_name}`);
    // console.log(`users to check ${users_check.user_name}`);
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

//delete users

// Delete users
router.delete(
  '/delete_user/:user_id',
  auth.isAuth,
  async (request, response) => {
    const client = await pool.connect();
    const user_id = request.params.user_id;
    console.log(user_id);
    try {
      const user_name = await client.query(
        'select user_name from users where user_id in ($1)',
        [user_id]
      );
      if (user_name.rows[0].user_name == 'admin') {
        return response
          .send({ message: 'Cannot Delete Admin user' })
          .status(400);
      }
      const delete_count = await client.query(
        `delete from users where user_id in ($1) RETURNING*`,
        [user_id]
      );
      if (delete_count.rowCount === 0) {
        return response.send({ message: 'not deleted' }).status(400);
      }
      return response
        .send({ message: `${user_name.rows[0].user_name} has been deleted` })
        .status(200);
    } catch (e) {
      if (e.code === '23503') {
        // Foreign key violation
        return response
          .send({
            message: 'Cannot delete user as it is referenced by other data.',
            details: e.detail, // PostgreSQL provides additional detail about the violation
          })
          .status(400);
      }
      console.log(`Delete User Page error : ${e}`);
    } finally {
      client.release();
    }
  }
);

router.get('/addressload', auth.isAuth, async (request, response) => {
  const client = await pool.connect();
  try {
    const address_type = await client.query(
      `
      select * from person_type
      `
    );
    const address_view = await client.query(
      `
      select * from address 
              join person_type
              on address.type_id=person_type.type_id
      `
    );
    const rolename = await role_name(request, response);
    return response.render('address', {
      address_type: address_type.rows,
      address_view: address_view.rows,
      rolename: rolename,
    });
  } catch (e) {
    console.log(`render address error ${e}`);
  } finally {
    client.release();
  }
});

router.get('/addressload', auth.isAuth, async (request, response) => {
  const client = await pool.connect();
  try {
    const address_type = await client.query(
      `
      select * from person_type
      `
    );
    const address_view = await client.query(
      `
      select * from address 
              join person_type
              on address.type_id=person_type.type_id
      `
    );
    const rolename = await role_name(request, response);
    return response.render('address', {
      address_type: address_type.rows,
      address_view: address_view.rows,
      rolename: rolename,
    });
  } catch (e) {
    console.log(`render address error ${e}`);
  } finally {
    client.release();
  }
});

//post users login

// Login post
router.post(
  '/login',
  passport.authenticate('local', {
    successRedirect: '/users',
    failureRedirect: '/',
    failureFlash: true,
  })
);

//Post Address
router.post('/address', async (request, response) => {
  const client = await pool.connect();
  const { address_name, type_id, locations, pincode } = request.body;
  try {
    const type_address = await client.query(
      `
      select address_id from address where address_name in ($1) 
                                      and  locations in ($2)
                                      and pincode in ($3)
                                      and type_id in ($4)
      `,
      [address_name, locations, pincode, type_id]
    );
    if (type_address.rows[0]) {
      return response.send('duplicated').status(200);
    } else {
      await client.query(
        `
        insert into address (address_name,type_id,locations,pincode,user_id) values
        ($1,$2,$3,$4,$5)
        `,
        [address_name, +type_id, locations, +pincode, 6]
      );

      return response.send(request.body).status(200);
    }
  } catch (e) {
    console.log(`post address error ${e}`);
  } finally {
    client.release();
  }
});

//logout
router.delete('/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err); // Pass the error to the next middleware for handling
    }
    res.redirect('/'); // Redirect to the home page on successful logout
  });
});

module.exports = router;
