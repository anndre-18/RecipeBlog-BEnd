const { v4: uuidv4 } = require("uuid");
const Recipe = require("../models/Recipe");

const getAllRecipes = async (req, res) => {
  try {
    const recipes = await Recipe.find();
    if (!recipes) {
      return res.status(404).send({ message: "Sorry , No Recipe Found" });
    }
    console.log(recipes);
    res.status(200).json(recipes);
  } catch (error) {
    res.status(500).json({ message: "Internal Sever Error" });
  }
};

const getRecipeById = async (req, res) => {
  const { id } = req.params;

  try {
    const recipe = await Recipe.findOne({ id });
    if (!recipe) {
      return res.status(404).json({ message: "Recipe not found" });
    }
    res.status(200).json(recipe);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const createRecipe = async (req, res) => {
  const { recipeName, timeRequired, ingredients, description, images, createdAt } =
    req.body;

  try {
    if (!recipeName || !timeRequired || !ingredients || !description) {
      return res
        .status(400)
        .json({ message: "Please fill all required text fields" });
    }

    if (!Array.isArray(images) || images.length < 1 || images.length > 3) {
      return res
        .status(400)
        .json({ message: "Please provide 1 to 3 image URLs" });
    }

    const newRecipe = new Recipe({
      id: uuidv4(),
      recipeName,
      timeRequired,
      ingredients,
      description,
      images,
      createdAt: createdAt ? new Date(createdAt) : new Date(),
    });

    const savedRecipe = await newRecipe.save();
    res.status(200).json(savedRecipe);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const deleteRecipe = async (req, res) => {
  const { id } = req.params;

  try {
    const deletedRecipe = await Recipe.findOneAndDelete({ id });
    if (!deletedRecipe) {
      return res.status(404).json({ message: "Recipe not found" });
    }
    console.log(deletedRecipe);
    res.status(200).json({ message: "Recipe Deleted Success " });
  } catch (error) {
    res.status(500).json({ message: "Internal Error" });
  }
};

const updateRecipe = async (req, res) => {
  const { id } = req.params;
  const { recipeName, timeRequired, ingredients, description, images } = req.body;

  try {
    if (!recipeName || !timeRequired || !ingredients || !description) {
      return res.status(400).json({ message: "Provide all required text fields" });
    }

    if (!Array.isArray(images) || images.length < 1 || images.length > 3) {
      return res.status(400).json({ message: "Provide 1 to 3 image URLs" });
    }

    const updatedRecipe = await Recipe.findOneAndUpdate(
      { id },
      { recipeName, timeRequired, ingredients, description, images },
      { new: true }
    );

    if (!updatedRecipe) {
      return res.status(404).json({ message: "Recipe not found" });
    }

    console.log(updatedRecipe);
    res.status(200).json(updatedRecipe);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = {
  getAllRecipes,
  getRecipeById,
  createRecipe,
  deleteRecipe,
  updateRecipe,
};
