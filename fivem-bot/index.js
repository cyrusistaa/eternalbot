const { Client, GatewayIntentBits, Collection, Partials, ActivityType } = require('discord.js');
const { joinVoiceChannel, getVoiceConnection } = require('@discordjs/voice');
const fs = require('fs');
const path = require('path');
const config = require('./config.json');

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
                client.on(item.name, (...args) => item.execute(...args, client));
            }
        }
    }
});

// 3. SESE GİRİŞ FONKSİYONU (KULAKLIK KAPALI - MİKROFON AÇIK)
const seseGir = async () => {
    try {
        const guild = await client.guilds.fetch(config.GUILD_ID).catch(() => null);
        if (!guild) return console.log("❌ [HATA] Sunucu ID bulunamadı.");

        const channel = guild.channels.cache.get(config.BOT_SES_KANAL_ID);
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
client.once('ready', () => {
    console.log(`✅ ${client.user.tag} Aktif!`);
    
    // YAYINDA DURUMU (Developed By CyrusFix)
    client.user.setPresence({
        activities: [{ 
            name: `Developed By CyrusFix`, 
            type: ActivityType.Streaming, 
            url: "https://www.twitch.tv/cyrusfix" 
        }],
        status: 'dnd',
    });

    // 5 saniye bekle ve sese zıpla
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
client.login(token);
