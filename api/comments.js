// api/comments.js
export default async function handler(req, res) {
    const { chapterUrl } = req.query;

    try {
        // 1. Fetch the page to find the internal ID (Scrape phase)
        const response = await fetch(chapterUrl, {
            headers: { "User-Agent": "Mozilla/5.0" }
        });
        const html = await response.text();

        // 2. Locate the Chapter ID in that mess of code you sent
        // It's usually near the "chapter": {"id": 27562 ...} part
        const idMatch = html.match(/"chapter"\s*:\s*{\s*"id"\s*:\s*(\d+)/) || 
                        html.match(/"chapterId"\s*:\s*"([a-f0-9-]{36})"/);
        
        if (!idMatch) throw new Error("Could not find ID in source code.");
        const internalId = idMatch[1];

        // 3. Now hit the comment endpoint (API phase)
        // This is the only way to get the data now that they hidden it from HTML
        const commentRes = await fetch(`https://gg.asuracomic.net/api/chapters/${internalId}/comments?page=1`, {
            headers: {
                "Referer": "https://asuracomic.net/",
                "User-Agent": "Mozilla/5.0",
                "Host": "gg.asuracomic.net"
            }
        });

        const data = await commentRes.json();

        // 4. Return clean data so you don't have to worry about their tracking
        const clean = (data.data || []).map(c => ({
            user: c.user.name,
            comment: c.body.replace(/<\/?[^>]+(>|$)/g, "") // Strip HTML tags
        }));

        res.status(200).json(clean);

    } catch (e) {
        res.status(500).json({ error: "Scraper Blocked: " + e.message });
    }
}
