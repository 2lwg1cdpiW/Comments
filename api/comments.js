
export default async function handler(req, res) {
    const { chapterUrl } = req.query;
    if (!chapterUrl) return res.status(400).json({ error: "Missing URL" });

    try {
        const response = await fetch(chapterUrl, {
            headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/121.0.0.0" }
        });
        const html = await response.text();

        // Extract script blocks
        const scriptData = [];
        const regex = /self\.__next_f\.push\(\[1,"(.*?)"\]\)/g;
        let match;
        
        while ((match = regex.exec(html)) !== null) {
            scriptData.push(match[1]);
        }

        // Combine all script data
        const fullContent = scriptData.join('');

        // The comments are in a specific pattern within the JSON
        // Look for the initialData structure with the comments array
        const commentDataMatch = fullContent.match(/"initialData":\s*\{[^}]*"data":\s*\[/);
        
        if (!commentDataMatch) {
            return res.status(404).json({ error: "Could not find comment data" });
        }

        // Find the start position of the comments array
        const startPos = commentDataMatch.index + commentDataMatch[0].length - 1;
        
        // Extract a large chunk that should contain all the comment data
        const chunk = fullContent.substring(startPos, startPos + 500000);
        
        // Properly decode unicode escapes
        function decodeUnicode(str) {
            return str.replace(/\\u([0-9a-fA-F]{4})/g, (match, hex) => 
                String.fromCharCode(parseInt(hex, 16))
            );
        }

        // Properly decode HTML entities
        function decodeHtml(str) {
            return str
                .replace(/&amp;/g, '&')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&quot;/g, '"')
                .replace(/&#039;/g, "'")
                .replace(/&#x27;/g, "'");
        }

        // Extract comments using a more sophisticated approach
        const comments = [];
        
        // Pattern to match comment objects in the JSON
        const commentPattern = /"body":"((?:[^"\\]|\\.)*)","user":\{"id":\d+,"name":"([^"]+)"/g;
        
        let cMatch;
        while ((cMatch = commentPattern.exec(chunk)) !== null) {
            let body = cMatch[1];
            const userName = cMatch[2];
            
            // Decode the body
            body = decodeUnicode(body);
            body = decodeHtml(body);
            
            // Remove HTML tags
            body = body
                .replace(/<p>/g, '')
                .replace(/<\/p>/g, '\n')
                .replace(/<em>/g, '')
                .replace(/<\/em>/g, '')
                .replace(/<strong>/g, '')
                .replace(/<\/strong>/g, '')
                .replace(/<span[^>]*>/g, '')
                .replace(/<\/span>/g, '')
                .replace(/<[^>]+>/g, '')
                .replace(/\n+/g, ' ')
                .trim();
            
            if (body && userName) {
                comments.push({
                    user: userName,
                    text: body
                });
            }
            
            // Stop after we have enough comments
            if (comments.length >= 50) break;
        }

        if (comments.length === 0) {
            return res.status(404).json({ error: "No comments found" });
        }

        // Return the first 10 unique comments
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
        res.status(500).json({ error: e.message, stack: e.stack });
    }
}
