
// api/comments.js

export default async function handler(req, res) {
    const { chapterUrl } = req.query;
    if (!chapterUrl) {
        return res.status(400).json({ error: "Missing chapterUrl" });
    }

    try {
        // 1. Fetch chapter HTML
        const pageRes = await fetch(chapterUrl, {
            headers: {
                "User-Agent": "Mozilla/5.0"
            }
        });
        const html = await pageRes.text();

        // 2. Find Next.js data JSON URL
        const nextDataMatch = html.match(/"\/_next\/data\/[^"]+\.json"/);
        if (!nextDataMatch) {
            throw new Error("Could not find _next/data JSON");
        }

        const nextDataUrl = "https://asuracomic.net" +
            nextDataMatch[0].replace(/"/g, "");

        // 3. Fetch Next.js JSON
        const dataRes = await fetch(nextDataUrl, {
            headers: { "User-Agent": "Mozilla/5.0" }
        });
        const nextData = await dataRes.json();

        // 4. Extract chapter ID (this path is stable)
        const chapterId =
            nextData?.pageProps?.chapter?.id ||
            nextData?.pageProps?.data?.chapter?.id;

        if (!chapterId) {
            throw new Error("Chapter ID not found");
        }

        // 5. Fetch comments from backend
        const commentsRes = await fetch(
            `https://gg.asuracomic.net/api/comments?chapter_id=${chapterId}&page=1`,
            {
                headers: {
                    "User-Agent": "Mozilla/5.0",
                    "Referer": chapterUrl
                }
            }
        );

        const commentsJson = await commentsRes.json();

        // 6. Normalize output
        const comments = (commentsJson?.data || []).map(c => ({
            user: c.user?.name || "Anonymous",
            text: c.body
        }));

        res.status(200).json(comments.slice(0, 10));

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
            }
