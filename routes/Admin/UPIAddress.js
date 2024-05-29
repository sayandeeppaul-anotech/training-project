const express = require("express");
const router = express.Router();
const UPIAddress = require("../../models/UPI_IDSchema");
const auth = require("../../middlewares/auth");
const { isAdmin } = require("../../middlewares/roleSpecificMiddleware");
const User = require("../../models/userModel");

//// Creating The UPI id /////////////

//// Creating The UPI ID /////////////
router.post("/createupiaddress", auth, isAdmin, async (req, res) => {
    try {
      const { Upi, qrCodeImageAddress } = req.body;
      if (!Upi || !qrCodeImageAddress) {
        return res.status(400).json({
          success: false,
          message: "Please enter both UPI ID and QR Code Image Address",
        });
      }
  
      // Check if UPI ID already exists for the user
      const existingUpiId = await UPIAddress.findOne({ user: req.user._id });
      if (existingUpiId) {
        return res.status(409).json({
          success: false,
          message: "UPI ID already exists. If you want to modify it, go to update.",
        });
      }
  
      // If no UPI ID exists, then create a new one
      const UpiID = new UPIAddress({
        Upi,
        user: req.user._id,
        qrCodeImageAddress,
      });
      await UpiID.save();
  
      res.status(201).json({
        success: true,
        message: "UPI ID added successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      });
    }
  });
  
  /////////// Update UPI ID /////////////
  router.put("/updateupiaddress", auth, isAdmin, async (req, res) => {
    try {
      const { Upi: newUPIAddress, qrCodeImageAddress: newQrCodeImageAddress } = req.body;
      if (!newUPIAddress || !newQrCodeImageAddress) {
        return res.status(400).json({
          success: false,
          message: "Please enter both UPI ID and QR Code Image Address",
        });
      }
  
      const updatedUPIAddress = await UPIAddress.findOneAndUpdate(
        { user: req.user._id },
        { $set: { Upi: newUPIAddress, qrCodeImageAddress: newQrCodeImageAddress } },
        { new: true, runValidators: true }
      );
  
      if (!updatedUPIAddress) {
        return res.status(404).json({
          success: false,
          message: "Address not found",
        });
      }
      res.status(200).json({
        success: true,
        message: "Address updated",
        updatedUPIAddress,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });
  
  //// Get UPI Addresses //////
 router.get("/getupiaddress", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    let query;
    if (user.role === "admin") {
      // If the user is an admin, they get all UPI addresses
      query = UPIAddress.find();
    } else {
      // If the user is not an admin, they get only the UPI addresses marked as visible to all users
      query = UPIAddress.find();
    }

    const UPIaddresses = await query;
    if (!UPIaddresses.length) {
      return res.status(404).json({
        success: false,
        message: "No UPI addresses found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Here are the UPI addresses",
      UPIaddress: UPIaddresses,  // Changed variable name for consistency
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

  
  module.exports = router;