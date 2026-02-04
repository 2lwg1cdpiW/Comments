export default async function handler(req, res) {
    let { chapterUrl } = req.query;
    if (!chapterUrl) return res.status(400).json({ error: "No URL" });

    try {
        // 1. Convert standard URL to the Next.js Data URL
        // From: .../chapter/1 
        // To: .../chapter/1.rsc (This is where the REAL data lives)
        const rscUrl = chapterUrl.endsWith('/') ? 
                       chapterUrl.slice(0, -1) + ".rsc" : 
                       chapterUrl + ".rsc";

        const response = await fetch(rscUrl, {
            headers: { 
                "User-Agent": "Mozilla/5.0",
                "RSC": "1" // This header tells Asura "Give me data, not HTML"
            }
        });
        
        const rawData = await response.text();

        // 2. The Regex to find Chapter-Specific comments
        // Real chapter comments are stored differently than the sidebar ones
        // They usually follow a pattern with a "body" tag after the chapter ID
        const commentRegex = /\\"body\\":\\"(.*?)\\",\\"user\\":\{.*?\\"name\\":\\"(.*?)\\"/g;
        
        const results = [];
        let match;
        
        while ((match = commentRegex.exec(rawData)) !== null) {
            let text = match[1]
                .replace(/\\u003cp\\u003e/g, '')
                .replace(/\\u003c\/p\\u003e/g, '')
                .replace(/\\n/g, '')
                .replace(/\\"/g, '"');

            // Filter out the "Global" comments (like Jim24) by checking length or content
            // Chapter comments are usually longer or don't have the "span data-type" junk
            if (!text.includes("data-type=")) {
                results.push({
                    user: match[2],
                    comment: text
                });
            }
        }

        res.status(200).json(results.slice(0, 10));

    } catch (e) {
        res.status(500).json({ error: "RSC Scraping Failed: " + e.message });
    }
}
