export default async function handler(req, res) {
    const { chapterUrl } = req.query;
    if (!chapterUrl) return res.status(400).json({ error: "Missing URL" });

    try {
        const response = await fetch(chapterUrl, {
            headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" }
        });

        const html = await response.text();

        // Extract the JSON from <script id="__NEXT_DATA__">...</script>
        const nextDataMatch = html.match(
            /<script id="__NEXT_DATA__" type="application\/json">(.+?)<\/script>/
        );

        if (!nextDataMatch) {
            return res.status(404).json({ error: "Could not find __NEXT_DATA__ JSON" });
        }

        const jsonData = JSON.parse(nextDataMatch[1]);

        // Navigate to the comments array in the JSON (site-dependent path)
        // Adjust these keys based on actual JSON structure
        const commentsRaw =
            jsonData?.props?.pageProps?.initialData?.comments || [];

        if (!commentsRaw.length) {
            return res.status(404).json({ error: "No comments found" });
        }

        // Clean up the comment body from HTML entities/tags
        function decodeHtml(str) {
            return str
                .replace(/&amp;/g, '&')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&quot;/g, '"')
                .replace(/&#039;/g, "'")
                .replace(/<[^>]+>/g, '') // remove remaining HTML tags
                .trim();
        }

        const comments = commentsRaw.map(c => ({
            user: c.user.name,
            text: decodeHtml(c.body)
        }));

        // Return first 10 unique comments
        const uniqueComments = [];
        const seen = new Set();

        for (const comment of comments) {
            const key = `${comment.user}:${comment.text}`;
            if (!seen.has(key)) {
                seen.add(key);
                uniqueComments.push(comment);
                if (uniqueComments.length >= 10) break;
            }
        }

        res.status(200).json(uniqueComments);

    } catch (e) {
        res.status(500).json({ error: e.message });
    }
}
