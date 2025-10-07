# שלב בסיסי מבוסס Node.js
FROM node:20

# התקן ffmpeg וכלים נדרשים
RUN apt-get update \
    && apt-get install -y ffmpeg curl

# התקן yt-dlp
RUN curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp \
    -o /usr/local/bin/yt-dlp \
    && chmod a+rx /usr/local/bin/yt-dlp

# צור תיקיית עבודה לאפליקציה
WORKDIR /app

# העתק package.json וקבצי נעילה (אם קיימים)
COPY package*.json ./

# התקן תלויות Node.js
RUN npm install

# העתק את כל שאר הקבצים
COPY . .

# הגדר פורט
EXPOSE 3000

# הרץ את השרת
CMD ["npm", "start"]
