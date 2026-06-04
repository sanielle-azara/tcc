const { ZodError } = require('zod');

const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    try {
      const data = source === 'query' ? req.query : source === 'params' ? req.params : req.body;
      const parsed = schema.parse(data);
      if (source === 'body') req.body = parsed;
      else if (source === 'query') req.query = parsed;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        return res.status(422).json({
          success: false,
          message: 'Dados inválidos',
          errors: err.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        });
      }
      next(err);
    }
  };
};

module.exports = { validate };
