const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

app.get('/ping', (req, res) => {
  res.json({ status: "ok" });
});

app.get('/download', (req, res) => {
  const videoId = req.query.videoId;
  const playlistId = req.query.playlistId;
  const format = req.query.format || 'mp4';
  const subs = req.query.subs;
  const quality = req.query.quality;

  if (!videoId && !playlistId) {
    return res.status(400).json({ error: 'Missing videoId or playlistId' });
  }

  let url;
  if (videoId) {
    url = `https://www.youtube.com/watch?v=${videoId}`;
  } else {
    url = `https://www.youtube.com/playlist?list=${playlistId}`;
  }

  const outName = `download.${format}`;
  let cmd = `yt-dlp -o "${outName}"`;

  if (format === 'mp3') {
    cmd += ' -x --audio-format mp3 --audio-quality 0 --embed-thumbnail --add-metadata';
  } else if (subs) {
    cmd += ` --write-sub --sub-lang ${subs} --convert-subs srt`;
  }

  if (quality) {
    cmd += ` -f "bestvideo[height<=${quality}]+bestaudio/best[height<=${quality}]"`;
  } else {
    cmd += ' -f best';
  }

  cmd += ` "${url}"`;

  console.log(`Running: ${cmd}`);

  exec(cmd, { cwd: path.resolve(__dirname) }, (error, stdout, stderr) => {
    console.log(stdout);
    console.log(stderr);
    if (error) {
      console.error(error);
      return res.status(500).json({ error: error.message });
    }

    const filePath = path.join(__dirname, outName);

    if (fs.existsSync(filePath)) {
      res.download(filePath, (err) => {
        if (err) {
          console.error(err);
        }
        fs.unlinkSync(filePath);
      });
    } else {
      res.status(500).json({ error: "Download failed" });
    }
  });
});

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
