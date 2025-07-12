const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.static('downloads'));

app.get('/download', async (req, res) => {
  const videoId = req.query.videoId;
  const playlistId = req.query.playlistId;
  const format = req.query.format || 'mp4';
  const subs = req.query.subs || null;
  const quality = req.query.quality || null;

  let url = '';

  if (playlistId) {
    url = `https://www.youtube.com/playlist?list=${playlistId}`;
  } else if (videoId) {
    url = `https://www.youtube.com/watch?v=${videoId}`;
  } else {
    return res.json({ error: 'Missing videoId or playlistId' });
  }

  try {
    const fileName = await downloadYoutube(url, format, subs, quality, playlistId);
    if (!fileName) {
      return res.json({ error: 'Download failed' });
    }
    res.json({
      url: `${req.protocol}://${req.get('host')}/${encodeURIComponent(fileName)}`
    });
  } catch (e) {
    console.error(e);
    res.json({ error: 'Download failed' });
  }
});

async function downloadYoutube(url, format, subs, quality, playlistId) {
  return new Promise((resolve, reject) => {
    const downloadDir = path.join(__dirname, 'downloads');
    if (!fs.existsSync(downloadDir)) {
      fs.mkdirSync(downloadDir);
    }

    let output = path.join('downloads', '%(title)s.%(ext)s');
    let cmd = `yt-dlp -o "${output}"`;

    if (subs) {
      cmd += ` --write-subs --write-auto-sub --sub-lang ${subs} --convert-subs srt`;
    }

    if (format === 'mp3') {
      cmd += ' -x --audio-format mp3 --audio-quality 0';
    } else if (format === 'mp4') {
      if (quality) {
        // לדוגמה: bestvideo[height<=720]+bestaudio
        cmd += ` -f "bestvideo[ext=mp4][height<=${quality}]+bestaudio[ext=m4a]/mp4"`;
      } else {
        cmd += ' -f bestvideo[ext=mp4]+bestaudio[ext=m4a]/mp4';
      }
    } else {
      cmd += ` -f bestvideo+bestaudio --merge-output-format ${format}`;
    }

    cmd += ` "${url}"`;

    console.log("========== yt-dlp COMMAND ==========");
    console.log(cmd);
    console.log("====================================");

    exec(cmd, { maxBuffer: 1024 * 1024 * 50 }, (error, stdout, stderr) => {
      console.log("STDOUT:", stdout);
      console.log("STDERR:", stderr);

      if (error) {
        console.error(error);
        return reject(error);
      }

      const match = stdout.match(/Destination:\s*(.+)/);
      if (match && match[1]) {
        const filePath = match[1].trim();
        const fileName = path.basename(filePath);
        resolve(fileName);
      } else {
        resolve(null);
      }
    });
  });
}

// מחיקה אוטומטית של קבצים ישנים
setInterval(() => {
  const dir = path.join(__dirname, 'downloads');
  if (fs.existsSync(dir)) {
    fs.readdirSync(dir).forEach(file => {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (Date.now() - stat.mtimeMs > 1000 * 60 * 60) {
        fs.unlinkSync(fullPath);
        console.log("🗑️ Deleted file:", fullPath);
      }
    });
  }
}, 60 * 60 * 1000);

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
