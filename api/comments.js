export default async function handler(req, res) {
    const { chapterUrl } = req.query;
    if (!chapterUrl) return res.status(400).json({ error: "Missing URL" });

    try {
        // 1. Transform the URL to the Data Stream URL
        // Example: .../chapter/1 -> .../chapter/1.rsc
        const rscUrl = chapterUrl.replace(/\/$/, "") + ".rsc";

        const response = await fetch(rscUrl, {
            headers: { 
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/121.0.0.0",
                "RSC": "1", // Mandatory header for Next.js data
                "Accept": "*/*"
            }
        });

        const rawText = await response.text();

        // 2. SCRAPE THE DATA
        // In the RSC stream, comments look like this: \"body\":\"...\",\"user\":{\"name\":\"...\"
        const commentRegex = /\\"body\\":\\"(.*?)\\",\\"user\\":\{.*?\\"name\\":\\"(.*?)\\"/g;
        
        const results = [];
        let match;
        
        while ((match = commentRegex.exec(rawText)) !== null) {
            const body = match[1];
            const user = match[2];

            // Filter: Chapter comments usually don't have "data-type=\" inside them
            // This filters out the sidebar junk you saw earlier
            if (!body.includes("data-type=")) {
                results.push({
                    user: user,
                    text: body.replace(/\\u003cp\\u003e/g, '').replace(/\\u003c\/p\\u003e/g, '').replace(/\\"/g, '"')
                });
            }
        }

        if (results.length === 0) {
            throw new Error("Scraper couldn't find chapter-specific comments in the stream.");
        }

        // Return the first 10
        res.status(200).json(results.slice(0, 10));

    } catch (e) {
        res.status(500).json({ error: e.message });
    }
}
