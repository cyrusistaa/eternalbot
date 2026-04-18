const {
    ChannelType,
    PermissionFlagsBits,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder
} = require('discord.js');

const config = require('../config.json');

module.exports = {
    name: 'interactionCreate',
    async execute(interaction) { // 'client' yerine 'interaction' gelir çünkü event budur

        // Sadece buton etkileşimlerini kontrol et
        if (!interaction.isButton()) return;

        // 🎫 TICKET OLUŞTURMA (Buton ID: create_ticket)
        if (interaction.customId === 'create_ticket' || interaction.customId === 'ticket_ac') {

            const existing = interaction.guild.channels.cache.find(
                c => c.name === `ticket-${interaction.user.username.toLowerCase()}`
            );

            if (existing) {
                return interaction.reply({
                    content: '❌ Zaten açık bir ticketın var!',
                    ephemeral: true
                });
            }

            try {
                const channel = await interaction.guild.channels.create({
                    name: `ticket-${interaction.user.username}`,
                    type: ChannelType.GuildText,
                    parent: config.TICKET_KATEGORI_ID,
                    permissionOverwrites: [
                        {
                            id: interaction.guild.id,
                            deny: [PermissionFlagsBits.ViewChannel],
                        },
                        {
                            id: interaction.user.id,
                            allow: [
                                PermissionFlagsBits.ViewChannel,
                                PermissionFlagsBits.SendMessages,
                                PermissionFlagsBits.ReadMessageHistory
                            ],
                        },
                        {
                            id: config.TICKET_YETKILI_ROL,
                            allow: [
                                PermissionFlagsBits.ViewChannel,
                                PermissionFlagsBits.SendMessages,
                                PermissionFlagsBits.ReadMessageHistory
                            ],
                        },
                    ],
                });

                const embed = new EmbedBuilder()
                    .setColor('#00b0f4')
                    .setTitle('🎫 Yeni Destek Talebi')
                    .setDescription(`👤 Kullanıcı: <@${interaction.user.id}>\n🆔 ID: ${interaction.user.id}\n\nYetkililer en kısa sürede ilgilenecek.`)
                    .setFooter({ text: 'Eternal Family Ticket Sistemi' })
                    .setTimestamp();

                const closeRow = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId('close_ticket')
                        .setLabel('🔒 Ticket Kapat')
                        .setStyle(ButtonStyle.Danger)
                );

                await channel.send({
                    content: `<@&${config.TICKET_YETKILI_ROL}> | ${interaction.user}`,
                    embeds: [embed],
                    components: [closeRow]
                });

                await interaction.reply({
                    content: `✅ Ticket açıldı: ${channel}`,
                    ephemeral: true
                });

                // 📜 LOG GÖNDERME
                const logChannel = interaction.guild.channels.cache.get(config.TICKET_LOG);
                if (logChannel) {
                    const logEmbed = new EmbedBuilder()
                        .setColor('Green')
                        .setTitle('🎫 Ticket Açıldı')
                        .addFields(
                            { name: 'Kullanıcı', value: `<@${interaction.user.id}>`, inline: true },
                            { name: 'Kanal', value: `${channel.name}`, inline: true }
                        )
                        .setTimestamp();
                    logChannel.send({ embeds: [logEmbed] });
                }

            } catch (error) {
                console.error('Ticket Hatası:', error);
                if (!interaction.replied) {
                    await interaction.reply({ content: '❌ Ticket oluşturulurken bir hata oluştu. Kategori ID veya izinleri kontrol edin.', ephemeral: true });
                }
            }
        }

        // 🔒 TICKET KAPATMA (Buton ID: close_ticket)
        if (interaction.customId === 'close_ticket') {
            try {
                const logChannel = interaction.guild.channels.cache.get(config.TICKET_LOG);

                if (logChannel) {
                    const closeLogEmbed = new EmbedBuilder()
                        .setColor('Red')
                        .setTitle('🔒 Ticket Kapatıldı')
                        .addFields(
                            { name: 'Kapatan', value: `<@${interaction.user.id}>`, inline: true },
                            { name: 'Kanal', value: `${interaction.channel.name}`, inline: true }
                        )
                        .setTimestamp();
                    logChannel.send({ embeds: [closeLogEmbed] });
                }

                await interaction.reply({ content: 'Ticket 2 saniye içinde kapatılıyor...' });

                setTimeout(() => {
                    interaction.channel.delete().catch(() => {});
                }, 2000);
            } catch (error) {
                console.error('Kapatma Hatası:', error);
            }
        }
    }
};
