const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { QuickDB } = require("quick.db");
const db = new QuickDB();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('gunluk')
        .setDescription('Günlük şans puanını topla.'),
    async execute(interaction) {
        const lastDaily = await db.get(`daily_${interaction.user.id}`);
        const cooldown = 86400000;

        if (lastDaily !== null && cooldown - (Date.now() - lastDaily) > 0) {
            const timeRem = cooldown - (Date.now() - lastDaily);
            const hours = Math.floor(timeRem / (1000 * 60 * 60));
            return interaction.reply({ content: `⌛ Sabırlı ol evlat! Tekrar denemek için **${hours} saat** beklemen gerek.`, ephemeral: true });
        }

        const randomPuan = Math.floor(Math.random() * 8) + 2; // 2 ile 10 arası puan
        await db.add(`puan_${interaction.user.id}`, randomPuan);
        await db.set(`daily_${interaction.user.id}`, Date.now());

        const embed = new EmbedBuilder()
            .setTitle('🎁 Günlük Bonus')
            .setDescription(`Bugün kasadan senin için **${randomPuan} Puan** çıktı!`)
            .setColor('#9b59b6')
            .setFooter({ text: 'Yarın tekrar gelmeyi unutma!' });

        await interaction.reply({ embeds: [embed] });
    }
};
