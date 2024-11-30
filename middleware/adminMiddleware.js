// middleware/adminMiddleware.js
const isadmin = (req, res, next) => {
    // Assuming the user object has a 'role' field
    if (req.user && req.user.role === 'admin') {
      return next();  // User is an admin, proceed to the next middleware/route handler
    } else {
      return res.status(403).json({ message: 'Access denied. Admins only.' });
    }
  };
  
module.exports = isadmin;
  