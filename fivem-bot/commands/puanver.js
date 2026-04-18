const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('puanver')
        .setDescription('Bir kullanıcıya puan ekler.')
        .addUserOption(option => option.setName('kullanici').setDescription('Puan verilecek kullanıcı').setRequired(true))
        .addIntegerOption(option => option.setName('miktar').setDescription('Eklenecek puan miktarı').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const user = interaction.options.getUser('kullanici');
        const miktar = interaction.options.getInteger('miktar');
        const dbPath = path.join(__dirname, '../database.json');

        try {
            let db = {};
            if (fs.existsSync(dbPath)) {
                db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
            }

            // Kullanıcı verisi yoksa yeni bir obje oluştur (Hepsinde aynı yapı olsun)
            if (!db[user.id]) {
                db[user.id] = { username: user.username, puan: 0, voiceTime: 0 };
            }

            // Eğer veri eski tipte (sadece sayı) ise, onu yeni yapıya (objeye) çevir
            if (typeof db[user.id] !== 'object') {
                const eskiPuan = db[user.id] || 0;
                db[user.id] = { username: user.username, puan: eskiPuan, voiceTime: 0 };
            }

            // Puanı ekle
            db[user.id].puan += miktar;
            db[user.id].username = user.username;

            fs.writeFileSync(dbPath, JSON.stringify(db, null, 4));

            const embed = new EmbedBuilder()
                .setTitle('✨ Puan Eklendi')
                .setColor('#2ecc71')
                .setDescription(`**${user.tag}** kullanıcısına \`${miktar}\` puan eklendi.`)
                .addFields({ name: '💰 Güncel Puan', value: `\`${db[user.id].puan}\`` })
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'Puan eklenirken bir hata oluştu.', ephemeral: true });
        }
    }
};
