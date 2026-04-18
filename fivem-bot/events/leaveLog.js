const { EmbedBuilder, Events } = require('discord.js');
const config = require('../config.json');

module.exports = {
    name: Events.GuildMemberRemove,
    async execute(member, client) {
        if (!member?.guild) return;

        const kanalId = config.GIRIS_CIKIS;
        if (!kanalId) return;

        const kanal = await client.channels.fetch(kanalId).catch(() => null);
        if (!kanal) return;

        const embed = new EmbedBuilder()
            .setAuthor({ name: 'Ayrılma', iconURL: member.user?.displayAvatarURL?.() })
            .setDescription(`📤 **${member.user?.tag || 'Bilinmiyor'}** aramızdan ayrıldı.`)
            .setColor('#e74c3c')
            .setTimestamp();

        kanal.send({ embeds: [embed] }).catch(() => {});
    }
};
