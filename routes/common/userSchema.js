const express = require("express");
const router = express.Router();
const user = require("../../models/userModel");
const auth = require("../../middlewares/auth");
const {isAdmin,isNormal,isRestricted,} = require("../../middlewares/roleSpecificMiddleware");
const User = require("../../models/userModel");



router.get('/user', auth, async (req, res) => {
    const userId = req.user._id;
    if (!userId) {
      return res.status(400).send({ message: 'No user ID in cookies' });
    }
  
    try {
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).send({ message: 'User not found' });
      }
  
      res.send(user);
    } catch (error) {
      res.status(500).send({ message: 'Server error' });
    }
  });

module.exports =  router;
