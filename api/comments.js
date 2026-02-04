export default async function handler(req, res) {
    const { chapterUrl } = req.query;

    try {
        const response = await fetch(chapterUrl, {
            headers: { "User-Agent": "Mozilla/5.0" }
        });
        const html = await response.text();

        // 1. Find the "BAILOUT" section where the comments live
        // This is a rough extract of the JSON hidden in the script tags
        const scriptData = html.match(/self\.__next_f\.push\((\[1,.*?\])\)/g);
        
        if (!scriptData) throw new Error("Could not find the data layer on this page.");

        // 2. Clean and combine the fragments
        let fullData = scriptData.map(s => s.replace(/self\.__next_f\.push\(| \)$/g, '')).join('');

        // 3. Use Regex to find comment-like patterns (user names + bodies)
        // Since the JSON is escaped and fragmented, a direct JSON.parse often fails.
        // We look for the "body" and "name" keys specifically.
        const comments = [];
        const commentRegex = /\\"id\\":(\d+),.*?\\"body\\":\\"(.*?)\\",.*?\\"name\\":\\"(.*?)\\"/g;
        
        let match;
        while ((match = commentRegex.exec(fullData)) !== null) {
            comments.push({
                id: match[1],
                body: match[2].replace(/\\u003cp\\>|\\u003c\/p\\>/g, ''), // Clean HTML tags
                user: match[3]
            });
        }

        // 4. Return the data found directly in the HTML
        res.status(200).json({
            source: "HTML Scrape (No API)",
            count: comments.length,
            comments: comments
        });

    } catch (e) {
        res.status(500).json({ error: e.message });
    }
}
