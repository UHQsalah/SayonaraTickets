module.exports = {
    name: 'ticket',
    description: "Ouvre un ticket de support.",
    category: "mod",
    usage: 'ticket',
    go: async (client, db, config, interaction, args) => {
        try {
            const isOwner = db.get(`Owner_${interaction.guild.id}-${interaction.user.id}`) || config.owners.includes(interaction.user.id) || interaction.user.id === interaction.guild.ownerId;
            if (!isOwner) {
                return interaction.reply({
                    content: `\`❌\` *Vous n'avez pas les permissions pour exécuter cette commande*`,
                    ephemeral: true
                });
            }

            await interaction.deferReply();

            const row = {
                type: 1,
                components: [
                    {
                        type: 3,
                        custom_id: 'select',
                        placeholder: "Sélectionnez une catégorie pour ouvrir un ticket.",
                        options: [
                            {
                                label: 'Gestion Abus',
                                description: `Afin de vous plaindre d'un abus de la part d'un staff`,
                                emoji: `1076179985267703910`,
                                value: 'gestionabus',
                            },
                            {
                                label: 'Gestion Staff',
                                description: `Si vous souhaitez rejoindre l'equipe staff`,
                                emoji: `1076179672192262244`,
                                value: 'gestionstaff',
                            },
                            {
                                label: 'Owner',
                                description: 'Si vous souhaitez de parler à un owner',
                                emoji: `1076180002447573063`,
                                value: 'owner',
                            },
                            {
                                label: 'Annulé',
                                description: 'Réinitialiser votre choix',
                                emoji: `❌`,
                                value: 'cancel',
                            }
                        ]
                    }
                ]
            };

            await interaction.editReply({
                embeds: [{
                    title: 'Ouvrir un Ticket ?!',
                    description: 'Cliquez sur le menu déroulant et sélectionner la catégorie qui correspond à votre demande !',
                    color: 0x2E3136,
                    image: {
                        url: 'https://images-ext-1.discordapp.net/external/qTL_LnFv_YXqZPY7QGrh2FRvyl5FL7stKoMUDcE-DcU/https/images-ext-1.discordapp.net/external/jIkvsDPQTOj0UflHRMbmjL_tbJ-N2fxM2vJqXCB-LO4/https/i.pinimg.com/originals/4c/17/2d/4c172dbbad6d969caf0139f4c742f3b8.gif?width=375&height=175'
                    },
                    footer: { text: 'Sayonara Ticket' }
                }],
                components: [row]
            });

        } catch (error) {
            console.log('Une erreur est survenue lors de l\'exécution de la commande ticket :', error);
        }
    }
};
