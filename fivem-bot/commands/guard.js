const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('../config.json'); // Ticket yetkili rol ID'sini buradan alacağız

module.exports = {
    data: new SlashCommandBuilder()
        .setName('guard')
        .setDescription('Beyaz listeyi yönetir.')
        // Artık yetkiyi Discord yerine kod içinde manuel kontrol edeceğiz
        .addSubcommand(sub => 
            sub.setName('ekle')
               .setDescription('Listeye yeni birini ekler.')
               .addUserOption(opt => opt.setName('kisi').setDescription('Eklenecek kişi').setRequired(true)))
        .addSubcommand(sub => 
            sub.setName('cikar')
               .setDescription('Listeden birini çıkarır.')
               .addUserOption(opt => opt.setName('kisi').setDescription('Çıkarılacak kişi').setRequired(true)))
        .addSubcommand(sub => 
            sub.setName('liste')
               .setDescription('Listeyi gösterir.')),
    
    async execute(interaction) {
        // --- YETKİ KONTROLÜ ---
        const yetkiliRolId = config.TICKET_YETKILI_ROL; // config.json'daki tam adı buraya yaz
        const hasRole = interaction.member.roles.cache.has(yetkiliRolId);
        const isAdmin = interaction.member.permissions.has(PermissionFlagsBits.Administrator);

        // Eğer kişi ne yönetici ne de ticket yetkilisi ise reddet
        if (!hasRole && !isAdmin) {
            return interaction.reply({ 
                content: '❌ Bu komutu kullanmak için gerekli yetkiye sahip değilsiniz.', 
                ephemeral: true 
            });
        }
        // ----------------------

        const guardsPath = path.join(__dirname, '../guards.json');
        
        // Dosya kontrolü ve oluşturma
        if (!fs.existsSync(guardsPath)) {
            fs.writeFileSync(guardsPath, JSON.stringify({ whitelist: [] }, null, 2));
        }
        
        let guardsData = JSON.parse(fs.readFileSync(guardsPath, 'utf8'));
        const sub = interaction.options.getSubcommand();
        const user = interaction.options.getUser('kisi');

        if (sub === 'ekle') {
            if (!guardsData.whitelist.includes(user.id)) {
                guardsData.whitelist.push(user.id);
                fs.writeFileSync(guardsPath, JSON.stringify(guardsData, null, 2));
                return interaction.reply(`✅ **${user.username}** artık bot ekleyebilir.`);
            }
            return interaction.reply({ content: 'Bu kişi zaten listede.', ephemeral: true });
        }

        if (sub === 'cikar') {
            if (!guardsData.whitelist.includes(user.id)) {
                return interaction.reply({ content: 'Bu kişi zaten listede yok.', ephemeral: true });
            }
            guardsData.whitelist = guardsData.whitelist.filter(id => id !== user.id);
            fs.writeFileSync(guardsPath, JSON.stringify(guardsData, null, 2));
            return interaction.reply(`❌ **${user.username}** listeden çıkarıldı.`);
        }

        if (sub === 'liste') {
            const list = guardsData.whitelist.length > 0 
                ? guardsData.whitelist.map(id => `<@${id}> (\`${id}\`)`).join('\n') 
                : 'Liste henüz boş.';

            const embed = new EmbedBuilder()
                .setTitle('🛡️ Guard Beyaz Liste')
                .setDescription(list)
                .setColor('#0099ff')
                .setFooter({ text: 'Eternal Family Koruma Sistemi' })
                .setTimestamp();

            return interaction.reply({ embeds: [embed] });
        }
    },
};
