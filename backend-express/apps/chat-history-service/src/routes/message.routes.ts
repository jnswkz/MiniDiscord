import { Router } from 'express';
import { MessageController, createMessageSchema, updateReadReceiptSchema } from '../controllers/message.controller';
import { validate } from '@minidiscord/common';
import { requireGatewayAuth } from '../middleware/auth.middleware';

// Note: Mounted at /api/messages in gateway
export const messageRouter = Router();

messageRouter.use(requireGatewayAuth);

// Room/Channel contexts
messageRouter.get('/:roomId/:channelId', MessageController.getMessages);
messageRouter.post('/:roomId/:channelId', validate(createMessageSchema), MessageController.createMessage);
messageRouter.get('/:roomId/search', MessageController.searchMessages);

// Message context
messageRouter.delete('/:messageId', MessageController.deleteMessage);

// Read receipts (could be /api/messages/read-receipts/:channelId but we can just use /receipts)
messageRouter.post('/receipts/:channelId', validate(updateReadReceiptSchema), MessageController.updateReadReceipt);
