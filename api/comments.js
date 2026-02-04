export default async function handler(req, res) {
    const { chapterUrl } = req.query;
    if (!chapterUrl) return res.status(400).json({ error: "Missing URL" });

    try {
        const response = await fetch(chapterUrl, {
            headers: { "User-Agent": "Mozilla/5.0" }
        });
        const html = await response.text();

        // Step 1: Extract the JSON-like comment block
        // Pattern: looks like {"id":..., "body":"...", "user":{...}, ...}
        const jsonMatch = html.match(
            /(\{\\?"id\\?":\d+,\\?"body\\?":".*?\\?",\\?"user\\?":\{.*?\}\})/gs
        );

        if (!jsonMatch) {
            return res.status(404).json({ error: "No comment JSON found" });
        }

        // Step 2: Convert escaped unicode / HTML entities
        function decode(str) {
            return str
                .replace(/\\u003c/g, '<')
                .replace(/\\u003e/g, '>')
                .replace(/\\u0026#039;/g, "'")
                .replace(/\\u0026amp;/g, '&')
                .replace(/<[^>]+>/g, '') // strip HTML tags
                .trim();
        }

        // Step 3: Parse JSON and map comments
        const comments = jsonMatch.map(raw => {
            // fix escaped quotes
            const fixed = raw.replace(/\\"/g, '"');
            let obj;
            try {
                obj = JSON.parse(fixed);
            } catch {
                return null;
            }
            if (!obj || !obj.body || !obj.user?.name) return null;

            return {
                user: obj.user.name,
                text: decode(obj.body)
            };
        }).filter(Boolean);

        if (!comments.length) return res.status(404).json({ error: "No comments parsed" });

        // Return first 10 unique comments
        const uniqueComments = [];
        const seen = new Set();
        for (const c of comments) {
            const key = `${c.user}:${c.text}`;
            if (!seen.has(key)) {
                seen.add(key);
                uniqueComments.push(c);
                if (uniqueComments.length >= 10) break;
            }
        }

        res.status(200).json(uniqueComments);

    } catch (e) {
        res.status(500).json({ error: e.message });
    }
}
