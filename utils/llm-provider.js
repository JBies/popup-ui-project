// utils/llm-provider.js — provider-agnostinen LLM-kutsukerros
const Settings = require('../models/Settings');

const PROVIDER_CONFIG = {
    deepseek: {
        baseURL: 'https://api.deepseek.com',
        label: 'DeepSeek AI',
        sdkType: 'openai-compatible'
    },
    openai: {
        baseURL: 'https://api.openai.com/v1',
        label: 'OpenAI',
        sdkType: 'openai-compatible'
    },
    gemini: {
        baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
        label: 'Google Gemini',
        sdkType: 'openai-compatible'
    },
    anthropic: {
        label: 'Claude (Anthropic)',
        sdkType: 'anthropic'
    }
};

// Rakenna OpenAI-yhteensopiva client (DeepSeek, OpenAI, Gemini)
function buildOpenAIClient(provider, apiKey) {
    const { OpenAI } = require('openai');
    return new OpenAI({
        apiKey,
        baseURL: PROVIDER_CONFIG[provider].baseURL
    });
}

// Rakenna Anthropic client
function buildAnthropicClient(apiKey) {
    const Anthropic = require('@anthropic-ai/sdk');
    return new Anthropic.default({ apiKey });
}

/**
 * Lähetä chat-viestit LLM:lle ja palauta vastaus.
 * @param {Array} messages  - [{role, content}, ...]
 * @param {Object} options  - { provider, model, temperature, maxTokens }
 * @returns {Promise<{content: string, tokensUsed: number, provider: string}>}
 */
async function chatCompletion(messages, options = {}) {
    const settings = await Settings.getGlobal();
    const provider = options.provider || settings.activeLlmProvider;
    const model    = options.model    || settings.llmModels[provider];
    const temp     = options.temperature != null ? options.temperature : 0.3;
    const maxTok   = options.maxTokens || 800;

    const apiKey = settings.apiKeys[provider];
    if (!apiKey) throw new Error(`API-avain puuttuu providerille: ${provider}`);

    const config = PROVIDER_CONFIG[provider];

    if (config.sdkType === 'openai-compatible') {
        const client = buildOpenAIClient(provider, apiKey);
        const res = await client.chat.completions.create({
            model,
            messages,
            temperature: temp,
            max_tokens: maxTok
        });
        return {
            content: res.choices[0].message.content.trim(),
            tokensUsed: res.usage?.total_tokens || 0,
            provider
        };
    }

    // Anthropic
    const client = buildAnthropicClient(apiKey);
    // Erota system-viesti muista Anthropic-formaatille
    const systemMsg = messages.find(m => m.role === 'system');
    const chatMsgs  = messages.filter(m => m.role !== 'system');
    const res = await client.messages.create({
        model,
        max_tokens: maxTok,
        temperature: temp,
        system: systemMsg?.content || '',
        messages: chatMsgs
    });
    const tokensUsed = (res.usage?.input_tokens || 0) + (res.usage?.output_tokens || 0);
    return {
        content: res.content[0].text.trim(),
        tokensUsed,
        provider
    };
}

/**
 * Palauttaa nykyisen aktiivisen providerin label-tekstin widget-footeria varten.
 */
async function getActivePoweredByLabel() {
    const settings = await Settings.getGlobal();
    return settings.widgetPoweredByLabel || PROVIDER_CONFIG[settings.activeLlmProvider]?.label || '';
}

/**
 * Testaa API-yhteys antamalla yksinkertainen tervehdysviesti.
 * @returns {Promise<boolean>}
 */
async function testConnection(provider, apiKey, model) {
    const settings = await Settings.getGlobal();
    const useProvider = provider || settings.activeLlmProvider;
    const useModel    = model    || settings.llmModels[useProvider];
    const useKey      = apiKey   || settings.apiKeys[useProvider];

    if (!useKey) throw new Error('API-avain puuttuu');

    const config = PROVIDER_CONFIG[useProvider];

    if (config.sdkType === 'openai-compatible') {
        const { OpenAI } = require('openai');
        const client = new OpenAI({ apiKey: useKey, baseURL: config.baseURL });
        const res = await client.chat.completions.create({
            model: useModel,
            messages: [{ role: 'user', content: 'Say "ok"' }],
            max_tokens: 5
        });
        return !!res.choices[0].message.content;
    }

    const Anthropic = require('@anthropic-ai/sdk');
    const client = new Anthropic.default({ apiKey: useKey });
    const res = await client.messages.create({
        model: useModel,
        max_tokens: 5,
        messages: [{ role: 'user', content: 'Say "ok"' }]
    });
    return !!res.content[0].text;
}

module.exports = { chatCompletion, getActivePoweredByLabel, testConnection, PROVIDER_CONFIG };
