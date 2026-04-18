const { Client, GatewayIntentBits, Collection, Partials, ActivityType, REST, Routes } = require('discord.js');
const { joinVoiceChannel, getVoiceConnection } = require('@discordjs/voice');
const fs = require('fs');
const path = require('path');
const config = require('./config.json');

const GUILD_ID = process.env.GUILD_ID || config.GUILD_ID;

// 1. BOTU TÜM İZİNLERLE BAŞLAT
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildPresences
    ],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction, Partials.User, Partials.GuildMember]
});

client.commands = new Collection();

// 2. KOMUT VE EVENTLERİ OTOMATİK YÜKLE
const folders = ['commands', 'events'];
folders.forEach(folder => {
    const folderPath = path.join(__dirname, folder);
    if (fs.existsSync(folderPath)) {
        const files = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));
        for (const file of files) {
            const item = require(path.join(folderPath, file));
            if (folder === 'commands') {
                client.commands.set(item.data.name, item);
            } else {
                client.on(item.name, async (...args) => {
                    try {
                        await item.execute(...args, client);
                    } catch (err) {
                        console.error(`âŒ [EVENT] ${item.name} hata verdi:`, err);
                    }
                });
            }
        }
    }
});

// 3. SESE GİRİŞ FONKSİYONU (KULAKLIK KAPALI - MİKROFON AÇIK)
const seseGir = async () => {
    try {
        const guild = await client.guilds.fetch(GUILD_ID).catch(() => null);
        if (!guild) return console.log("❌ [HATA] Sunucu ID bulunamadı.");

        const channelId = process.env.BOT_SES_KANAL_ID || config.BOT_SES_KANAL_ID;
        const channel = guild.channels.cache.get(channelId);
        if (!channel) return console.log("❌ [HATA] Ses kanalı ID bulunamadı.");

        // Eski bağlantıyı temizle (Mikrofon takılı kalmasın)
        const oldConnection = getVoiceConnection(guild.id);
        if (oldConnection) oldConnection.destroy();

        joinVoiceChannel({
            channelId: channel.id,
            guildId: guild.id,
            adapterCreator: guild.voiceAdapterCreator,
            selfDeaf: true,  // Kulaklık KAPALI (Kırmızı Çizgili)
            selfMute: false, // Mikrofon AÇIK (Çizgi Olmayacak)
            group: client.user.id
        });

        console.log(`🔊 [SES] "${channel.name}" kanalına giriş yapıldı. (Kulaklık: Kapalı, Mik: Açık)`);
    } catch (err) {
        console.error("❌ [SES HATASI] Giriş yapılamadı:", err.message);
    }
};

// 4. BOT HAZIR OLDUĞUNDA YAPILACAKLAR
// SLASH KOMUTLARI DISCORD'A KAYDET (GUILD COMMANDS = aninda guncellenir)
const registerSlashCommands = async () => {
    if (!GUILD_ID) {
        console.log("âš ï¸ [KOMUT] GUILD_ID yok. Slash komutlar guild'a kaydedilemedi.");
        return;
    }

    const token = process.env.TOKEN || config.token;
    if (!token) {
        console.log("âš ï¸ [KOMUT] TOKEN yok. Slash komutlar kaydedilemedi.");
        return;
    }

    const commandsJson = client.commands.map(cmd => cmd.data.toJSON());
    const rest = new REST({ version: '10' }).setToken(token);

    try {
        await rest.put(Routes.applicationGuildCommands(client.user.id, GUILD_ID), { body: commandsJson });
        console.log(`âœ… [KOMUT] ${commandsJson.length} slash komut Discord'a kaydedildi. (Guild: ${GUILD_ID})`);
    } catch (err) {
        console.error("âŒ [KOMUT] Slash komut kayit hatasi:", err);
    }
};

client.once('ready', () => {
    console.log(`✅ ${client.user.tag} Aktif!`);
    
    // YAYINDA DURUMU (Developed By CyrusFix)
    client.user.setPresence({
        activities: [{ 
            name: `Cyrus ❤ Beyaz`, 
            type: ActivityType.Streaming, 
            url: "https://www.twitch.tv/cyrusfix" 
        }],
        status: 'dnd',
    });

    // 5 saniye bekle ve sese zıpla
    registerSlashCommands();

    setTimeout(seseGir, 5000);
});

// 5. SLASH KOMUT DİNLEYİCİ
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;
    const command = client.commands.get(interaction.commandName);
    if (!command) return;
    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        if (!interaction.replied) await interaction.reply({ content: 'Bir hata oluştu!', ephemeral: true });
    }
});

// 6. GİRİŞ (RAILWAY TOKEN DESTEĞİ)
const token = process.env.TOKEN || config.token;
if (!token) {
    console.error("âŒ [HATA] TOKEN bulunamadÄ±. Railway Variables'a TOKEN ekleyin.");
} else {
    client.login(token);
}
