import express from 'express'
import { deleteMessage, getAllMessage, getMessage, login, markRead, replyToMessage, sendMessage } from '../controller/authController.js';
import { fetchEmployees, getAllUsers } from '../controller/adminController.js';
import authUser from '../middlewares/authUser.js';



const authRouter = express.Router();

authRouter.post('/login', login);
authRouter.get('/get-all-users',authUser,getAllUsers );
authRouter.post("/send-message", authUser, sendMessage );
authRouter.get("/get-all-message", authUser, getAllMessage );
authRouter.get("/get-message", authUser, getMessage );
authRouter.put("/mark-read/:messageId", authUser, markRead);
authRouter.delete("/delete/:id", authUser, deleteMessage);
authRouter.post("/messages/:id/reply", authUser, replyToMessage);





export default authRouter;