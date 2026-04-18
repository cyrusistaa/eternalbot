const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('izin')
        .setDescription('Aktiflik izni talebinde bulunur.')
        .addIntegerOption(opt => opt.setName('gün').setDescription('Kaç gün?').setRequired(true))
        .addStringOption(opt => opt.setName('sebep').setDescription('Neden?').setRequired(true)),
    async execute(interaction) {
        const KANAL_ID = "1478506502842220657"; // İzin Log ID
        const gun = interaction.options.getInteger('gün');
        const sebep = interaction.options.getString('sebep');
        
        const embed = new EmbedBuilder()
            .setAuthor({ name: 'İzin Talebi', iconURL: interaction.user.displayAvatarURL() })
            .addFields(
                { name: 'Kullanıcı', value: `${interaction.user}`, inline: true },
                { name: 'Süre', value: `${gun} Gün`, inline: true },
                { name: 'Sebep', value: `\`\`\`${sebep}\`\`\`` }
            )
            .setColor('#3498db')
            .setTimestamp();

        const kanal = interaction.client.channels.cache.get(KANAL_ID);
        if (kanal) {
            await kanal.send({ content: "@everyone", embeds: [embed] });
            await interaction.reply({ content: '✅ Talebin iletildi.', ephemeral: true });
        } else {
            await interaction.reply({ content: '❌ İzin kanalı bulunamadı!', ephemeral: true });
        }
    }
};
