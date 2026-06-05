// utils/crawler.js — URL-crawl, tiedostojen parsinta ja chunking
const axios  = require('axios');
const cheerio = require('cheerio');

const CHUNK_TARGET_CHARS = 1800;   // ~450 sanaa, ~500 tokenia
const CHUNK_OVERLAP_CHARS = 200;

/**
 * Pilko teksti chunkeihin päällekkäisyydellä.
 * @param {string} text
 * @returns {string[]}
 */
function chunkText(text) {
    const normalized = text.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
    if (normalized.length <= CHUNK_TARGET_CHARS) return [normalized];

    const paragraphs = normalized.split('\n\n').filter(p => p.trim().length > 0);
    const chunks = [];
    let current = '';

    for (const para of paragraphs) {
        if (current.length + para.length + 2 <= CHUNK_TARGET_CHARS) {
            current += (current ? '\n\n' : '') + para;
        } else {
            if (current) {
                chunks.push(current);
                // Ota overlap edellisestä chunkista
                const words = current.split(' ');
                const overlapWords = words.slice(-Math.floor(CHUNK_OVERLAP_CHARS / 5));
                current = overlapWords.join(' ') + '\n\n' + para;
            } else {
                // Yksittäinen pitkä paragraph — pilko lauseittain
                const sentences = para.match(/[^.!?]+[.!?]+/g) || [para];
                for (const sentence of sentences) {
                    if (current.length + sentence.length <= CHUNK_TARGET_CHARS) {
                        current += (current ? ' ' : '') + sentence.trim();
                    } else {
                        if (current) chunks.push(current);
                        current = sentence.trim();
                    }
                }
            }
        }
    }
    if (current.trim()) chunks.push(current.trim());
    return chunks.filter(c => c.length >= 50);
}

/**
 * Poimi teksti HTML-sivulta cheerio:lla.
 */
function extractTextFromHtml(html, baseUrl) {
    const $ = cheerio.load(html);
    $('script, style, nav, footer, header, noscript, iframe, svg').remove();
    const title = $('title').text().trim();
    const body  = $('main, article, .content, #content, body').first().text()
        || $('body').text();
    const cleaned = body.replace(/\s+/g, ' ').trim();
    return title ? `${title}\n\n${cleaned}` : cleaned;
}

/**
 * Kerää kaikki sivun sisäiset linkit.
 */
function extractLinks($, baseUrl) {
    const base = new URL(baseUrl);
    const links = new Set();
    $('a[href]').each((_, el) => {
        try {
            const href = $(el).attr('href');
            const url  = new URL(href, baseUrl);
            // Vain sama domain, ei ankkureita, ei tiedostoja
            if (url.hostname === base.hostname && !url.hash && url.pathname !== base.pathname) {
                url.hash = '';
                links.add(url.href);
            }
        } catch (_) {}
    });
    return [...links];
}

/**
 * Parsii PDF-tiedoston Bufferin tekstiksi.
 * @param {Buffer} buffer
 * @returns {Promise<string>}
 */
async function parsePdf(buffer) {
    const pdfParse = require('pdf-parse');
    const data = await pdfParse(buffer);
    return data.text || '';
}

/**
 * Crawlaa URL rekursiivisesti ja palauttaa {url, text} -parit.
 * @param {string} startUrl
 * @param {Object} opts  - { maxPages, maxDepth, maxCharsPerPage }
 * @returns {Promise<Array<{url, text}>>}
 */
async function crawlUrl(startUrl, opts = {}) {
    const maxPages      = opts.maxPages      || 50;
    const maxDepth      = opts.maxDepth      || 2;
    const maxCharsPerPage = opts.maxCharsPerPage || 20000;

    const visited = new Set();
    const results = [];
    const queue   = [{ url: startUrl, depth: 0 }];

    while (queue.length > 0 && results.length < maxPages) {
        const { url, depth } = queue.shift();
        if (visited.has(url)) continue;
        visited.add(url);

        try {
            const res = await axios.get(url, {
                timeout: 10000,
                headers: { 'User-Agent': 'PopupManagerBot/1.0' },
                maxContentLength: 2 * 1024 * 1024   // max 2MB per sivu
            });
            const contentType = res.headers['content-type'] || '';
            if (!contentType.includes('text/html')) continue;

            const $ = cheerio.load(res.data);
            const text = extractTextFromHtml(res.data, url).slice(0, maxCharsPerPage);
            if (text.length >= 100) {
                results.push({ url, text });
            }

            if (depth < maxDepth) {
                const links = extractLinks($, url);
                for (const link of links) {
                    if (!visited.has(link)) {
                        queue.push({ url: link, depth: depth + 1 });
                    }
                }
            }
        } catch (err) {
            // Sivua ei saatu — ohitetaan hiljaa
        }
    }

    return results;
}

module.exports = { chunkText, parsePdf, crawlUrl, extractTextFromHtml };
