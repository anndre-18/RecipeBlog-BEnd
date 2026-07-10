const User = require("../models/User");
const Recipe = require("../models/Recipe");

const toggleFavorite = async (req, res) => {
  const { recipeId } = req.body;

  try {
    if (!recipeId) {
      return res.status(400).json({ message: "recipeId is required" });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const index = user.favorites.indexOf(recipeId);
    if (index === -1) {
      user.favorites.push(recipeId);
    } else {
      user.favorites.splice(index, 1);
    }

    await user.save();
    res
      .status(200)
      .json({ message: "Favorites updated", favorites: user.favorites });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getFavoriteIds = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(user.favorites || []);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getFavorites = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const favoriteRecipes = await Recipe.find({
      id: { $in: user.favorites || [] },
    });
    res.status(200).json(favoriteRecipes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = { toggleFavorite, getFavoriteIds, getFavorites };
