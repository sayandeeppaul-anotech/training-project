const express = require('express');
const router = express.Router();
const User = require('../../models/userModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const auth = require('../../middlewares/auth');
require('dotenv').config();



function generateUsername() {
    const randomNumbers = Math.floor(Math.random() * 10000);
    const randomAlphabets = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `MEMBER${randomNumbers}${randomAlphabets}`;
}

function generateInviteCode() {
    return Math.floor(100000000000 + Math.random() * 900000000000);
}

function generateUID() {
    return Math.floor(100000 + Math.random() * 900000);
}

function generateRefferalLink(req) {
    let baseUrl = req.protocol + '://' + req.get('host');
    return `${baseUrl}/register?invitecode=${generateInviteCode()}`;
}

function generateProfilePicture(req) {
    const randomNumber = Math.floor(Math.random() * 6) + 1;
    let baseUrl = req.protocol + '://' + req.get('host');
    return `${baseUrl}/${randomNumber}.jpg`;
}

router.post('/register', async(req, res) => {
    try {
      const {mobile, password, invitecode } = req.body;
      if (!mobile || !password) {
        return res.status(400).json({msg: "All fields are required"});
      }
      const existingUser = await User.findOne({mobile});
      if(existingUser) {
        return res.status(400).json({msg: "User already exists"});
      }
  
      let referrer = null;
      if (invitecode) {
        // Find the referrer
        referrer = await User.findOne({invitationCode: invitecode});
        if (!referrer) {
          return res.status(400).json({msg: "Invalid invite code"});
        }
      }
  
      const myEncryptPassword = await bcrypt.hash(password, 10);
      const user = new User({
          mobile,
          password : myEncryptPassword,
          invitecode, 
          username: generateUsername() ,
          invitationCode: generateInviteCode(), 
          uid: generateUID(),
          referralLink: generateRefferalLink(req),
          avatar: generateProfilePicture(req),
          referrer: referrer ? referrer._id : null,
          // addTodaysCount:new Date.now(),

      });
  
      await user.save();
  
      const token = jwt.sign({id: user._id}, process.env.JWT_SECRET,
        {expiresIn: 3600}
      );
  
      user.token = token;
      user.password = undefined;
  
      res.status(200).json({
        success: true,
        token,
        user
      });
      if (!referrer) {
        return;
      }
let currentReferrer = referrer;
for (let i = 0; i < 5; i++) {
  if (!currentReferrer) {
    break;
  }

  if (i === 0 && currentReferrer.directSubordinates.length > 0) {
    currentReferrer.directSubordinates[0].noOfRegister++;
  }
  if (i === 1 && currentReferrer.teamSubordinates.length > 0) {
    currentReferrer.teamSubordinates[0].noOfRegister++;
  }

  await currentReferrer.save();

  currentReferrer = await User.findById(currentReferrer.referrer);
}
  
    } catch(err) {
      console.log(err);
      res.status(500).json({msg: "Server Error"});
    }
  });

 
router.get('/dashboard', auth, (req, res) => {
    console.log(req.user);
    res.send('Welcome to dashboard');
}
);

module.exports = router;

