const express = require('express')
const User = require('../../models/userModel')
const auth = require('../../middlewares/auth')
const {isAdmin} = require('../../middlewares/roleSpecificMiddleware')
const router = express.Router()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

////// get user details 
router.get('/fetchuserdetails',auth,isAdmin,async(req,res)=>{
    try {
        const users = await User.find({},'walletAmount uid username mobile')
        if (!users.length){
            res.status(404).json({
                sucess:false,
                message:"No user found" 
            })
        }
        res.status(500).json({
            sucess:true,
            message:"Here is the Details",
            users
        })
    } catch (error) {
        res.status(500).json({
            sucess:false,
            message:"server error",
            error:error.message 
        })
    }
})

//// Delete the user From admin side
router.delete('/deleteuser', auth, isAdmin, async (req, res) => {
    try {
        const { mobile } = req.body;
        if (!mobile) {
            return res.status(400).json({
                success: false,
                message: "Please enter the mobile number"
            });
        }

       
        let deleteUser = await User.findOneAndDelete({ mobile: mobile });

       
        if (!deleteUser) {
            return res.status(404).json({
                success: false,
                message: "User not found with the provided mobile number"
            });
        }

     
        res.status(200).json({
            success: true,
            message: "User Deleted Successfully"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message
        });
    }
});


/////////////////////////////////////////////////////////////
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
  
  function generateReferralLink(req, invitationCode) {
    let baseUrl = req.protocol + "://" + req.get("host");
    return `${baseUrl}/register?invitecode=${invitationCode}`;
  }
  
  function generateProfilePicture(req) {
    const randomNumber = Math.floor(Math.random() * 6) + 1;
    let baseUrl = req.protocol + "://" + req.get("host");
    return `${baseUrl}/${randomNumber}.jpg`;
  }
  
  // Endpoint for admin to register a new user
  router.post("/re-register", auth,isAdmin,async (req, res) => {
    try {
      // Extract data from request body
      const { mobile, password, accountType = "Normal" } = req.body;
  
      // Check if mobile and password are provided
      if (!mobile || !password) {
        return res.status(400).json({ msg: "Mobile and password are required fields" });
      }
  
      // Check if the requesting user is an admin
      if (req.user.accountType !== "Admin") {
        return res.status(403).json({ msg: "Unauthorized: Only admins can register new users" });
      }
  
      // Check if user already exists with the provided mobile number
      const existingUser = await User.findOne({ mobile });
      if (existingUser) {
        return res.status(400).json({ msg: "User already exists" });
      }
  
      // Hash the password
      const encryptedPassword = await bcrypt.hash(password, 10);
  
      // Generate user data
      const invitationCode = generateInviteCode();
      const userData = {
        mobile,
        password: encryptedPassword,
        username: generateUsername(),
        invitationCode,
        uid: generateUID(),
        accountType,
        referralLink: generateReferralLink(req, invitationCode),
        avatar: generateProfilePicture(req)
      };
  
      // Register the new user
      const newUser = new User(userData);
      await newUser.save();
  
      // Generate JWT token for the new user
      const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, { expiresIn: 3600 });
      newUser.token = token;
      newUser.password = undefined;
  
      // Return success response
      res.status(200).json({ success: true, message: "User registered successfully", user: newUser });
  
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: "Server Error" });
    }
  });
  

module.exports = router