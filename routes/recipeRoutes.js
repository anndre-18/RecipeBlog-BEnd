const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const {
  getAllRecipes,
  getRecipeById,
  createRecipe,
  deleteRecipe,
  updateRecipe,
  getMyRecipes,
} = require("../controllers/recipeController");

const router = express.Router();

router.get("/", getAllRecipes);
router.get("/mine", authMiddleware, getMyRecipes);
router.get("/:id", getRecipeById);
router.post("/", authMiddleware, createRecipe);
router.delete("/:id", authMiddleware, deleteRecipe);
router.put("/:id", authMiddleware, updateRecipe);

module.exports = router;
