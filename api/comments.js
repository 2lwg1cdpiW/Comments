// api/comments.js
export default async function handler(req, res) {
    const { chapterUrl } = req.query; // Full URL: e.g., https://asuracomic.net/series/.../chapter/1

    if (!chapterUrl) {
        return res.status(400).json({ error: "Missing chapter URL" });
    }

    try {
        // 1. Fetch the main chapter page to find the hidden UUID
        const pageResponse = await fetch(chapterUrl, {
            headers: { "User-Agent": "Mozilla/5.0" }
        });
        const html = await pageResponse.text();

        // 2. Extract the chapterId using Regex from the JSON blob
        const idMatch = html.match(/"chapterId":"(.*?)"/);
        if (!idMatch) throw new Error("Could not find internal Chapter ID on this page.");
        
        const uuid = idMatch[1];

        // 3. Now fetch the comments using that UUID
        const commentResponse = await fetch(`https://gg.asuracomic.net/api/chapters/${uuid}/comments?page=1`, {
            headers: {
                "Referer": "https://asuracomic.net/",
                "User-Agent": "Mozilla/5.0",
                "Host": "gg.asuracomic.net"
            }
        });

        const data = await commentResponse.json();
        res.status(200).json({
            uuid: uuid,
            comments: data.data || data
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
