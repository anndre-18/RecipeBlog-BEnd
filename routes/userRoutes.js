const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const {
  getMe,
  updateProfile,
  updateProfilePicture,
} = require("../controllers/userController");

const router = express.Router();

router.get("/me", authMiddleware, getMe);
router.put("/me", authMiddleware, updateProfile);
router.put("/me/profile-picture", authMiddleware, updateProfilePicture);

module.exports = router;
