// controllers/adminAi.controller.js
const Settings = require('../models/Settings');
const User     = require('../models/User');
const { testConnection, PROVIDER_CONFIG } = require('../utils/llm-provider');

class AdminAiController {

    // GET /api/admin/ai-settings
    static async getSettings(req, res) {
        try {
            const settings = await Settings.getGlobal();
            // Piilota API-avaimet vastauksessa (näytä vain onko asetettu)
            const maskedKeys = {};
            for (const [k, v] of Object.entries(settings.apiKeys.toObject?.() || settings.apiKeys)) {
                maskedKeys[k] = v ? '●●●●●●●●' : '';
            }
            res.json({
                activeLlmProvider: settings.activeLlmProvider,
                llmModels:         settings.llmModels,
                apiKeysSet:        maskedKeys,
                embeddingsProvider: settings.embeddingsProvider,
                widgetPoweredByLabel: settings.widgetPoweredByLabel,
                defaultChatbotLimits: settings.defaultChatbotLimits,
                providers: Object.entries(PROVIDER_CONFIG).map(([key, cfg]) => ({
                    key, label: cfg.label
                }))
            });
        } catch (err) {
            res.status(500).json({ message: 'Virhe asetusten haussa' });
        }
    }

    // PUT /api/admin/ai-settings
    static async updateSettings(req, res) {
        try {
            const settings = await Settings.getGlobal();
            const {
                activeLlmProvider, llmModels, apiKeys,
                embeddingsProvider, widgetPoweredByLabel,
                defaultChatbotLimits
            } = req.body;

            if (activeLlmProvider) settings.activeLlmProvider = activeLlmProvider;
            if (embeddingsProvider) settings.embeddingsProvider = embeddingsProvider;
            if (widgetPoweredByLabel != null) settings.widgetPoweredByLabel = widgetPoweredByLabel;

            if (llmModels) {
                for (const [k, v] of Object.entries(llmModels)) {
                    if (settings.llmModels[k] !== undefined && v) settings.llmModels[k] = v;
                }
            }

            // Päivitä vain ne avaimet joissa on arvo (ei ylikirjoita olemassa olevia tyhjällä)
            if (apiKeys) {
                for (const [k, v] of Object.entries(apiKeys)) {
                    if (v && v !== '●●●●●●●●') settings.apiKeys[k] = v;
                }
            }

            if (defaultChatbotLimits) {
                for (const [k, v] of Object.entries(defaultChatbotLimits)) {
                    if (settings.defaultChatbotLimits[k] !== undefined && v != null) {
                        settings.defaultChatbotLimits[k] = Number(v);
                    }
                }
            }

            // Päivitä widgetPoweredByLabel automaattisesti jos provider vaihtui eikä labellia annettu
            if (activeLlmProvider && !widgetPoweredByLabel) {
                settings.widgetPoweredByLabel = PROVIDER_CONFIG[activeLlmProvider]?.label || activeLlmProvider;
            }

            await settings.save();
            res.json({ success: true });
        } catch (err) {
            res.status(500).json({ message: 'Virhe asetusten tallennuksessa' });
        }
    }

    // POST /api/admin/ai-settings/test-connection
    static async testProviderConnection(req, res) {
        try {
            const { provider, apiKey, model } = req.body;
            await testConnection(provider, apiKey, model);
            res.json({ success: true, message: 'Yhteys toimii ✓' });
        } catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    }

    // PUT /api/admin/users/chatbot-limits/:id  — per-käyttäjä chatbot-rajoitukset
    static async updateUserChatbotLimits(req, res) {
        try {
            const { maxBots, maxChunksPerBot, maxDocumentsPerBot, maxPagesPerCrawl,
                    maxCrawlDepth, maxMessagesPerDay, maxMessagesPerMonth,
                    maxMessagesPerSession, maxCharsPerMessage } = req.body;

            const update = {};
            const fields = { maxBots, maxChunksPerBot, maxDocumentsPerBot, maxPagesPerCrawl,
                             maxCrawlDepth, maxMessagesPerDay, maxMessagesPerMonth,
                             maxMessagesPerSession, maxCharsPerMessage };

            for (const [k, v] of Object.entries(fields)) {
                if (v != null) update[`chatbotLimits.${k}`] = Number(v);
            }

            const user = await User.findByIdAndUpdate(
                req.params.id, { $set: update }, { new: true }
            ).select('displayName email chatbotLimits').lean();

            if (!user) return res.status(404).json({ message: 'Käyttäjää ei löydy' });
            res.json(user);
        } catch (err) {
            res.status(500).json({ message: 'Virhe rajoitusten päivityksessä' });
        }
    }
}

module.exports = AdminAiController;
