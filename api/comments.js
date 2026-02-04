export default async function handler(req, res) {
    const { chapterUrl } = req.query;
    if (!chapterUrl) return res.status(400).json({ error: "Missing URL" });

    try {
        const response = await fetch(chapterUrl, {
            headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/121.0.0.0" }
        });
        const html = await response.text();

        // 1. KT LOGIC: Extract the raw script data between push( and )
        const scriptData = [];
        const regex = /self\.__next_f\.push\(\[1,"(.*?)"\]\)/g;
        let match;
        while ((match = regex.exec(html)) !== null) {
            scriptData.push(match[1]);
        }

        // 2. Combine and clean the escaped string (Exactly like StringBuilder in KT)
        const fullContent = scriptData.join('').replace(/\\n/g, '').replace(/\\"/g, '"');

        // 3. FIND COMMENTS: Now we search that giant string for the body and user name
        // Pattern: "body":"...", "user":{"name":"..."}
        const commentRegex = /"body":"(.*?)".*?"user":\{.*?"name":"(.*?)"/g;
        const comments = [];
        let cMatch;

        while ((cMatch = commentRegex.exec(fullContent)) !== null) {
            comments.push({
                user: cMatch[2],
                text: cMatch[1].replace(/<p>/g, '').replace(/<\/p>/g, '') // Strip tags
            });
        }

        if (comments.length === 0) {
            throw new Error("KT-Scraper found 0 comments in script blocks.");
        }

        res.status(200).json(comments.slice(0, 10));

    } catch (e) {
        res.status(500).json({ error: e.message });
    }
}
