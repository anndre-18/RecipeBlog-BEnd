const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const {
  toggleFavorite,
  getFavoriteIds,
  getFavorites,
} = require("../controllers/favoriteController");

const router = express.Router();

router.post("/favorites/toggle", authMiddleware, toggleFavorite);
router.get("/users/me/favoriteIds", authMiddleware, getFavoriteIds);
router.get("/users/me/favorites", authMiddleware, getFavorites);

module.exports = router;
