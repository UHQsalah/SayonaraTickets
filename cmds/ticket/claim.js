module.exports = {
    name: 'claim',
    description: 'Réclame un ticket.',
    go: async (client, db, config, interaction, args) => {
        try {
            const memberRoles = interaction.member.roles.cache.map(role => role.id);
            const gsRole = db.get(`gsrole_${interaction.guild.id}`);
            const gapRole = db.get(`gaprole_${interaction.guild.id}`);

            if (!gsRole || !gapRole) {
                return interaction.reply({ content: "Les rôles gsrole ou gaprole ne sont pas configurés.", ephemeral: true });
            }

            if (!memberRoles.includes(gsRole) && !memberRoles.includes(gapRole)) {
                return interaction.reply({ content: "Vous n'avez pas les permissions nécessaires pour réclamer un ticket.", ephemeral: true });
            }

            if (!interaction.channel.topic) {
                return interaction.reply({ content: "Ce n'est pas un salon de ticket.", ephemeral: true });
            }

            const userId = interaction.channel.topic;
            const memberToClaim = await interaction.guild.members.fetch(userId).catch(() => null);

            if (!memberToClaim) {
                return interaction.reply({ content: "Impossible de trouver l'utilisateur associé à ce ticket.", ephemeral: true });
            }

            const claimed = db.get(`ticketClaimed_${interaction.channel.id}`);
            if (claimed) {
                return interaction.reply({ content: "Ce ticket a déjà été réclamé.", ephemeral: true });
            }

            await interaction.channel.permissionOverwrites.edit(gsRole, { ViewChannel: false });
            await interaction.channel.permissionOverwrites.edit(gapRole, { ViewChannel: false });
            await interaction.channel.permissionOverwrites.edit(interaction.user.id, { ViewChannel: true });

            db.set(`ticketClaimed_${interaction.channel.id}`, true);
            db.set(`ticketClaimedBy_${interaction.channel.id}`, interaction.user.id); 

            
            db.add(`ticketsClaimed_${interaction.user.id}`, 1);

            const logsChannel = interaction.guild.channels.cache.get('1242067855487537163');
            if (logsChannel) {
                await logsChannel.send({
                    embeds: [{
                        description: `Le ticket dans ${interaction.channel} a été réclamé par ${interaction.user}`,
                        color: 0x00ff00
                    }]
                });
            }

            return interaction.reply({
                ephemeral: false,
                embeds: [{
                    description: `Le ticket dans ${interaction.channel} a été réclamé par ${interaction.user}`,
                    color: 0x00ff00
                }]
            });

        } catch (error) {
            console.log('Une erreur est survenue lors de l\'exécution de la commande /claim :', error);
            return interaction.reply({ content: "Une erreur s'est produite lors de la réclamation du ticket.", ephemeral: true });
        }
    },
};
