// controllers/chat.controller.js
const ChatBot      = require('../models/ChatBot');
const ChatDocument = require('../models/ChatDocument');
const ChatSession  = require('../models/ChatSession');
const ChatMessage  = require('../models/ChatMessage');
const ChatQA       = require('../models/ChatQA');
const User         = require('../models/User');
const Settings     = require('../models/Settings');
const Lead         = require('../models/Lead');
const { chatCompletion, getActivePoweredByLabel } = require('../utils/llm-provider');
const { embedText, findTopChunks }                = require('../utils/embeddings');
const { chunkText, parsePdf, crawlUrl }           = require('../utils/crawler');
const Fuse         = require('fuse.js');

// ──────────────────────────────────────────────────────────────────────────────
// APUMETODIT
// ──────────────────────────────────────────────────────────────────────────────

function getClientIp(req) {
    return (req.headers['x-forwarded-for'] || '').split(',')[0].trim()
        || req.socket?.remoteAddress
        || '';
}

async function getChatbotLimits(userId) {
    const user = await User.findById(userId).select('chatbotLimits').lean();
    return user?.chatbotLimits || {};
}

// Tarkista per-botti päivä- ja kuukausiraja
async function checkBotRateLimits(botId, limits) {
    const now   = new Date();
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [dayCount, monthCount] = await Promise.all([
        ChatMessage.countDocuments({ botId, role: 'user', createdAt: { $gte: dayStart } }),
        ChatMessage.countDocuments({ botId, role: 'user', createdAt: { $gte: monthStart } })
    ]);

    if (limits.maxMessagesPerDay > 0 && dayCount >= limits.maxMessagesPerDay) {
        return { blocked: true, reason: 'Päivittäinen viestiraja täynnä. Yritä huomenna uudelleen.' };
    }
    if (limits.maxMessagesPerMonth > 0 && monthCount >= limits.maxMessagesPerMonth) {
        return { blocked: true, reason: 'Kuukausittainen viestiraja täynnä.' };
    }
    return { blocked: false };
}

// Rakenna AI system prompt
function buildSystemPrompt(bot, contextChunks) {
    const lang = bot.behavior.primaryLanguage || 'fi';
    const context = contextChunks.map(c => c.text).join('\n\n---\n\n');

    let prompt = `Olet ${bot.window.botName}, avustava chatbot.
Vastaa AINA ensisijaisesti kielellä: ${lang}. Jos käyttäjä kirjoittaa eri kielellä, vastaa samalla kielellä kuin hän.
Vastaa VAIN alla olevan tietokannan perusteella. Älä keksi tietoa jota ei ole annettu.
Jos et löydä vastausta, sano niin selkeästi äläkä arvaa.
Ole lyhyt, selkeä ja ystävällinen.`;

    if (bot.behavior.systemPrompt?.trim()) {
        prompt += `\n\nLisäohjeet:\n${bot.behavior.systemPrompt.trim()}`;
    }

    if (context.trim()) {
        prompt += `\n\nTietokanta:\n${context}`;
    }

    return prompt;
}

// ──────────────────────────────────────────────────────────────────────────────
// PUBLIC ENDPOINTS (embed-skriptiltä, ei autentikaatiota)
// ──────────────────────────────────────────────────────────────────────────────

class ChatController {

    // GET /api/chat/bot/:botId/config
    static async getBotConfig(req, res) {
        try {
            const bot = await ChatBot.findById(req.params.botId).lean();
            if (!bot || !bot.isActive) return res.status(404).json({ message: 'Botti ei löydy' });

            const poweredBy = bot.poweredByLabel || await getActivePoweredByLabel();

            // Palautetaan vain julkinen konfiguraatio (ei system prompt, userId jne.)
            res.json({
                botId:      bot._id,
                name:       bot.window.botName,
                mode:       bot.mode,
                button:     bot.button,
                grabber:    bot.grabber,
                animation:  bot.animation,
                window:     bot.window,
                behavior: {
                    primaryLanguage:  bot.behavior.primaryLanguage,
                    welcomeMessage:   bot.behavior.welcomeMessage,
                    inputPlaceholder: bot.behavior.inputPlaceholder,
                    fallbackMessage:  bot.behavior.fallbackMessage,
                    fallbackContactUrl: bot.behavior.fallbackContactUrl
                },
                leadForm:   bot.leadForm,
                poweredBy
            });
        } catch (err) {
            res.status(500).json({ message: 'Virhe konfiguraation haussa' });
        }
    }

    // POST /api/chat/:botId/session  — aloita tai jatka sessiota
    static async startSession(req, res) {
        try {
            const { sessionId, pageUrl } = req.body;
            if (!sessionId) return res.status(400).json({ message: 'sessionId vaaditaan' });

            const bot = await ChatBot.findById(req.params.botId).lean();
            if (!bot || !bot.isActive) return res.status(404).json({ message: 'Botti ei löydy' });

            let session = await ChatSession.findOne({ sessionId });
            if (!session) {
                session = await ChatSession.create({
                    botId:     bot._id,
                    userId:    bot.userId,
                    sessionId,
                    visitorIp: getClientIp(req),
                    pageUrl:   pageUrl || ''
                });
            }

            res.json({ sessionId: session.sessionId, messageCount: session.messageCount });
        } catch (err) {
            res.status(500).json({ message: 'Virhe session aloituksessa' });
        }
    }

    // POST /api/chat/:botId/message  — lähetä viesti
    static async sendMessage(req, res) {
        try {
            const { sessionId, message } = req.body;
            if (!sessionId || !message?.trim()) {
                return res.status(400).json({ message: 'sessionId ja message vaaditaan' });
            }

            const bot = await ChatBot.findById(req.params.botId).lean();
            if (!bot || !bot.isActive) return res.status(404).json({ message: 'Botti ei löydy' });

            const limits = await getChatbotLimits(bot.userId);
            const maxChars = limits.maxCharsPerMessage || 500;
            const userMsg  = message.trim().slice(0, maxChars);

            // Sessiotarkistus
            let session = await ChatSession.findOne({ sessionId });
            if (!session) {
                session = await ChatSession.create({
                    botId:     bot._id,
                    userId:    bot.userId,
                    sessionId,
                    visitorIp: getClientIp(req),
                    pageUrl:   req.body.pageUrl || ''
                });
            }

            // Sessioraja
            const maxPerSession = limits.maxMessagesPerSession || 20;
            if (session.messageCount >= maxPerSession) {
                return res.json({
                    reply: 'Olet lähettänyt maksimimäärän viestejä tässä sessiossa.',
                    blocked: true
                });
            }

            // Päivä/kuukausiraja per botti
            const rateLimitCheck = await checkBotRateLimits(bot._id, limits);
            if (rateLimitCheck.blocked) {
                return res.json({ reply: rateLimitCheck.reason, blocked: true });
            }

            // Tallenna käyttäjän viesti
            await ChatMessage.create({
                sessionId, botId: bot._id, role: 'user', content: userMsg
            });

            let reply = '';
            let matchType = 'fallback';
            let tokensUsed = 0;
            let provider = '';

            // ── Q&A-haku (molemmat moodit) ──────────────────────────────────
            const qaPairs = await ChatQA.find({
                botId: bot._id,
                approved: true
            }).sort({ priority: -1 }).lean();

            if (qaPairs.length > 0) {
                const fuse = new Fuse(qaPairs, {
                    keys: ['question'],
                    threshold: 0.35,
                    minMatchCharLength: 3
                });
                const qaResults = fuse.search(userMsg);
                if (qaResults.length > 0) {
                    reply     = qaResults[0].item.answer;
                    matchType = 'qa';
                }
            }

            // ── AI-moodi: RAG jos Q&A ei osunut ────────────────────────────
            if (!reply && bot.mode === 'ai') {
                const documents = await ChatDocument.find({
                    botId: bot._id, vectorized: true
                }).lean();

                const allChunks = documents.flatMap(d => d.chunks);

                let contextChunks = [];
                if (allChunks.length > 0) {
                    const queryVector = await embedText(userMsg);
                    contextChunks = findTopChunks(queryVector, allChunks, 4, 0.25);
                }

                if (contextChunks.length > 0) {
                    const systemPrompt = buildSystemPrompt(bot, contextChunks);
                    const result = await chatCompletion([
                        { role: 'system', content: systemPrompt },
                        { role: 'user',   content: userMsg }
                    ], { temperature: bot.behavior.temperature || 0.3 });

                    reply      = result.content;
                    tokensUsed = result.tokensUsed;
                    provider   = result.provider;
                    matchType  = 'rag';
                }
            }

            // ── Fallback ────────────────────────────────────────────────────
            if (!reply) {
                reply     = bot.behavior.fallbackMessage;
                matchType = 'fallback';
            }

            // Tallenna assistentin vastaus
            await ChatMessage.create({
                sessionId, botId: bot._id,
                role: 'assistant', content: reply,
                tokensUsed, provider, matchType
            });

            // Päivitä sessio
            await ChatSession.updateOne({ sessionId }, {
                $inc: { messageCount: 1 },
                $set: { lastMessageAt: new Date() }
            });

            res.json({ reply, matchType });
        } catch (err) {
            console.error('[chat] sendMessage virhe:', err.message);
            res.status(500).json({ message: 'Virhe viestin käsittelyssä' });
        }
    }

    // POST /api/chat/:botId/lead  — tallenna liidi chatista
    static async submitLead(req, res) {
        try {
            const { sessionId, data } = req.body;
            if (!sessionId) return res.status(400).json({ message: 'sessionId vaaditaan' });

            const bot = await ChatBot.findById(req.params.botId).lean();
            if (!bot) return res.status(404).json({ message: 'Botti ei löydy' });

            await ChatSession.updateOne({ sessionId }, {
                $set: { hasLead: true, leadData: data }
            });

            // Tallenna Lead-malliin yhteensopivuuden vuoksi (botId = "popupId"-kentässä)
            await Lead.create({
                popupId: bot._id,
                userId:  bot.userId,
                data:    data || {},
                variant: 'chat'
            });

            res.json({ success: true });
        } catch (err) {
            res.status(500).json({ message: 'Virhe liidin tallennuksessa' });
        }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // AUTHENTICATED ENDPOINTS (dashboard)
    // ──────────────────────────────────────────────────────────────────────────

    // GET /api/chatbots
    static async getBots(req, res) {
        try {
            const bots = await ChatBot.find({ userId: req.user._id }).sort({ createdAt: -1 }).lean();
            res.json(bots);
        } catch (err) {
            res.status(500).json({ message: 'Virhe bottien haussa' });
        }
    }

    // POST /api/chatbots
    static async createBot(req, res) {
        try {
            // Admin ohittaa kaikki chatbot-rajoitukset
            if (req.user.role !== 'admin') {
                const user = await User.findById(req.user._id).select('chatbotLimits').lean();
                const maxBots = user.chatbotLimits?.maxBots || 0;
                if (maxBots === 0) {
                    return res.status(403).json({ message: 'Chatbot-ominaisuus ei ole käytössä tililläsi. Ota yhteyttä adminiin.' });
                }
                const count = await ChatBot.countDocuments({ userId: req.user._id });
                if (count >= maxBots) {
                    return res.status(403).json({ message: `Olet saavuttanut bottirajan (${maxBots}).` });
                }
            }

            const bot = new ChatBot({ ...req.body, userId: req.user._id });
            await bot.save();
            res.status(201).json(bot);
        } catch (err) {
            res.status(500).json({ message: 'Virhe botin luonnissa' });
        }
    }

    // GET /api/chatbots/:id
    static async getBot(req, res) {
        try {
            const bot = await ChatBot.findOne({ _id: req.params.id, userId: req.user._id }).lean();
            if (!bot) return res.status(404).json({ message: 'Botti ei löydy' });
            res.json(bot);
        } catch (err) {
            res.status(500).json({ message: 'Virhe botin haussa' });
        }
    }

    // PUT /api/chatbots/:id
    static async updateBot(req, res) {
        try {
            const bot = await ChatBot.findOneAndUpdate(
                { _id: req.params.id, userId: req.user._id },
                { $set: req.body },
                { new: true, runValidators: true }
            );
            if (!bot) return res.status(404).json({ message: 'Botti ei löydy' });
            res.json(bot);
        } catch (err) {
            res.status(500).json({ message: 'Virhe botin päivityksessä' });
        }
    }

    // DELETE /api/chatbots/:id
    static async deleteBot(req, res) {
        try {
            const bot = await ChatBot.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
            if (!bot) return res.status(404).json({ message: 'Botti ei löydy' });
            // Siivoa liittyvät dokumentit ja sessiot
            await Promise.all([
                ChatDocument.deleteMany({ botId: bot._id }),
                ChatSession.deleteMany({ botId: bot._id }),
                ChatMessage.deleteMany({ botId: bot._id }),
                ChatQA.deleteMany({ botId: bot._id })
            ]);
            res.json({ success: true });
        } catch (err) {
            res.status(500).json({ message: 'Virhe botin poistossa' });
        }
    }

    // POST /api/chatbots/:id/crawl  — URL-crawl
    static async crawlBotUrl(req, res) {
        try {
            const { url } = req.body;
            if (!url) return res.status(400).json({ message: 'url vaaditaan' });

            const bot = await ChatBot.findOne({ _id: req.params.id, userId: req.user._id }).lean();
            if (!bot) return res.status(404).json({ message: 'Botti ei löydy' });

            const limits = await getChatbotLimits(req.user._id);
            if (req.user.role !== 'admin') {
                const docCount = await ChatDocument.countDocuments({ botId: bot._id });
                if (docCount >= (limits.maxDocumentsPerBot || 10)) {
                    return res.status(403).json({ message: 'Dokumenttiraja täynnä. Poista vanhoja ennen uuden lisäystä.' });
                }
            }

            // Vastaa heti — crawl jatkuu taustalla
            res.json({ success: true, message: 'Crawl käynnistetty. Dokumentit ilmestyvät tietokantaan pian.' });

            // Taustaprosessi
            (async () => {
                try {
                    const pages = await crawlUrl(url, {
                        maxPages: limits.maxPagesPerCrawl || 50,
                        maxDepth: limits.maxCrawlDepth    || 2
                    });

                    let totalChunks = 0;

                    for (const page of pages) {
                        const chunks = chunkText(page.text);
                        const chunkObjs = [];

                        for (let i = 0; i < chunks.length; i++) {
                            let vector = [];
                            try { vector = await embedText(chunks[i]); } catch (_) {}
                            chunkObjs.push({ text: chunks[i], vector, index: i });
                            totalChunks++;
                            if (totalChunks >= (limits.maxChunksPerBot || 500)) break;
                        }

                        await ChatDocument.create({
                            botId: bot._id, userId: req.user._id,
                            sourceType: 'url', sourceName: page.url, sourceUrl: page.url,
                            chunks: chunkObjs,
                            totalChunks: chunkObjs.length,
                            totalChars: page.text.length,
                            vectorized: true
                        });

                        if (totalChunks >= (limits.maxChunksPerBot || 500)) break;
                    }
                } catch (err) {
                    console.error('[chat] crawl virhe:', err.message);
                }
            })();
        } catch (err) {
            res.status(500).json({ message: 'Virhe crawlin käynnistyksessä' });
        }
    }

    // POST /api/chatbots/:id/documents  — lataa tiedosto (PDF/TXT)
    static async uploadDocument(req, res) {
        try {
            const bot = await ChatBot.findOne({ _id: req.params.id, userId: req.user._id }).lean();
            if (!bot) return res.status(404).json({ message: 'Botti ei löydy' });

            const limits = await getChatbotLimits(req.user._id);
            if (req.user.role !== 'admin') {
                const docCount = await ChatDocument.countDocuments({ botId: bot._id });
                if (docCount >= (limits.maxDocumentsPerBot || 10)) {
                    return res.status(403).json({ message: 'Dokumenttiraja täynnä.' });
                }
            }

            if (!req.file) return res.status(400).json({ message: 'Tiedosto puuttuu' });

            const mime = req.file.mimetype;
            let text   = '';

            if (mime === 'application/pdf') {
                text = await parsePdf(req.file.buffer);
            } else {
                text = req.file.buffer.toString('utf-8');
            }

            if (!text.trim()) return res.status(400).json({ message: 'Tiedostosta ei saatu tekstiä' });

            const rawChunks = chunkText(text);
            const chunkObjs = [];
            let totalChunks = 0;
            for (let i = 0; i < rawChunks.length; i++) {
                let vector = [];
                try { vector = await embedText(rawChunks[i]); } catch (_) {}
                chunkObjs.push({ text: rawChunks[i], vector, index: i });
                totalChunks++;
                if (totalChunks >= (limits.maxChunksPerBot || 500)) break;
            }

            const doc = await ChatDocument.create({
                botId: bot._id, userId: req.user._id,
                sourceType: mime === 'application/pdf' ? 'pdf' : 'txt',
                sourceName: req.file.originalname,
                chunks: chunkObjs,
                totalChunks: chunkObjs.length,
                totalChars: text.length,
                vectorized: true
            });

            res.status(201).json({
                _id: doc._id,
                sourceName: doc.sourceName,
                totalChunks: doc.totalChunks,
                totalChars: doc.totalChars
            });
        } catch (err) {
            console.error('[chat] uploadDocument virhe:', err.message);
            res.status(500).json({ message: 'Virhe tiedoston latauksessa' });
        }
    }

    // GET /api/chatbots/:id/documents
    static async getDocuments(req, res) {
        try {
            const bot = await ChatBot.findOne({ _id: req.params.id, userId: req.user._id }).lean();
            if (!bot) return res.status(404).json({ message: 'Botti ei löydy' });
            const docs = await ChatDocument.find({ botId: bot._id })
                .select('-chunks').sort({ createdAt: -1 }).lean();
            res.json(docs);
        } catch (err) {
            res.status(500).json({ message: 'Virhe dokumenttien haussa' });
        }
    }

    // DELETE /api/chatbots/:id/documents/:docId
    static async deleteDocument(req, res) {
        try {
            const bot = await ChatBot.findOne({ _id: req.params.id, userId: req.user._id }).lean();
            if (!bot) return res.status(404).json({ message: 'Botti ei löydy' });
            await ChatDocument.findOneAndDelete({ _id: req.params.docId, botId: bot._id });
            res.json({ success: true });
        } catch (err) {
            res.status(500).json({ message: 'Virhe dokumentin poistossa' });
        }
    }

    // GET /api/chatbots/:id/qa
    static async getQA(req, res) {
        try {
            const bot = await ChatBot.findOne({ _id: req.params.id, userId: req.user._id }).lean();
            if (!bot) return res.status(404).json({ message: 'Botti ei löydy' });
            const qa = await ChatQA.find({ botId: bot._id }).sort({ priority: -1, createdAt: -1 }).lean();
            res.json(qa);
        } catch (err) {
            res.status(500).json({ message: 'Virhe Q&A-haun yhteydessä' });
        }
    }

    // POST /api/chatbots/:id/qa
    static async addQA(req, res) {
        try {
            const bot = await ChatBot.findOne({ _id: req.params.id, userId: req.user._id }).lean();
            if (!bot) return res.status(404).json({ message: 'Botti ei löydy' });
            const qa = await ChatQA.create({
                botId: bot._id, userId: req.user._id,
                question: req.body.question, answer: req.body.answer,
                approved: true, priority: req.body.priority || 0,
                source: 'manual'
            });
            res.status(201).json(qa);
        } catch (err) {
            res.status(500).json({ message: 'Virhe Q&A-lisäyksen yhteydessä' });
        }
    }

    // PUT /api/chatbots/:id/qa/:qaId
    static async updateQA(req, res) {
        try {
            const bot = await ChatBot.findOne({ _id: req.params.id, userId: req.user._id }).lean();
            if (!bot) return res.status(404).json({ message: 'Botti ei löydy' });
            const qa = await ChatQA.findOneAndUpdate(
                { _id: req.params.qaId, botId: bot._id },
                { $set: { answer: req.body.answer, approved: req.body.approved ?? true, priority: req.body.priority ?? 0 } },
                { new: true }
            );
            if (!qa) return res.status(404).json({ message: 'Q&A ei löydy' });
            res.json(qa);
        } catch (err) {
            res.status(500).json({ message: 'Virhe Q&A-päivityksen yhteydessä' });
        }
    }

    // DELETE /api/chatbots/:id/qa/:qaId
    static async deleteQA(req, res) {
        try {
            const bot = await ChatBot.findOne({ _id: req.params.id, userId: req.user._id }).lean();
            if (!bot) return res.status(404).json({ message: 'Botti ei löydy' });
            await ChatQA.findOneAndDelete({ _id: req.params.qaId, botId: bot._id });
            res.json({ success: true });
        } catch (err) {
            res.status(500).json({ message: 'Virhe Q&A-poiston yhteydessä' });
        }
    }

    // GET /api/chatbots/:id/sessions
    static async getSessions(req, res) {
        try {
            const bot = await ChatBot.findOne({ _id: req.params.id, userId: req.user._id }).lean();
            if (!bot) return res.status(404).json({ message: 'Botti ei löydy' });
            const sessions = await ChatSession.find({ botId: bot._id })
                .sort({ lastMessageAt: -1 }).limit(100).lean();
            res.json(sessions);
        } catch (err) {
            res.status(500).json({ message: 'Virhe sessioiden haussa' });
        }
    }

    // GET /api/chatbots/:id/sessions/:sessionId/messages
    static async getSessionMessages(req, res) {
        try {
            const bot = await ChatBot.findOne({ _id: req.params.id, userId: req.user._id }).lean();
            if (!bot) return res.status(404).json({ message: 'Botti ei löydy' });
            const msgs = await ChatMessage.find({ sessionId: req.params.sessionId, botId: bot._id })
                .sort({ createdAt: 1 }).lean();
            res.json(msgs);
        } catch (err) {
            res.status(500).json({ message: 'Virhe viestien haussa' });
        }
    }

    // GET /api/chatbots/:id/stats
    static async getBotStats(req, res) {
        try {
            const bot = await ChatBot.findOne({ _id: req.params.id, userId: req.user._id }).lean();
            if (!bot) return res.status(404).json({ message: 'Botti ei löydy' });

            const now = new Date();
            const dayStart   = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

            const [totalSessions, totalMessages, todayMessages, monthMessages,
                   totalLeads, fallbackCount, docCount, chunkCount] = await Promise.all([
                ChatSession.countDocuments({ botId: bot._id }),
                ChatMessage.countDocuments({ botId: bot._id, role: 'user' }),
                ChatMessage.countDocuments({ botId: bot._id, role: 'user', createdAt: { $gte: dayStart } }),
                ChatMessage.countDocuments({ botId: bot._id, role: 'user', createdAt: { $gte: monthStart } }),
                ChatSession.countDocuments({ botId: bot._id, hasLead: true }),
                ChatMessage.countDocuments({ botId: bot._id, role: 'assistant', matchType: 'fallback' }),
                ChatDocument.countDocuments({ botId: bot._id }),
                ChatDocument.aggregate([
                    { $match: { botId: bot._id } },
                    { $group: { _id: null, total: { $sum: '$totalChunks' } } }
                ])
            ]);

            res.json({
                totalSessions, totalMessages, todayMessages, monthMessages,
                totalLeads, fallbackCount,
                docCount,
                chunkCount: chunkCount[0]?.total || 0
            });
        } catch (err) {
            res.status(500).json({ message: 'Virhe tilastojen haussa' });
        }
    }
}

module.exports = ChatController;
