import { Router } from 'express';
import { UserController, updateProfileSchema, updateStatusSchema, addFriendSchema } from '../controllers/user.controller';
import { validate } from '@minidiscord/common';
import { requireAuth } from '../middleware/auth.middleware';

export const userRouter = Router();

userRouter.use(requireAuth);

userRouter.get('/me', UserController.getMe);
userRouter.put('/me', validate(updateProfileSchema), UserController.updateMe);
userRouter.put('/me/status', validate(updateStatusSchema), UserController.updateStatus);

userRouter.get('/search', UserController.searchUsers);
userRouter.post('/bulk', UserController.bulkUsers);

userRouter.get('/friends', UserController.getFriends);
userRouter.post('/friends', validate(addFriendSchema), UserController.addFriend);
userRouter.put('/friends/:id', UserController.updateFriendship);
userRouter.delete('/friends/:id', UserController.removeFriend);
