// const name = () => {
//   console.log('name');
// };

// const printing = (name) => {
//   console.log('printing name');
//   name();
// };

// printing(name);

// console.log('first');

// setTimeout(() => {
//   console.log('second');
// }, 1000);

// console.log('third');

const express = require('express');
const app = express();
const PORT = process.env.PORT || 5000;

const mid = (req, res, next) => {
  console.log('middleware Function');
  next();
};
app.use(mid);

app.get('/', (req, res) => {
  console.log('Home');
  res.send('Home');
});

const middleware = (req, res, next) => {
  console.log('middleware Function as Function');
  next();
};

app.get('/about', middleware, (req, res) => {
  console.log('About');
  res.send('About');
});

app.listen(PORT, () => console.log(`server is running on port ${PORT}`));
