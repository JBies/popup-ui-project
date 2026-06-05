// utils/llm-provider.js — provider-agnostinen LLM-kutsukerros (axios, ei openai/anthropic SDK)
const axios   = require('axios');
const Settings = require('../models/Settings');

const PROVIDER_CONFIG = {
    deepseek: {
        url:   'https://api.deepseek.com/chat/completions',
        label: 'DeepSeek AI',
        type:  'openai-compatible'
    },
    openai: {
        url:   'https://api.openai.com/v1/chat/completions',
        label: 'OpenAI',
        type:  'openai-compatible'
    },
    gemini: {
        url:   'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
        label: 'Google Gemini',
        type:  'openai-compatible'
    },
    anthropic: {
        url:   'https://api.anthropic.com/v1/messages',
        label: 'Claude (Anthropic)',
        type:  'anthropic'
    }
};

/**
 * Lähetä chat-viestit LLM:lle ja palauta vastaus.
 * @param {Array} messages  - [{role, content}, ...]
 * @param {Object} options  - { provider, model, temperature, maxTokens }
 * @returns {Promise<{content: string, tokensUsed: number, provider: string}>}
 */
async function chatCompletion(messages, options = {}) {
    const settings = await Settings.getGlobal();
    const provider = options.provider || settings.activeLlmProvider || 'deepseek';
    const model    = options.model    || settings.llmModels[provider] || 'deepseek-chat';
    const temp     = options.temperature != null ? options.temperature : 0.3;
    const maxTok   = options.maxTokens || 800;

    const apiKey = settings.apiKeys[provider];
    if (!apiKey) throw new Error(`API-avain puuttuu providerille: ${provider}`);

    const cfg = PROVIDER_CONFIG[provider];

    if (cfg.type === 'openai-compatible') {
        const res = await axios.post(cfg.url, {
            model,
            messages,
            temperature: temp,
            max_tokens:  maxTok
        }, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type':  'application/json'
            },
            timeout: 30000
        });
        const choice = res.data.choices?.[0];
        return {
            content:    (choice?.message?.content || '').trim(),
            tokensUsed: res.data.usage?.total_tokens || 0,
            provider
        };
    }

    // Anthropic
    const systemMsg = messages.find(m => m.role === 'system');
    const chatMsgs  = messages.filter(m => m.role !== 'system');
    const res = await axios.post(cfg.url, {
        model,
        max_tokens:  maxTok,
        temperature: temp,
        system:      systemMsg?.content || '',
        messages:    chatMsgs
    }, {
        headers: {
            'x-api-key':         apiKey,
            'anthropic-version': '2023-06-01',
            'Content-Type':      'application/json'
        },
        timeout: 30000
    });
    const tokensUsed = (res.data.usage?.input_tokens || 0) + (res.data.usage?.output_tokens || 0);
    return {
        content:    (res.data.content?.[0]?.text || '').trim(),
        tokensUsed,
        provider
    };
}

/**
 * Palauttaa nykyisen aktiivisen providerin label-tekstin widget-footeria varten.
 */
async function getActivePoweredByLabel() {
    const settings = await Settings.getGlobal();
    return settings.widgetPoweredByLabel
        || PROVIDER_CONFIG[settings.activeLlmProvider]?.label
        || '';
}

/**
 * Testaa API-yhteys lyhyellä viestillä.
 * @returns {Promise<boolean>}
 */
async function testConnection(provider, apiKey, model) {
    const settings    = await Settings.getGlobal();
    const useProvider = provider || settings.activeLlmProvider;
    const useModel    = model    || settings.llmModels[useProvider];
    const useKey      = apiKey && apiKey !== '●●●●●●●●' ? apiKey : settings.apiKeys[useProvider];

    if (!useKey) throw new Error('API-avain puuttuu');

    const cfg = PROVIDER_CONFIG[useProvider];

    if (cfg.type === 'openai-compatible') {
        const res = await axios.post(cfg.url, {
            model: useModel,
            messages: [{ role: 'user', content: 'Say ok' }],
            max_tokens: 5
        }, {
            headers: { 'Authorization': `Bearer ${useKey}`, 'Content-Type': 'application/json' },
            timeout: 15000
        });
        return !!res.data.choices?.[0]?.message?.content;
    }

    const res = await axios.post(cfg.url, {
        model: useModel,
        max_tokens: 5,
        messages: [{ role: 'user', content: 'Say ok' }]
    }, {
        headers: { 'x-api-key': useKey, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' },
        timeout: 15000
    });
    return !!res.data.content?.[0]?.text;
}

module.exports = { chatCompletion, getActivePoweredByLabel, testConnection, PROVIDER_CONFIG };
