// api/comments.js
export default async function handler(req, res) {
    const { chapterUrl } = req.query;

    try {
        const pageResponse = await fetch(chapterUrl, {
            headers: { 
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            }
        });
        const html = await pageResponse.text();

        // 1. IMPROVED EXTRACTION: This searches the entire Next.js JSON blob
        // It looks for any 36-character UUID following a "chapterId" or "id" key
        const uuidRegex = /"(?:chapterId|id)"\s*:\s*"([a-f0-9-]{36})"/i;
        const match = html.match(uuidRegex);
        
        if (!match) {
            throw new Error("Data layer not found. Asura might have updated their structure.");
        }

        const uuid = match[1];

        // 2. FETCH COMMENTS
        const commentResponse = await fetch(`https://gg.asuracomic.net/api/chapters/${uuid}/comments`, {
            headers: {
                "Referer": "https://asuracomic.net/",
                "User-Agent": "Mozilla/5.0",
                "Host": "gg.asuracomic.net"
            }
        });

        const data = await commentResponse.json();
        res.status(200).json(data);

    } catch (e) {
        res.status(500).json({ error: e.message });
    }
}

