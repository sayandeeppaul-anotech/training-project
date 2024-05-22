const express = require('express')
const router = express.Router()
const notification = require('../../models/notificatonschema')
const auth = require('../../middlewares/auth')
const {isAdmin} = require('../../middlewares/roleSpecificMiddleware')
const User = require('../../models/userModel')


////// Create message for all users //////////////////

router.post('/createNotification', auth, isAdmin, async (req, res) => {
    try {
        const { title, message } = req.body;


        if (!title || !message) {
            return res.status(400).json({
                success: false,
                message: "Please provide both title and message"
            });
        }
        
        const newNotification = new notification({
            title,
            message,
            date: new Date()
        });

        await newNotification.save();

        const updateResult = await User.updateMany({}, { $addToSet: { notification: newNotification } });

        res.status(200).json({
            success: true,
            message: "Notification sent successfully"
        });

    } catch (error) {
       
        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
});


// //// updating message ///
// router.put('/UpdateNotification', auth, isAdmin, async (req, res) => {
//     try {
//         const { title, message } = req.body;

//         // Create a new notification document
//         const latestNotification = await Notification.findOne()

//         if (!latestNotification) {
//             return res.status(404).json({
//                 success: false,
//                 message: "No notifications found"
//             });
//         }

//         // Update the latest notification
//         latestNotification.title = title;
//         latestNotification.message = message;
//         latestNotification.date = new Date();

//         await latestNotification.save();

//         // Create a new notification object with the updated content
//         const updatedNotification = {
//             _id: latestNotification._id,
//             title: latestNotification.title,
//             message: latestNotification.message,
//             date: latestNotification.date
//         };

//         // Update notifications in User collection for all users
//         const updateResult = await User.updateMany(
//             {},
//             { $push: { notifications: updatedNotification } }
//         );

//         // Respond to the client
//         res.status(200).json({
//             success: true,
//             message: "Notification updated successfully!"
//         });
//     } catch (error) {
//         console.error(error);  // Logs the error object to the console
//         res.status(500).json({
//             success: false,
//             message: "Internal server error occurred while updating the notification."
//         });
//     }
// });


////// get notification from Admin //////

router.get('/notifications', auth, async (req, res) => {
    try {
        // Assuming 'req.user' contains the authenticated user's data
        // and 'notifications' is a field in user schema referencing Notification documents

        const userWithNotifications = await User.findById(req.user)  // Use the User's ID to find the document
            .populate('notification')  // Replace 'notifications' with the correct path if needed
            .exec();

        if (!userWithNotifications || userWithNotifications.notification.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No notifications available"
            });
        }

        res.status(200).json({
            success: true,
            notifications: userWithNotifications.notification
        });

    } catch (error) {
        console.error("Error fetching notifications:", error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});


module.exports = router

