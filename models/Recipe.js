const mongoose = require("mongoose");

const recipeSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  recipeName: { type: String, required: true },
  timeRequired: { type: String, required: true },
  ingredients: { type: String, required: true },
  instructions: { type: String, default: "" },
  description: { type: String, required: true },
  images: {
    type: [String],
    required: true,
    validate: {
      validator: function (arr) {
        return Array.isArray(arr) && arr.length >= 1 && arr.length <= 3;
      },
      message: "Images must contain between 1 and 3 URLs",
    },
  },
  ownerId: { type: String, required: true },
  ownerName: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Recipe", recipeSchema);
