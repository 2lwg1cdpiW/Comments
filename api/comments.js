export default async function handler(req, res) {
    const { chapterUrl } = req.query;
    if (!chapterUrl) return res.status(400).json({ error: "Missing URL" });

    try {
        const response = await fetch(chapterUrl, {
            headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/121.0.0" }
        });
        const html = await response.text();

        // Extract script data
        const scriptData = [];
        const regex = /self\.__next_f\.push\(\[1,"(.*?)"\]\)/g;
        let match;
        while ((match = regex.exec(html)) !== null) {
            scriptData.push(match[1]);
        }

        // Combine and unescape
        let fullContent = scriptData.join('');
        
        // Decode Unicode escapes first
        fullContent = fullContent.replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) => 
            String.fromCharCode(parseInt(hex, 16))
        );
        
        // Then clean other escapes
        fullContent = fullContent.replace(/\\n/g, '').replace(/\\"/g, '"').replace(/\\\\/g, '\\');

        // Look for the comments array structure
        // Pattern: Find sections that look like username followed by HTML content
        const commentRegex = /"body":"([^"]*(?:\\.[^"]*)*)","user":\{"name":"([^"]+)"/g;
        const comments = [];
        let cMatch;

        while ((cMatch = commentRegex.exec(fullContent)) !== null) {
            const bodyRaw = cMatch[1];
            const userName = cMatch[2];
            
            // Decode and clean the body HTML
            let bodyText = bodyRaw
                .replace(/<p>/g, '')
                .replace(/<\/p>/g, '\n')
                .replace(/<em>/g, '')
                .replace(/<\/em>/g, '')
                .replace(/<[^>]+>/g, '') // Remove any other HTML tags
                .replace(/&#039;/g, "'")
                .replace(/&amp;/g, '&')
                .trim();
            
            comments.push({
                user: userName,
                text: bodyText
            });
        }

        if (comments.length === 0) {
            throw new Error("No comments found in script blocks.");
        }

        res.status(200).json(comments.slice(0, 10));

    } catch (e) {
        res.status(500).json({ error: e.message });
    }
}
