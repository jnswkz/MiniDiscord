import { Router } from 'express';
import { RoomController, createRoomSchema, addMemberSchema } from '../controllers/room.controller';
import { validate } from '@minidiscord/common';
import { requireGatewayAuth } from '../middleware/auth.middleware';

export const roomRouter = Router();

roomRouter.use(requireGatewayAuth);

roomRouter.post('/', validate(createRoomSchema), RoomController.createRoom);
roomRouter.get('/', RoomController.getMyRooms);
roomRouter.get('/:roomId', RoomController.getRoom);
roomRouter.get('/:roomId/members', RoomController.getMembers);
roomRouter.post('/:roomId/members', validate(addMemberSchema), RoomController.addMember);
roomRouter.get('/:roomId/members/:userId', RoomController.verifyMembership);
