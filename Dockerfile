FROM node:20-slim

# Dependências do Chrome
RUN apt-get update \
    && apt-get install -y wget gnupg ca-certificates \
    && mkdir -p /usr/share/keyrings \
    && wget -q -O - https://dl.google.com/linux/linux_signing_key.pub \
        | gpg --dearmor -o /usr/share/keyrings/googlechrome-linux-keyring.gpg \
    && echo "deb [arch=amd64 signed-by=/usr/share/keyrings/googlechrome-linux-keyring.gpg] https://dl.google.com/linux/chrome/deb/ stable main" \
        > /etc/apt/sources.list.d/google.list \
    && apt-get update \
    && apt-get install -y google-chrome-stable \
       fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf \
       libxss1 libasound2 libatk1.0-0 libatk-bridge2.0-0 libgtk-3-0 libgbm1 libnss3 \
       libx11-xcb1 libxcomposite1 libxdamage1 libxrandr2 libxcb1 libxtst6 \
       --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable

RUN npm install

COPY . .

RUN npm run build

EXPOSE 10000

CMD ["npm", "start"]
