import express from "express";
import { exec } from "child_process";
import cors from "cors";
import path from "path";
import fs from "fs";

const app = express();
app.use(cors());
const PORT = process.env.PORT || 10000;

// נתיב בדיקה בסיסי
app.get("/", (req, res) => {
  res.send("✅ YouTube Downloader Server is running!");
});

// בדיקת תקינות
app.get("/ping", (req, res) => {
  res.json({ status: "ok" });
});

// הורדה
app.get("/download", (req, res) => {
  const { videoId, playlistId, format = "mp4", subs, quality } = req.query;
  if (!videoId && !playlistId) {
    return res.status(400).json({ error: "Missing videoId or playlistId" });
  }

  const target = videoId
    ? `https://www.youtube.com/watch?v=${videoId}`
    : `https://www.youtube.com/playlist?list=${playlistId}`;

  const output = `/tmp/video.${format}`;
  let cmd = `yt-dlp -o "${output}" -f "best" "${target}"`;

  if (subs) cmd += ` --write-auto-sub --sub-lang ${subs} --convert-subs srt`;
  if (quality) cmd += ` -f "bestvideo[height<=${quality}]+bestaudio/best"`;

  exec(cmd, (error) => {
    if (error) {
      console.error("❌ yt-dlp error:", error);
      return res.status(500).json({ error: error.message });
    }

    const fileUrl = `${req.protocol}://${req.get("host")}/file/${path.basename(output)}`;
    res.json({ url: fileUrl });
  });
});

// שליחה של קובץ להורדה
app.get("/file/:filename", (req, res) => {
  const file = `/tmp/${req.params.filename}`;
  if (!fs.existsSync(file)) {
    return res.status(404).send("File not found");
  }
  res.download(file);
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
