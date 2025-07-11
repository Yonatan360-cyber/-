const express = require('express');
const { exec } = require('child_process');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3000;
const ffmpegPath = __dirname;

app.use(cors());

app.get('/download', (req, res) => {
  const { videoId, format, subs, playlistId } = req.query;

  let url;
  if (playlistId) {
    url = `https://www.youtube.com/playlist?list=${playlistId}`;
  } else {
    url = `https://www.youtube.com/watch?v=${videoId}`;
  }

  let output = '%(title)s.%(ext)s';
  let cmd;

  if (playlistId) {
    cmd = `yt-dlp -i --yes-playlist -f ${format} --ffmpeg-location "${ffmpegPath}" -o "${output}" ${url}`;
  } else if (format === 'mp3') {
    cmd = `yt-dlp -f bestaudio --extract-audio --audio-format mp3 --audio-quality 0 --embed-thumbnail --add-metadata --ffmpeg-location "${ffmpegPath}" -o "${output}" ${url}`;
  } else if (format === 'mp4') {
    cmd = `yt-dlp -f bestvideo[ext=mp4]+bestaudio[ext=m4a]/mp4 --ffmpeg-location "${ffmpegPath}" -o "${output}" ${url}`;
    if (subs && subs !== 'none') {
      cmd += ` --write-auto-sub --sub-lang ${subs} --convert-subs srt`;
    }
  } else {
    cmd = `yt-dlp -f bestvideo+bestaudio --merge-output-format ${format} --ffmpeg-location "${ffmpegPath}" -o "${output}" ${url}`;
  }

  exec(cmd, (e, stdout, stderr) => {
    console.log(stdout);
    console.error(stderr);
    const match = stdout.match(/Destination:\s(.+)/);
    if (e || !match) {
      return res.status(500).json({ error: stderr || 'Download failed' });
    }
    const file = path.basename(match[1].trim());
    res.json({ url: `${req.protocol}://${req.get('host')}/files/${encodeURIComponent(file)}` });
  });
});

app.use('/files', express.static(path.join(__dirname)));

app.listen(port, () => console.log(`✅ Server running on port ${port}`));