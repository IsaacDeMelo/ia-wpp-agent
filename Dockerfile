
# Instala dependências do sistema necessárias para rodar o Google Chrome
# O Puppeteer precisa dessas bibliotecas para funcionar em ambiente Linux (Render)
RUN apt-get update \
    && apt-get install -y wget gnupg \
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | gpg --dearmor -o /usr/share/keyrings/googlechrome-linux-keyring.gpg \
    && sh -c 'echo "deb [arch=amd64 signed-by=/usr/share/keyrings/googlechrome-linux-keyring.gpg] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
    && apt-get update \
    && apt-get install -y google-chrome-stable fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf libxss1 \
      --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Define o diretório de trabalho dentro do container
WORKDIR /app

# Copia os arquivos de configuração de pacotes
COPY package*.json ./

# Define variáveis de ambiente críticas
# Diz ao Puppeteer para NÃO baixar o Chromium (pois já instalamos o Chrome acima)
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
# Aponta para o local onde o Chrome foi instalado no Linux
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable

# Instala as dependências do projeto
RUN npm install

# Copia todo o restante do código fonte
COPY . .

# Compila o Frontend (React/Vite)
RUN npm run build

# Expõe a porta 10000 (Padrão do Render)
EXPOSE 10000

# Comando para iniciar a aplicação
CMD ["npm", "start"]
