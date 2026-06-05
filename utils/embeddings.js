// utils/embeddings.js — tekstin vektorointi ja cosine similarity
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

    const { OpenAI } = require('openai');

    if (provider === 'openai') {
        const client = new OpenAI({ apiKey });
        const res = await client.embeddings.create({
            model: 'text-embedding-3-small',
            input: text.slice(0, 8191)   // max input
        });
        return res.data[0].embedding;
    }

    // Gemini embeddings (OpenAI-compatible endpoint)
    const client = new OpenAI({
        apiKey,
        baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/'
    });
    const res = await client.embeddings.create({
        model: 'text-embedding-004',
        input: text.slice(0, 2048)
    });
    return res.data[0].embedding;
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
 * @param {number[]} queryVector
 * @param {Array<{text, vector}>} chunks
 * @param {number} topK
 * @param {number} minScore  - minimiscore (0–1), alle tämän hylätään
 * @returns {Array<{text, score}>}
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
