import chromium from "chrome-aws-lambda";
import puppeteer from "puppeteer-core";

export default async function handler(req, res) {
    const { chapterUrl } = req.query;
    if (!chapterUrl) return res.status(400).json({ error: "Missing URL" });

    try {
        const browser = await puppeteer.launch({
            args: chromium.args,
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath,
            headless: chromium.headless,
        });

        const page = await browser.newPage();
        await page.goto(chapterUrl, { waitUntil: "networkidle2" });

        await page.waitForSelector(".comment-item", { timeout: 5000 });

        const comments = await page.$$eval(".comment-item", els =>
            els.map(e => ({
                user: e.querySelector(".username")?.innerText || "Unknown",
                text: e.querySelector(".comment-body")?.innerText || ""
            }))
        );

        await browser.close();

        res.status(200).json(comments.slice(0, 10));
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
}
