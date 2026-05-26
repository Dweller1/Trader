function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res
      .status(403)
      .json({ statusCode: 403, message: 'Forbidden: admin access required' });
  }
  next();
}

module.exports = requireAdmin;
