// api/comments.js
export default async function handler(req, res) {
    const { chapterUrl } = req.query;
    if (!chapterUrl) return res.status(400).json({ error: "No URL" });

    try {
        // 1. STEALTH FETCH: Using browser-identical headers to try and slip past Cloudflare
        const response = await fetch(chapterUrl, {
            headers: { 
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.5",
                "Alt-Used": "asuracomic.net",
                "Upgrade-Insecure-Requests": "1",
                "Sec-Fetch-Dest": "document",
                "Sec-Fetch-Mode": "navigate",
                "Sec-Fetch-Site": "none",
                "Sec-Fetch-User": "?1"
            }
        });

        const html = await response.text();

        // Check if we got hit by Cloudflare
        if (html.includes("cf-challenge") || html.includes("Cloudflare")) {
            throw new Error("Cloudflare blocked the scraper. Vercel's IP is flagged.");
        }

        // 2. THE SCRAPER REGEX: 
        // This looks for the body and user name inside the escaped Next.js string
        // We look for patterns like: \"body\":\"...\",\"user\":{\"name\":\"...\"
        const commentRegex = /\\"body\\":\\"(.*?)\\",\\"user\\":\{.*?\\"name\\":\\"(.*?)\\"/g;
        
        const scrapedComments = [];
        let match;

        while ((match = commentRegex.exec(html)) !== null) {
            // match[1] is the comment body, match[2] is the username
            let text = match[1]
                .replace(/\\n/g, '') // Remove newlines
                .replace(/\\u003cp\\u003e/g, '') // Remove <p>
                .replace(/\\u003c\/p\\u003e/g, '') // Remove </p>
                .replace(/\\"/g, '"'); // Fix quotes

            scrapedComments.push({
                user: match[2],
                text: text
            });
        }

        if (scrapedComments.length === 0) {
            // If regex failed, let's see if the page even loaded right
            if (html.length < 1000) throw new Error("Page loaded but is too short. Structure error.");
            throw new Error("No comments found in the source code.");
        }

        res.status(200).json(scrapedComments.slice(0, 10));

    } catch (e) {
        res.status(500).json({ error: e.message });
    }
}
