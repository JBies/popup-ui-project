// utils/embeddings.js — tekstin vektorointi ja cosine similarity (axios, ei openai SDK)
const axios   = require('axios');
const Settings = require('../models/Settings');

/**
 * Luo embedding-vektori tekstille.
 * @param {string} text
 * @returns {Promise<number[]>}
 */
async function embedText(text) {
    const settings = await Settings.getGlobal();
    const provider = settings.embeddingsProvider || 'openai';
    const apiKey   = settings.apiKeys[provider];
    if (!apiKey) throw new Error(`Embeddings API-avain puuttuu providerille: ${provider}`);

    if (provider === 'openai') {
        const res = await axios.post('https://api.openai.com/v1/embeddings', {
            model: 'text-embedding-3-small',
            input: text.slice(0, 8191)
        }, {
            headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
            timeout: 20000
        });
        return res.data.data[0].embedding;
    }

    // Gemini embeddings (OpenAI-compatible endpoint)
    // Huom: text-embedding-004 on vanhentunut tällä endpointilla → gemini-embedding-001
    const res = await axios.post(
        'https://generativelanguage.googleapis.com/v1beta/openai/embeddings',
        { model: 'gemini-embedding-001', input: text.slice(0, 2048) },
        {
            headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
            timeout: 20000
        }
    );
    return res.data.data[0].embedding;
}

/**
 * Laske cosine similarity kahden vektorin välillä.
 */
function cosineSimilarity(a, b) {
    if (!a?.length || !b?.length || a.length !== b.length) return 0;
    let dot = 0, magA = 0, magB = 0;
    for (let i = 0; i < a.length; i++) {
        dot  += a[i] * b[i];
        magA += a[i] * a[i];
        magB += b[i] * b[i];
    }
    if (magA === 0 || magB === 0) return 0;
    return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

/**
 * Etsi top-k relevanteimmat chunkit kysymysvektorille.
 */
function findTopChunks(queryVector, chunks, topK = 4, minScore = 0.25) {
    const scored = chunks
        .filter(c => c.vector?.length > 0)
        .map(c => ({ text: c.text, score: cosineSimilarity(queryVector, c.vector) }))
        .filter(c => c.score >= minScore)
        .sort((a, b) => b.score - a.score);
    return scored.slice(0, topK);
}

module.exports = { embedText, cosineSimilarity, findTopChunks };
