module.exports = async (client, db, config, interaction) => {
    try {
        if (!interaction.isStringSelectMenu()) return;

        const reasonModal = {
            customId: 'ticket_reason',
            title: 'Raison du Ticket',
            components: [{
                type: 1,
                components: [{
                    type: 4,
                    custom_id: 'reason',
                    label: "» Raison de votre Ticket",
                    style: 2,
                    placeholder: "Expliquez brièvement la raison de votre demande.",
                    required: true
                }]
            }]
        };

        const ticketConfig = {
            category: db.get(`ticketcategory_${interaction.guild.id}`),
            categoryGap: db.get(`ticketcategorygap_${interaction.guild.id}`),
            categoryOwner: db.get(`ticketcategoryowner_${interaction.guild.id}`),
            roles: {
                gs: db.get(`gsrole_${interaction.guild.id}`),
                gap: db.get(`gaprole_${interaction.guild.id}`),
                owner: db.get(`ownerrole_${interaction.guild.id}`)
            }
        };

        const existingChannel = interaction.guild.channels.cache.find(c => c.topic === interaction.user.id);

        if (interaction.customId === "del") {
            switch (interaction.values[0]) {
                case 'delete':
                    await DeleteTicket(interaction, db, client);
                    break;
                case 'addUser':
                    await AddUser(interaction, client);
                    break;
                case 'claim':
                    await ClaimTicket(interaction, db, ticketConfig, client);
                    break;
                default:
                    break;
            }
            return;
        }

        if (interaction.customId === "select") {
            if (existingChannel) {
                return interaction.reply({
                    embeds: [{ description: 'Vous avez déjà un ticket ouvert sur le serveur.', color: 0x2E3136 }],
                    ephemeral: true
                });
            }

            const selectedConfig = TicketConfig(interaction.values[0], ticketConfig);
            if (!selectedConfig) return;

            await interaction.showModal(reasonModal);

            try {
                const submittedModal = await interaction.awaitModalSubmit({
                    time: 0,
                    filter: i => i.customId === 'ticket_reason' && i.user.id === interaction.user.id
                });

                const reason = submittedModal.fields.getTextInputValue('reason');
                const channel = await CreationTicket(interaction, selectedConfig, reason);

                await submittedModal.reply({
                    embeds: [{ title: "Ticket Créé !", description: `Votre nouveau ticket a été créé dans <#${channel.id}>.`, color: 0x00ff00 }],
                    components: [{ type: 1, components: [{ type: 2, label: "🎫 Clique Ici", style: 5, url: `https://discord.com/channels/${interaction.guild.id}/${channel.id}` }] }],
                    ephemeral: true
                });
            } catch (error) {
                console.error(error);
            }
        }
    } catch (error) {
        client.error(error);
    }
};

async function DeleteTicket(interaction, db, client) {
    const claimedBy = db.get(`ticketClaimedBy_${interaction.channel.id}`);
    client.info(`${interaction.user.tag} (${interaction.user.id}) => Delete Ticket`)
    if (!interaction.channel.topic) {
        return interaction.reply({ content: "Ce n'est pas un salon de ticket.", ephemeral: true });
    }

    if (claimedBy) {
        await NoteStaff(interaction, claimedBy, db);
    } else {
        await interaction.channel.delete();
    }
}

async function ClaimTicket(interaction, db, ticketConfig, client) {
    client.info(`${interaction.user.tag} (${interaction.user.id}) => Claim Ticket`)
    const claimedBy = db.get(`ticketClaimed_${interaction.channel.id}`);
    
    if (claimedBy) {
        return interaction.reply({ content: 'Ce ticket est déjà réclamé.', ephemeral: true });
    }

    const memberRoles = interaction.member.roles.cache.map(role => role.id);

    if (
        !memberRoles.includes(ticketConfig.roles.gap) &&
        !memberRoles.includes(ticketConfig.roles.gs) &&
        !memberRoles.includes(ticketConfig.roles.owner)
    ) {
        return interaction.reply({ content: "Vous n'avez pas les permissions nécessaires pour réclamer un ticket.", ephemeral: true });
    }

    if (!interaction.channel.topic) {
        return interaction.reply({ content: "Ce n'est pas un salon de ticket.", ephemeral: true });
    }

    db.set(`ticketClaimedBy_${interaction.channel.id}`, interaction.user.id);
    db.set(`ticketClaimed_${interaction.channel.id}`, true);
    db.add(`ticketsClaimed_${interaction.user.id}`, 1);

    await interaction.channel.permissionOverwrites.edit(interaction.user.id, { ViewChannel: true });
    await interaction.channel.permissionOverwrites.edit(ticketConfig.roles.gap, { ViewChannel: false });
    await interaction.channel.permissionOverwrites.edit(ticketConfig.roles.gs, { ViewChannel: false });
    await interaction.channel.permissionOverwrites.edit(ticketConfig.roles.owner, { ViewChannel: false });

    await interaction.reply({
        content: `Le ticket est maintenant réclamé par ${interaction.user}.`,
        ephemeral: false
    });
}


async function AddUser(interaction, client) {
    client.info(`${interaction.user.tag} (${interaction.user.id}) => Ajout d'un utilisateur`)
    await interaction.reply({
        content: 'Mentionnez l\'utilisateur ou fournissez son ID à ajouter au ticket.',
        ephemeral: true
    });
    const filter = m => m.author.id === interaction.user.id;
    const collected = await interaction.channel.awaitMessages({ filter, max: 1, time: 60000 });

    if (collected.size > 0) {
        const messageContent = collected.first().content;
        const userToAdd = collected.first().mentions.users.first() || await interaction.guild.members.fetch(messageContent).catch(() => null);
        if (!userToAdd) {
            return interaction.followUp({ content: "Utilisateur introuvable. Assurez-vous de mentionner l'utilisateur ou de fournir un ID valide.", ephemeral: true });
        }
        await interaction.channel.permissionOverwrites.create(userToAdd.id, {
            ViewChannel: true,
            SendMessages: true
        });

        return interaction.followUp({
            content: `Utilisateur ${userToAdd} ajouté au ticket.`,
            ephemeral: true
        });
    } else {
        return interaction.followUp({
            content: 'Aucun utilisateur mentionné ou ID fourni, opération annulée.',
            ephemeral: true
        });
    }
}

async function NoteStaff(interaction, client, claimedBy, db) {
    client.info(`${interaction.user.tag} (${interaction.user.id}) => Note Staff`)
    const ratingRow = {
        type: 1,
        components: [{
            type: 3,
            custom_id: 'rate_staff',
            placeholder: 'Évaluez le service',
            options: Array.from({ length: 5 }, (_, i) => ({
                label: '⭐'.repeat(i + 1),
                description: `${i + 1} étoile${i > 0 ? 's' : ''}`,
                value: `${i + 1}`
            }))
        }]
    };

    const embed = {
        title: 'Évaluation du service',
        description: 'Veuillez évaluer le service reçu de 1 à 5 étoiles.',
        color: 0x00ff00
    };

    await interaction.reply({ embeds: [embed], components: [ratingRow], ephemeral: true });

    const filter = i => i.customId === 'rate_staff' && i.user.id === interaction.user.id;
    const collector = interaction.channel.createMessageComponentCollector({ filter, time: 60000, max: 1 });

    collector.on('collect', async i => {
        const rating = parseInt(i.values[0], 10);
        const userRatingsKey = `ratings_${claimedBy}`;
        const totalRatingsKey = `totalRatings_${claimedBy}`;
        db.set(userRatingsKey, (db.get(userRatingsKey) || 0) + rating);
        db.set(totalRatingsKey, (db.get(totalRatingsKey) || 0) + 1);

        await i.update({ content: 'Merci pour votre évaluation !', components: [], ephemeral: true });
        await interaction.channel.delete();
    });

    collector.on('end', async collected => {
        if (collected.size === 0) {
            await interaction.editReply({ content: 'Temps écoulé pour l\'évaluation.', components: [], ephemeral: true });
            await interaction.channel.delete();
        }
    });
}

function TicketConfig(selection, config) {
    switch (selection) {
        case "gestionstaff":
            return { category: config.category, role: config.roles.gs, name: 'Gestion Staff', icon: '🧧' };
        case "gestionabus":
            return { category: config.categoryGap, role: config.roles.gap, name: 'Gestion Abus', icon: '🛡️' };
        case "owner":
            return { category: config.categoryOwner, role: config.roles.owner, name: 'Owner', icon: '👑' };
        default:
            return null;
    }
}

async function CreationTicket(interaction, config, reason) {
    const row = {
        type: 1,
        components: [{
            type: 3,
            custom_id: "del",
            placeholder: "Sélectionner pour supprimer ou réclamer le ticket !",
            options: [
                { label: '🗑️ Fermer', description: 'Supprime le salon', value: 'delete' },
                { label: '➕ Ajout', description: 'Ajoute un utilisateur au ticket existant', value: 'addUser' },
                { label: '🔒 Claim', description: 'Réclame le ticket pour le support', value: 'claim' }
            ]
        }]
    };

    const channel = await interaction.guild.channels.create({
        name: `${config.icon}・${interaction.user.username}`,
        type: 0,
        topic: `${interaction.user.id}`,
        parent: config.category,
        permissionOverwrites: [
            { id: interaction.user.id, allow: ['ViewChannel', 'SendMessages']},
            { id: interaction.guild.id, deny: ['ViewChannel'] },
            { id: config.role, allow: ['ViewChannel', 'SendMessages'] }
        ]
    });

    const embed = {
        author: { name: config.name },
        description: `Un membre de l'équipe **${config.name}** va vous répondre très rapidement.\nPour fermer le ticket, appuie sur le bouton ci-dessous !\n Raison \`\`\` ${reason} \`\`\` `,
        color: 0x2E3136,
        footer: { text: `${new Date(interaction.createdTimestamp).toLocaleString()}` }
    };

    await channel.send({
        embeds: [embed],
        content: `Salut ${interaction.user} ! 👋🏽 \n\n Un <@&${config.role}> va te répondre dans les minutes qui suivent !`,
        components: [row]
    });

    return channel;
}
