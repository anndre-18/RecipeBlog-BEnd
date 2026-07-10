const formatUser = (user) => ({
  _id: user._id,
  id: user._id.toString(),
  name: user.name,
  email: user.email,
  profilePicture: user.profilePicture || "",
  isVerified: user.isVerified,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
  favorites: user.favorites || [],
});

module.exports = formatUser;
