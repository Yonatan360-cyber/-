const express = require("express");
const cors = require("cors");
const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

const YT_DLP_PATH = "yt-dlp";
const FFMPEG_PATH = "ffmpeg";

app.get("/ping", (req, res) => {
  res.send("pong");
});

app.get("/download", (req, res) => {
  const videoId = req.query.videoId;
  const format = req.query.format || "mp4";
  const subs = req.query.subs;
  const quality = req.query.quality;

  if (!videoId) return res.json({ error: "Missing videoId" });

  const outputTemplate = `%(title)s.%(ext)s`;

  let command = `${YT_DLP_PATH} -f bestaudio`;
  if (format === "mp3") {
    command = `${YT_DLP_PATH} -x --audio-format mp3 --embed-thumbnail --add-metadata`;
  } else if (format === "mp4") {
    command = `${YT_DLP_PATH} -f bestvideo[ext=mp4]+bestaudio[ext=m4a]/mp4`;
  } else {
    command = `${YT_DLP_PATH} -f bestvideo+bestaudio --merge-output-format ${format}`;
  }

  if (subs) {
    command += ` --write-subs --sub-lang ${subs} --convert-subs srt`;
  }

  if (quality) {
    command += ` -S "height:${quality}"`;
  }

  command += ` --ffmpeg-location ${FFMPEG_PATH} -o "${outputTemplate}" "https://www.youtube.com/watch?v=${videoId}"`;

  console.log("Running command:", command);

  exec(command, (error, stdout, stderr) => {
    console.log(stdout);
    console.error(stderr);

    if (error) {
      console.error(error);
      return res.json({ error: "Download failed" });
    }

    // חפש את הקובץ שהורד
    fs.readdir(".", (err, files) => {
      if (err) return res.json({ error: "Cannot list files" });

      const file = files.find(f => f.endsWith(`.${format}`) || f.endsWith(".mp3"));
      if (!file) return res.json({ error: "File not found" });

      const filePath = path.resolve(file);
      res.json({ url: `${req.protocol}://${req.get("host")}/files/${encodeURIComponent(file)}` });
    });
  });
});

// שרת קבצים להורדה
app.use("/files", express.static("."));

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
