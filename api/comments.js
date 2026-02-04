export default async function handler(req, res) {
    let { chapterUrl } = req.query;

    if (!chapterUrl) return res.status(400).json({ error: "No URL provided" });

    try {
        // 1. Fetch with a real browser User-Agent to avoid Cloudflare blocks
        const pageResponse = await fetch(chapterUrl, {
            headers: { 
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            }
        });

        if (!pageResponse.ok) throw new Error(`Page returned status ${pageResponse.status}. Double check the URL.`);
        
        const html = await pageResponse.text();

        // 2. Improved Regex: Looks for chapterId in the JSON payload more broadly
        // This looks for "chapterId":"..." or "id":"..." inside the Next.js data
        const idMatch = html.match(/"chapterId"\s*:\s*"(.*?)"/) || html.match(/"id"\s*:\s*"(.*?)"/);
        
        if (!idMatch) {
            // Log a snippet of the HTML to your Vercel console to see what changed
            console.log("HTML Sample:", html.substring(0, 500));
            throw new Error("Could not find internal Chapter ID. The chapter might be empty or restricted.");
        }

        const uuid = idMatch[1];

        // 3. Masked fetch to the comment API
        const commentResponse = await fetch(`https://gg.asuracomic.net/api/chapters/${uuid}/comments`, {
            headers: {
                "Referer": "https://asuracomic.net/",
                "User-Agent": "Mozilla/5.0",
                "Host": "gg.asuracomic.net"
            }
        });

        const data = await commentResponse.json();

        // 4. Return clean, privacy-focused data
        const comments = (data.data || []).map(c => ({
            user: c.user?.name || "Anonymous",
            text: c.body,
            date: c.created_at
        }));

        res.status(200).json({ uuid, count: comments.length, comments });

    } catch (e) {
        res.status(500).json({ error: e.message });
    }
}
