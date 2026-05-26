const { Strategy } = require("../models");

async function getAll(req, res, next) {
  try {
    const strategies = await Strategy.findAll({
      where: { user_id: req.user.id },
      order: [["created_at", "DESC"]],
    });
    return res.status(200).json(strategies);
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const { name, description, graph_data, is_public } = req.body;

    if (!name) {
      return res
        .status(400)
        .json({ statusCode: 400, message: "name is required" });
    }

    const strategy = await Strategy.create({
      user_id: req.user.id,
      name,
      description: description !== undefined ? description : null,
      graph_data: graph_data !== undefined ? graph_data : {},
      is_public: is_public !== undefined ? Boolean(is_public) : false,
    });

    return res.status(201).json(strategy);
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const strategy = await Strategy.findByPk(req.params.id);

    if (!strategy) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "Strategy not found" });
    }
    if (strategy.user_id !== req.user.id) {
      return res
        .status(403)
        .json({
          statusCode: 403,
          message: "Forbidden: you do not own this strategy",
        });
    }

    return res.status(200).json(strategy);
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const strategy = await Strategy.findByPk(req.params.id);

    if (!strategy) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "Strategy not found" });
    }
    if (strategy.user_id !== req.user.id) {
      return res
        .status(403)
        .json({
          statusCode: 403,
          message: "Forbidden: you do not own this strategy",
        });
    }

    const { name, description, graph_data, is_public } = req.body;

    await strategy.update({
      name: name !== undefined ? name : strategy.name,
      description:
        description !== undefined ? description : strategy.description,
      graph_data: graph_data !== undefined ? graph_data : strategy.graph_data,
      is_public:
        is_public !== undefined ? Boolean(is_public) : strategy.is_public,
      updated_at: new Date(),
    });

    return res.status(200).json(strategy);
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const strategy = await Strategy.findByPk(req.params.id);

    if (!strategy) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "Strategy not found" });
    }
    if (strategy.user_id !== req.user.id) {
      return res
        .status(403)
        .json({
          statusCode: 403,
          message: "Forbidden: you do not own this strategy",
        });
    }

    await strategy.destroy();
    return res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { getAll, create, getById, update, delete: remove };
