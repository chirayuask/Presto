export const validate = ({ params, query, body } = {}) => (req, _res, next) => {
  try {
    if (params) {
      const parsed = params.parse(req.params);
      Object.assign(req.params, parsed);
    }
    if (query) {
      req.validatedQuery = query.parse(req.query);
    }
    if (body) {
      req.body = body.parse(req.body);
    }
    next();
  } catch (err) {
    next(err);
  }
};
