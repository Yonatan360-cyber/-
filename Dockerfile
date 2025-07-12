# שלב הבנייה
FROM node:20

# צור תיקייה לאפליקציה
WORKDIR /app

# העתק את כל הקבצים
COPY package*.json ./
RUN npm install
COPY . .

# פורט שהשרת מאזין עליו
EXPOSE 3000

CMD ["npm", "start"]
