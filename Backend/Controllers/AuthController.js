const bcrypt = require('bcrypt');
const jwt    = require('jsonwebtoken');
const User   = require("../Models/User");

const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existing = await User.findOne({ email });

    if (existing) {
      // failure shape with error.details
      return res
        .status(409)
        .json({
          success: false,
          message: 'User already exists, you can login',
          error: {
            details: [
              { message: 'User already exists, you can login' }
            ]
          }
        });
    }

    const hash = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hash });
    await user.save();

    return res
      .status(201)
      .json({
        success: true,
        message: 'Signup successful'
      });

  } catch (err) {
    return res
      .status(500)
      .json({
        success: false,
        message: 'Internal server error',
        error: {
          details: [
            { message: err.message }
          ]
        }
      });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const errorMsg = 'Auth failed: email or password is wrong';
    const user = await User.findOne({ email });

    if (!user) {
      return res
        .status(403)
        .json({
          success: false,
          message: errorMsg,
          error: {
            details: [ { message: errorMsg } ]
          }
        });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res
        .status(403)
        .json({
          success: false,
          message: errorMsg,
          error: {
            details: [ { message: errorMsg } ]
          }
        });
    }

    const token = jwt.sign(
      { email: user.email, _id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res
      .status(200)
      .json({
        success: true,
        message: 'Login successful',
        jwtToken: token,
        email: user.email,
        name: user.name
      });

  } catch (err) {
    return res
      .status(500)
      .json({
        success: false,
        message: 'Internal server error',
        error: {
          details: [
            { message: err.message }
          ]
        }
      });
  }
};

module.exports = { signup, login };
