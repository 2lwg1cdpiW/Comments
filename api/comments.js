// api/comments.js
export default async function handler(req, res) {
    const { chapterUrl } = req.query;

    if (!chapterUrl) return res.status(400).json({ error: "No URL" });

    try {
        const response = await fetch(chapterUrl, {
            headers: { 
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            }
        });
        const html = await response.text();

        // 1. Find all the "Next.js" data chunks in the script tags
        // This is where the comments are hidden in your asura.txt file
        const dataChunks = html.match(/self\.__next_f\.push\((\[.*?\])\)/g);
        
        if (!dataChunks) throw new Error("Could not find the data layer in HTML");

        // 2. Combine all chunks into one big string to search
        const fullDataDump = dataChunks.join("");

        // 3. Use a scraper regex to find the comments inside the JSON-in-JS string
        // We look for the pattern: "body":"...", "user":{"name":"..."}
        // This avoids calling the API and pulls it straight from the page source
        const commentRegex = /\\"body\\":\\"(.*?)\\",\\"user\\":\{\\"id\\":\d+,\\"name\\":\\"(.*?)\\"/g;
        
        let matches;
        const scrapedComments = [];

        while ((matches = commentRegex.exec(fullDataDump)) !== null) {
            scrapedComments.push({
                text: matches[1].replace(/\\n/g, '').replace(/\\"/g, '"'), // Clean the text
                user: matches[2]
            });
        }

        if (scrapedComments.length === 0) {
            throw new Error("Scraper found the page but no comments were in the source.");
        }

        // Return only the first 10 as you requested
        res.status(200).json(scrapedComments.slice(0, 10));

    } catch (e) {
        res.status(500).json({ error: e.message });
    }
}
