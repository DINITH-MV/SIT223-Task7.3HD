const UserModel = require("../Models/User");

// Get all users
const listUsers = async (req, res) => {
  try {
    // Pagination parameters
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip  = (page - 1) * limit;

    // Search/filter parameters
    const searchQuery = req.query.search || "";
    const roleFilter  = req.query.role   || "";

    // Build query
    const query = {};
    if (searchQuery) {
      query.$or = [
        { name:  { $regex: searchQuery, $options: "i" } },
        { email: { $regex: searchQuery, $options: "i" } }
      ];
    }
    if (roleFilter) {
      query.role = roleFilter;
    }

    // Fetch users (excluding passwords)
    const [users, totalUsers] = await Promise.all([
      UserModel.find(query)
        .select("-password")
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      UserModel.countDocuments(query)
    ]);

    return res.status(200).json({
      success: true,
      message: "Users retrieved successfully",
      data: {
        users,
        pagination: {
          currentPage:  page,
          totalPages:   Math.ceil(totalUsers / limit),
          totalUsers,
          usersPerPage: limit
        }
      }
    });
  } catch (err) {
    console.error("Error listing users:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: { details: [{ message: err.message }] }
    });
  }
};

// Create a new user
const createUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // (You’ll want to hash the password here before saving, if you haven’t already)
    const newUser = new UserModel({ name, email, password, role });
    await newUser.save();

    const userToReturn = newUser.toObject();
    delete userToReturn.password;

    return res.status(201).json({
      success: true,
      message: "User created successfully",
      data: userToReturn
    });
  } catch (err) {
    if (err.name === "ValidationError" || err.code === 11000) {
      // duplicate email or schema validation error
      return res.status(400).json({
        success: false,
        message: "Validation error",
        error: { details: [{ message: err.message }] }
      });
    }
    console.error("Error creating user:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: { details: [{ message: err.message }] }
    });
  }
};


// Get single user by ID
const getUserById = async (req, res) => {
  try {
    const user = await UserModel.findById(req.params.id)
      .select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
        error: { details: [{ message: "No user with that ID" }] }
      });
    }

    return res.status(200).json({
      success: true,
      message: "User retrieved successfully",
      data: user
    });
  } catch (err) {
    if (err.kind === "ObjectId") {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
        error: { details: [{ message: "ID format is incorrect" }] }
      });
    }
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: { details: [{ message: err.message }] }
    });
  }
};

// Update user
const updateUser = async (req, res) => {
  try {
    const { name, role } = req.body;
    const updates = { name, role };

    const user = await UserModel.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
        error: { details: [{ message: "No user with that ID" }] }
      });
    }

    return res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: user
    });
  } catch (err) {
    if (err.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        error: { details: [{ message: err.message }] }
      });
    }
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: { details: [{ message: err.message }] }
    });
  }
};

// Delete user
const deleteUser = async (req, res) => {
  try {
    const user = await UserModel.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
        error: { details: [{ message: "No user with that ID" }] }
      });
    }
    return res.status(200).json({
      success: true,
      message: "User deleted successfully"
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: { details: [{ message: err.message }] }
    });
  }
};

module.exports = {
  listUsers,
  createUser,
  getUserById,
  updateUser,
  deleteUser
};
