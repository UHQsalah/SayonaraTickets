const { PermissionFlagsBits, ChannelType } = require('discord.js');

module.exports = async (client, db, config, interaction) => {
    try {
        if (!interaction.isStringSelectMenu()) return;

        const row = {
            type: 1,
            components: [
                {
                    type: 3,
                    custom_id: "del",
                    placeholder: "Sélectionner pour supprimer ou réclamer le ticket !",
                    options: [
                        {
                            label: '🗑️ Fermer',
                            description: 'Supprime le salon',
                            value: 'delete',
                        },
                        {
                            label: '➕ Ajout',
                            description: 'Ajoute un utilisateur au ticket existant',
                            value: 'addUser',
                        },
                        {
                            label: '🔒 Claim',
                            description: 'Réclame le ticket pour le support',
                            value: 'claim',
                        }
                    ]
                },
            ]
        };

        const category = db.get(`ticketcategory_${interaction.guild.id}`);
        const gs = db.get(`gsrole_${interaction.guild.id}`);
        const gap = db.get(`gaprole_${interaction.guild.id}`);
        
        const existingChannel = interaction.guild.channels.cache.find(c => c.topic == interaction.user.id);

        if (interaction.customId === "del") {
            if (interaction.values[0] === "delete") {
                if (!interaction.channel.topic) {
                    return interaction.reply({ content: "Ce n'est pas un salon de ticket.", ephemeral: true });
                }
    
                const claimedBy = db.get(`ticketClaimedBy_${interaction.channel.id}`);
    
                if (claimedBy && claimedBy === interaction.user.id) {
                    await interaction.channel.delete();
                    return;
                }
    
                if (claimedBy) {
                    const row = new ActionRowBuilder()
                        .addComponents(
                            new StringSelectMenuBuilder()
                                .setCustomId('rate_staff')
                                .setPlaceholder('Évaluez le service')
                                .addOptions([
                                    { label: '⭐', description: '1 étoile', value: '1' },
                                    { label: '⭐⭐', description: '2 étoiles', value: '2' },
                                    { label: '⭐⭐⭐', description: '3 étoiles', value: '3' },
                                    { label: '⭐⭐⭐⭐', description: '4 étoiles', value: '4' },
                                    { label: '⭐⭐⭐⭐⭐', description: '5 étoiles', value: '5' },
                                ]),
                        );
    
                    const embed = new EmbedBuilder()
                        .setTitle('Évaluation du service')
                        .setDescription('Veuillez évaluer le service reçu de 1 à 5 étoiles.')
                        .setColor(0x00ff00);
    
                    await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
    
                    const filter = i => i.customId === 'rate_staff' && i.user.id === interaction.user.id;
                    const collector = interaction.channel.createMessageComponentCollector({ filter, time: 60000, max: 1 });
    
                    collector.on('collect', async i => {
                        const rating = parseInt(i.values[0], 10);
                        const userRatingsKey = `ratings_${claimedBy}`;
                        const totalRatingsKey = `totalRatings_${claimedBy}`;
                        const userRatings = db.get(userRatingsKey) || 0;
                        const totalRatings = db.get(totalRatingsKey) || 0;
    
                        db.set(userRatingsKey, userRatings + rating);
                        db.set(totalRatingsKey, totalRatings + 1);
    
                        await i.update({ content: 'Merci pour votre évaluation !', components: [], ephemeral: true });
                        await interaction.channel.delete();
                    });
    
                    collector.on('end', async collected => {
                        if (collected.size === 0) {
                            await interaction.editReply({ content: 'Temps écoulé pour l\'évaluation.', components: [], ephemeral: true });
                            await interaction.channel.delete();
                        }
                    });
    
                } else {
                    await interaction.channel.delete();
                }
            } else if (interaction.values[0] === "addUser") {
                const mentionEmbed = {
                    description: 'Ajouter un utilisateur au ticket\nMentionnez l\'utilisateur que vous souhaitez ajouter au ticket.',
                    color: 0x2E3136
                };

                interaction.reply({ embeds: [mentionEmbed], ephemeral: true }).then(() => {
                    const filter = (m) => m.mentions.users.size > 0 && m.author.id === interaction.user.id;
                    const collector = interaction.channel.createMessageCollector({ filter, time: 30000 });

                    collector.on('collect', (m) => {
                        const mentionedUser = m.mentions.users.first();
                        const mentionedMember = interaction.guild.members.cache.get(mentionedUser.id);

                        if (mentionedMember) {
                            const ticketChannel = interaction.channel;

                            ticketChannel.permissionOverwrites.create(mentionedMember, {
                                ViewChannel: true,
                                SendMessages: true,
                                ReadMessageHistory: true,
                            });

                            interaction.followUp(`L'utilisateur ${mentionedUser} a été ajouté au ticket.`);
                        } else {
                            interaction.followUp('Utilisateur non trouvé.');
                        }

                        collector.stop();
                    });

                    collector.on('end', (collected, reason) => {
                        if (reason === 'time') {
                            interaction.followUp('La mention de l\'utilisateur a expiré.');
                        }
                    });
                });
            } else if (interaction.values[0] === "claim") {
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
            }
        }

        if (interaction.customId === "select") {
            if (existingChannel) {
                return interaction.reply({
                    embeds: [{
                        description: 'Vous avez déjà un ticket ouvert sur le serveur.',
                        color: 0x2E3136,
                    }],
                    ephemeral: true
                });
            }

            if (interaction.values[0] === "gestionstaff") {
                interaction.guild.channels.create({
                    name: `gs-${interaction.user.username}`,
                    type: ChannelType.GuildText,
                    topic: `${interaction.user.id}`,
                    parent: `${category}`,
                    permissionOverwrites: [
                        {
                            id: interaction.user.id,
                            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.SendMessages, PermissionFlagsBits.UseApplicationCommands],
                            deny: [PermissionFlagsBits.MentionEveryone]
                        },
                        {
                            id: interaction.guild.id,
                            deny: [PermissionFlagsBits.ViewChannel]
                        },
                        {
                            id: gs,
                            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.SendMessages, PermissionFlagsBits.UseApplicationCommands],
                            deny: [PermissionFlagsBits.MentionEveryone]
                        }
                    ]
                }).then((c) => {
                    const author = {
                        name: `Gestion Staff`,
                        icon_url: interaction.user.displayAvatarURL(),
                    };

                    const timestamp = interaction.createdTimestamp;

                    const staff = {
                        description: `Un membre de l'équipe des **Gestion Staff** va vous répondre très rapidement.\nPour fermer le ticket, appuie sur le bouton ci-dessous !`,
                        color: 0x2E3136,
                        author: author,
                        footer: {
                            text: `${interaction.user.tag} | ${new Date(timestamp).toLocaleString()}`,
                            icon_url: interaction.user.displayAvatarURL(),
                        },
                        thumbnail: {
                            url: interaction.user.displayAvatarURL(),
                        },
                    };
                    c.send({ embeds: [staff], content: `<@&${gs}> | ${interaction.user}`, components: [row] });
                    interaction.reply({
                        embeds: [{
                            title: "Ticket Créé !",
                            description: `Votre nouveau ticket a été créé dans <#${c.id}>.`,
                            color: 0x00ff00
                        }],
                        components: [{
                            type: 1,
                            components: [{
                                type: 2,
                                label: "🎫 Clique Ici",
                                style: 5,
                                url: `https://discord.com/channels/${interaction.guild.id}/${c.id}`
                            }]
                        }],
                        ephemeral: true
                    });
                });

            } else if (interaction.values[0] === "gestionabus") {
                interaction.guild.channels.create({
                    name: `gap-${interaction.user.username}`,
                    topic: `${interaction.user.id}`,
                    type: ChannelType.GuildText,
                    parent: `${category}`,
                    permissionOverwrites: [
                        {
                            id: interaction.guild.id,
                            deny: [PermissionFlagsBits.ViewChannel]
                        },
                        {
                            id: interaction.user.id,
                            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.SendMessages],
                            deny: [PermissionFlagsBits.MentionEveryone]
                        },
                        {
                            id: gap,
                            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.SendMessages],
                            deny: [PermissionFlagsBits.MentionEveryone]
                        }
                    ]
                }).then((c) => {
                    const author = {
                        name: `Gestion Abus`,
                        icon_url: interaction.user.displayAvatarURL(),
                    };

                    const timestamp = interaction.createdTimestamp;

                    const report = {
                        description: `Un membre de l'équipe des **Gestion Abus** va vous répondre très rapidement.\nPour fermer le ticket, appuie sur le selectmenu ci-dessous !`,
                        color: 0x2E3136,
                        author: author,
                        footer: {
                            text: `${interaction.user.tag} | ${new Date(timestamp).toLocaleString()}`,
                            icon_url: interaction.user.displayAvatarURL(),
                        },
                        thumbnail: {
                            url: interaction.user.displayAvatarURL(),
                        },
                    };
                    c.send({ embeds: [report], content: `<@&${gap}> | ${interaction.user}`, components: [row] });
                    interaction.reply({
                        embeds: [{
                            title: "Ticket Créé !",
                            description: `Votre nouveau ticket a été créé dans <#${c.id}>.`,
                            color: 0x00ff00
                        }],
                        components: [{
                            type: 1,
                            components: [{
                                type: 2,
                                label: "🎫 Clique Ici",
                                style: 5,
                                url: `https://discord.com/channels/${interaction.guild.id}/${c.id}`
                            }]
                        }],
                        ephemeral: true
                    });
                });

            } else if (interaction.values[0] === "cancel") {
                interaction.reply({
                    embeds: [{
                        title: "Choix Reset",
                    }],
                    ephemeral: true
                });
            } else if (interaction.values[0] === "owner") {
                interaction.guild.channels.create({
                    name: `owner-${interaction.user.username}`,
                    type: ChannelType.GuildText,
                    topic: `${interaction.user.id}`,
                    parent: `${category}`,
                    permissionOverwrites: [
                        {
                            id: interaction.guild.id,
                            deny: [PermissionFlagsBits.ViewChannel]
                        },
                        {
                            id: interaction.user.id,
                            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.SendMessages],
                            deny: [PermissionFlagsBits.MentionEveryone]
                        }
                    ]
                }).then((c) => {
                    const author = {
                        name: `Owners`,
                        icon_url: interaction.user.displayAvatarURL(),
                    };

                    const timestamp = interaction.createdTimestamp;

                    const embed = {
                        description: `Un membre de l'équipe des **Owners** va vous répondre très rapidement.\nPour fermer le ticket, appuie sur le selectmenu ci-dessous !`,
                        color: 0x2E3136,
                        author: author,
                        footer: {
                            text: `${interaction.user.tag} | ${new Date(timestamp).toLocaleString()}`,
                            icon_url: interaction.user.displayAvatarURL(),
                        },
                        thumbnail: {
                            url: interaction.user.displayAvatarURL(),
                        },
                    };
                    c.send({ embeds: [embed], content: `${interaction.user}`, components: [row] });
                    interaction.reply({
                        embeds: [{
                            title: "Ticket Créé !",
                            description: `Votre nouveau ticket a été créé dans <#${c.id}>.`,
                            color: 0x00ff00
                        }],
                        components: [{
                            type: 1,
                            components: [{
                                type: 2,
                                label: "🎫 Clique Ici",
                                style: 5,
                                url: `https://discord.com/channels/${interaction.guild.id}/${c.id}`
                            }]
                        }],
                        ephemeral: true
                    });
                });
            }
        }
    } catch (error) {
        console.log('Une erreur est survenue lors de l\'exécution de l\'événement interactionCreate :', error);
    }
};
