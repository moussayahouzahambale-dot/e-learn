const notFound = (req, res, next) => {
  res.status(404);
  next(new Error('Route introuvable.'));
};

const errorHandler = (error, req, res, next) => {
  const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;

  if (statusCode >= 500) {
    console.error(error);
  }

  res.status(statusCode).json({
    message: error.message || 'Erreur serveur.',
    ...(process.env.NODE_ENV === 'development' ? { stack: error.stack } : {})
  });
};

module.exports = {
  notFound,
  errorHandler
};
