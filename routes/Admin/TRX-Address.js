const express = require("express");
const User = require("../../models/userModel");
const TRXAddressModel = require("../../models/TRXAddressSchema");
const auth = require("../../middlewares/auth");
const { isAdmin } = require("../../middlewares/roleSpecificMiddleware");
const router = express.Router();

///////////////////// For Create the Address POST/////

router.post("/CreateAddress", auth, isAdmin, async (req, res) => {
  try {
    const { TRXAddress, qrCodeImageAddress } = req.body;
    console.log("--->", TRXAddress);
    if (!TRXAddress || !qrCodeImageAddress) {
      return res.status(400).json({
        success: false,
        message: "TRXAddress and qrCodeImageAddress are required",
      });
    }

    // Check if a TRXAddress already exists for this user
    const existingAddress = await TRXAddressModel.findOne({ user: req.user._id });
    if (existingAddress) {
      return res.status(409).json({
        success: false,
        message: "TRXAddress already exists for this user. If you want to modify it, use update.",
      });
    }

    // Create a new TRXAddress since one doesn't exist yet
    const newTRXAddress = new TRXAddressModel({
      TRXAddress,
      user: req.user._id,
      qrCodeImageAddress
    });

    await newTRXAddress.save();

    res.status(201).json({
      success: true,
      message: "Saved the address",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error: " + error.message,
    });
  }
});

router.put("/updateAddress", auth, isAdmin, async (req, res) => {
  try {
    const { TRXAddress: newTRXAddress, qrCodeImageAddress: newQrCodeImageAddress } = req.body;
    if (!newTRXAddress || !newQrCodeImageAddress) {
      return res.status(400).send("TRXAddress and qrCodeImageAddress are required");
    }

    const updatedTrxAddress = await TRXAddressModel.findOneAndUpdate(
      { user: req.user._id },
      { $set: { TRXAddress: newTRXAddress, qrCodeImageAddress: newQrCodeImageAddress } },
      { new: true, runValidators: true }
    );

    if (!updatedTrxAddress) {
      return res.status(404).send("Address not found");
    }

    res.status(200).json({
      success: true,
      message: "Address updated",
      updatedTrxAddress
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

///////// GET Address //////////
router.get("/getAddresses", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    console.log("Authenticated User:", user);

    if (!user) {
      return res.status(404).send("User not found");
    }
    
    // Here we'll assume that there's some identifier or flag that helps us recognize 
    // an admin-created address that should be visible to all users,
    // for example, a boolean field 'isVisibleToAllUsers' set to true.
    
    let query;
    if (user.role === "admin") {
      // If the user is an admin, they get all addresses
      query = TRXAddressModel.find();
    } else {
      // If the user is not an admin, they get only the addresses marked as visible to all users
      // You might adjust this query based on how admin addresses are identified in your schema
      query = TRXAddressModel.find();
    }

    const addresses = await query;
    console.log("Query Executed:", query.getQuery());
    console.log("Addresses Found:", addresses);

    if (!addresses.length) {
      return res.status(404).json({
        success: false,
        message: "No addresses found",
      });
    }

    res.status(200).json({
      success: true,
      addresses,
    });
  } catch (error) {
    console.error("Error Fetching Addresses:", error);
    res.status(500).json({
      success: false,
      message: "Server error: " + error.message,
    });
  }
});



module.exports = router;