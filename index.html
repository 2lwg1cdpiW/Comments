<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Auto Asura Comments</title>
    <style>
        body { font-family: sans-serif; background: #121212; color: white; padding: 20px; }
        .input-group { margin-bottom: 20px; }
        input { width: 400px; padding: 10px; border-radius: 4px; border: 1px solid #444; background: #222; color: white; }
        button { padding: 10px 20px; background: #6366f1; color: white; border: none; border-radius: 4px; cursor: pointer; }
        .comment { background: #1e1e1e; padding: 15px; border-bottom: 1px solid #333; margin-top: 10px; }
        .user { color: #818cf8; font-weight: bold; }
    </style>
</head>
<body>
    <h1>Auto-Fetch Comments</h1>
    <div class="input-group">
        <input type="text" id="urlInput" placeholder="Paste Asura Chapter URL here...">
        <button onclick="fetchAuto()">Get Comments</button>
    </div>

    <div id="status"></div>
    <div id="results"></div>

    <script>
        async function fetchAuto() {
            const url = document.getElementById('urlInput').value;
            const resDiv = document.getElementById('results');
            const status = document.getElementById('status');
            
            status.innerText = "Searching for hidden ID and fetching comments...";
            resDiv.innerHTML = "";

            try {
                const response = await fetch(`/api/comments?chapterUrl=${encodeURIComponent(url)}`);
                const data = await response.json();

                if(data.error) throw new Error(data.error);

                status.innerText = `Found UUID: ${data.uuid} | Showing latest comments`;
                
                data.comments.slice(0, 10).forEach(c => {
                    const div = document.createElement('div');
                    div.className = 'comment';
                    div.innerHTML = `<span class="user">${c.user.name}:</span> <div>${c.body}</div>`;
                    resDiv.appendChild(div);
                });
            } catch (e) {
                status.innerText = "Error: " + e.message;
            }
        }
    </script>
</body>
</html>
