middlewareobj = {};
middlewareobj.isAuth = (request, response, next) => {
  console.log(request.isAuthenticated());
  const auth_status = request.isAuthenticated();
  if (auth_status) {
    return next();
  } else {
    return response.redirect('/');
  }
};

module.exports = middlewareobj;
