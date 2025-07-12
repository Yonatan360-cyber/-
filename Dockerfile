FROM node:20

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# התקנת yt-dlp
RUN curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp \
    && chmod a+rx /usr/local/bin/yt-dlp

# התקנת ffmpeg
RUN apt-get update && apt-get install -y ffmpeg

EXPOSE 3000

CMD ["node", "server.js"]
