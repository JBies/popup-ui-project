// routes/chat.routes.js
const express    = require('express');
const multer     = require('multer');
const ChatCtrl   = require('../controllers/chat.controller');
const authMiddleware = require('../middleware/auth.middleware');

const router  = express.Router();
const upload  = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// ── Public (embed-skriptiltä, ei autentikaatiota) ─────────────────────────
router.get('/bot/:botId/config',              ChatCtrl.getBotConfig);
router.post('/:botId/session',                ChatCtrl.startSession);
router.post('/:botId/message',                ChatCtrl.sendMessage);
router.post('/:botId/lead',                   ChatCtrl.submitLead);

// ── Authenticated (dashboard) ─────────────────────────────────────────────
router.get('/',                               authMiddleware.isUser, ChatCtrl.getBots);
router.post('/',                              authMiddleware.isUser, ChatCtrl.createBot);
router.get('/:id',                            authMiddleware.isUser, ChatCtrl.getBot);
router.put('/:id',                            authMiddleware.isUser, ChatCtrl.updateBot);
router.delete('/:id',                         authMiddleware.isUser, ChatCtrl.deleteBot);

router.get('/:id/documents',                  authMiddleware.isUser, ChatCtrl.getDocuments);
router.post('/:id/documents',                 authMiddleware.isUser, upload.single('file'), ChatCtrl.uploadDocument);
router.delete('/:id/documents/:docId',        authMiddleware.isUser, ChatCtrl.deleteDocument);
router.post('/:id/crawl',                     authMiddleware.isUser, ChatCtrl.crawlBotUrl);

router.get('/:id/qa',                         authMiddleware.isUser, ChatCtrl.getQA);
router.post('/:id/qa',                        authMiddleware.isUser, ChatCtrl.addQA);
router.put('/:id/qa/:qaId',                   authMiddleware.isUser, ChatCtrl.updateQA);
router.delete('/:id/qa/:qaId',               authMiddleware.isUser, ChatCtrl.deleteQA);

router.get('/:id/sessions',                   authMiddleware.isUser, ChatCtrl.getSessions);
router.get('/:id/sessions/:sessionId/messages', authMiddleware.isUser, ChatCtrl.getSessionMessages);
router.get('/:id/stats',                      authMiddleware.isUser, ChatCtrl.getBotStats);

module.exports = router;
