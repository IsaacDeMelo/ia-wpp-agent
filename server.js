
/**
 * ZAPBOT AI MANAGER - SERVER (Production Ready)
 */

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;
import { GoogleGenAI } from '@google/genai';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

// Configuração de Caminhos (ES Modules)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- CONFIGURAÇÃO ---
const app = express();
app.use(cors());

// Servir arquivos estáticos do React (Frontend buildado)
app.use(express.static(path.join(__dirname, 'dist')));

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST"]
  }
});

// Inicializa Gemini AI
const apiKey = process.env.API_KEY;
let ai = null;
if (apiKey) {
    ai = new GoogleGenAI({ apiKey: apiKey });
} else {
    console.error("ERRO CRÍTICO: API_KEY não encontrada no .env");
}

// --- ESTADO DO BOT ---
let botConfig = {
    model: 'gemini-2.5-flash',
    temperature: 0.7,
    systemInstruction: 'Você é um assistente útil. Responda de forma curta e natural.',
    isActive: true,
    allowedNumbers: [], // Lista de strings (apenas números, sem @c.us)
    onlyAllowed: true   // Padrão TRUE para segurança em testes pessoais
};

// Dados Voláteis (Em memória - Zera ao reiniciar)
// Para produção real, salvar em JSON ou Banco de Dados
let botStats = {
    messagesToday: 0,
    uniqueUsers: new Set(),
    tokenUsageEst: 0,
    startTime: Date.now(),
    hourlyTraffic: Array(24).fill(0) // Índice 0-23 representa as horas
};

// --- ESTRATÉGIAS ANTI-BAN ---
// 1. Delays aleatórios para simular humanidade
const randomDelay = (min, max) => Math.floor(Math.random() * (max - min + 1) + min);

// 2. Queue de processamento para evitar envio em massa instantâneo
const messageQueue = [];
let isProcessingQueue = false;

const processQueue = async () => {
    if (isProcessingQueue || messageQueue.length === 0) return;
    isProcessingQueue = true;

    const { message, chat, responseText } = messageQueue.shift();

    try {
        // Simula tempo de leitura e "pensamento" (2 a 5 segundos)
        await new Promise(r => setTimeout(r, randomDelay(2000, 5000)));

        // Envia estado "Digitando..."
        await chat.sendStateTyping();

        // Simula tempo de digitação baseado no tamanho da resposta (mínimo 3s)
        const typingTime = Math.min(responseText.length * 50, 10000); 
        await new Promise(r => setTimeout(r, Math.max(3000, typingTime)));

        // Responde
        await message.reply(responseText);
        
        // Limpa estado de digitação
        await chat.clearState();
        
        console.log('Mensagem enviada com sucesso (Anti-Ban aplicado).');
    } catch (error) {
        console.error('Erro ao enviar mensagem da fila:', error);
    } finally {
        isProcessingQueue = false;
        // Pequeno intervalo entre mensagens da fila
        setTimeout(processQueue, randomDelay(1000, 3000));
    }
};

const broadcastStats = () => {
    const currentHour = new Date().getHours();
    
    // Formata dados para o gráfico (últimas 6 horas + atual)
    // Se quiser mostrar o dia todo, basta mapear o array inteiro
    const graphData = botStats.hourlyTraffic.map((count, hour) => ({
        hour: `${hour.toString().padStart(2, '0')}:00`,
        count
    })).filter((_, i) => {
        // Mostrar apenas horas relevantes (ex: atual e passadas, ou fixas)
        // Aqui vou mandar todas as 24h, o front filtra ou mostra tudo
        return true; 
    });

    const payload = {
        messagesToday: botStats.messagesToday,
        activeUsers: botStats.uniqueUsers.size,
        costEstimate: (botStats.tokenUsageEst / 1000000) * 0.10, // Estimativa chula de custo
        hourlyTraffic: graphData,
        uptime: Math.floor((Date.now() - botStats.startTime) / 1000)
    };

    io.emit('dashboard_update', payload);
};


// --- WHATSAPP CLIENT ---
const whatsappClient = new Client({
    authStrategy: new LocalAuth({
        dataPath: './.wwebjs_auth'
    }),
    puppeteer: {
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-gpu'
        ],
        headless: true
    }
});

// --- EVENTOS DO WHATSAPP ---

whatsappClient.on('qr', (qr) => {
    console.log('NOVO QR CODE GERADO');
    io.emit('qr_code', qr);
    io.emit('bot_status', 'QR_READY');
});

whatsappClient.on('ready', () => {
    console.log('WhatsApp Client is ready!');
    io.emit('bot_status', 'CONNECTED');
    io.emit('log', { level: 'success', message: 'Cliente WhatsApp conectado e pronto.', timestamp: new Date() });
});

whatsappClient.on('authenticated', () => {
    console.log('Authenticated');
    io.emit('bot_status', 'CONNECTING');
    io.emit('log', { level: 'info', message: 'Sessão autenticada. Carregando...', timestamp: new Date() });
});

whatsappClient.on('auth_failure', (msg) => {
    io.emit('bot_status', 'DISCONNECTED');
    io.emit('log', { level: 'error', message: `Falha na autenticação: ${msg}`, timestamp: new Date() });
});

whatsappClient.on('disconnected', (reason) => {
    io.emit('bot_status', 'DISCONNECTED');
    io.emit('log', { level: 'warning', message: `Bot desconectado: ${reason}`, timestamp: new Date() });
});

// --- LÓGICA DE MENSAGENS E IA ---

whatsappClient.on('message', async (message) => {
    // 1. Ignorar grupos e Status/Stories
    if (message.from.includes('@g.us') || message.isStatus) return;
    
    // 2. Extrair número puro (ex: 551199998888)
    const senderNumber = message.from.replace('@c.us', '');

    // 3. Verificar Configuração de IA
    if (!botConfig.isActive) return;

    // 4. Lógica de Whitelist (Segurança para conta pessoal)
    if (botConfig.onlyAllowed) {
        if (!botConfig.allowedNumbers.includes(senderNumber)) {
            console.log(`Mensagem ignorada de ${senderNumber} (Não está na whitelist)`);
            return;
        }
    }

    // --- Processamento Real ---
    
    // Atualiza Stats
    const currentHour = new Date().getHours();
    botStats.messagesToday++;
    botStats.uniqueUsers.add(senderNumber);
    botStats.hourlyTraffic[currentHour]++;
    
    // Emite atualização imediata para o dashboard parecer "vivo"
    broadcastStats();

    const contact = await message.getContact();
    const senderName = contact.pushname || contact.name || senderNumber;
    
    console.log(`Msg de ${senderName}: ${message.body}`);
    io.emit('log', { level: 'info', message: `Mensagem de ${senderName}: "${message.body.substring(0, 30)}..."`, timestamp: new Date() });

    if (!ai) return;

    try {
        const chat = await message.getChat();
        
        // Gera resposta com Gemini
        const modelId = botConfig.model;
        
        const response = await ai.models.generateContent({
            model: modelId,
            contents: message.body,
            config: {
                systemInstruction: botConfig.systemInstruction,
                temperature: botConfig.temperature,
            }
        });

        const replyText = response.text;
        
        // Contabiliza tokens (estimativa grosseira: 1 char = 0.25 tokens)
        botStats.tokenUsageEst += (message.body.length + replyText.length) * 0.25;

        if (replyText) {
            // Adiciona à fila de processamento (ANTI-BAN)
            messageQueue.push({ message, chat, responseText: replyText });
            processQueue(); 
        }

    } catch (error) {
        console.error('Erro ao processar IA:', error);
        io.emit('log', { level: 'error', message: `Erro IA: ${error.message}`, timestamp: new Date() });
    }
});


// --- SOCKET.IO ---

io.on('connection', (socket) => {
    console.log('Frontend conectado:', socket.id);
    
    socket.emit('config_initial', botConfig);
    broadcastStats(); // Envia stats atuais
    
    if (whatsappClient.info) {
        socket.emit('bot_status', 'CONNECTED');
    }

    socket.on('update_config', (newConfig) => {
        botConfig = { ...botConfig, ...newConfig };
        console.log('Config atualizada. Whitelist:', botConfig.allowedNumbers);
        io.emit('log', { level: 'info', message: 'Configurações atualizadas.', timestamp: new Date() });
    });

    socket.on('restart_client', async () => {
        io.emit('log', { level: 'warning', message: 'Reiniciando WhatsApp...', timestamp: new Date() });
        try {
            await whatsappClient.destroy();
        } catch(e) {}
        whatsappClient.initialize();
    });

    socket.on('disconnect_session', async () => {
        try {
            await whatsappClient.logout();
        } catch(e) {}
        io.emit('bot_status', 'DISCONNECTED');
    });
});

// Inicializa
whatsappClient.initialize();

// Rota "catch-all" para o React Router
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`Server rodando na porta ${PORT}`);
});
