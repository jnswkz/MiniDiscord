import { Router } from 'express';
import { ChannelController, createChannelSchema } from '../controllers/channel.controller';
import { validate } from '@minidiscord/common';
import { requireGatewayAuth } from '../middleware/auth.middleware';

// Note: Channels are nested under rooms in API Gateway: /api/rooms/:roomId/channels
export const channelRouter = Router({ mergeParams: true });

channelRouter.use(requireGatewayAuth);

channelRouter.post('/', validate(createChannelSchema), ChannelController.createChannel);
channelRouter.get('/', ChannelController.getChannels);
channelRouter.delete('/:channelId', ChannelController.deleteChannel);
