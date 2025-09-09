module.exports = {
    name: 'setrole',
    description: 'Définit le rôle pour la gestion des tickets.',
    type: 1,
    options: [
        {
            name: 'type',
            description: "Type de gestion pour lequel définir le rôle",
            type: 3, 
            required: true,
            choices: [
                { name: 'Gestion Staff', value: 'gestionstaff' },
                { name: 'Gestion Abus', value: 'gestionabus' },
                { name: 'Owner', value: 'owner' }
            ]
        },
        {
            name: 'role',
            description: "Le rôle à définir",
            type: 8,
            required: true
        }
    ],
    go: async (client, db, config, interaction, args) => {
        try {
            if (!db.get(`Owner_${interaction.guild.id}-${interaction.user.id}`) && 
                !config.owners.includes(interaction.user.id) && 
                interaction.user.id !== interaction.guild.ownerId) {
                return interaction.reply({ 
                    content: `\`❌\` *Vous n'avez pas les permissions pour exécuter cette commande*`, 
                    ephemeral: true 
                });
            }
            client.info(`${interaction.user.tag} (${interaction.user.id}) => /setrole`)

            const roleType = interaction.options.getString('type');
            const role = interaction.options.getRole('role');
            let dbKey;

            switch (roleType) {
                case 'gestionstaff':
                    dbKey = `gsrole_${interaction.guild.id}`;
                    break;
                case 'gestionabus':
                    dbKey = `gaprole_${interaction.guild.id}`;
                    break;
                case 'owner':
                    dbKey = `ownerrole_${interaction.guild.id}`;
                    break;
                default:
                    return interaction.reply({ 
                        content: 'Type de rôle invalide.', 
                        ephemeral: true 
                    });
            }

            db.set(dbKey, role.id);

            interaction.reply({
                content: `Le rôle pour ${roleType} a été défini sur ${role}.`,
                ephemeral: true
            });
        } catch (error) {
            client.error(error);
            interaction.reply({
                content: 'Une erreur est survenue lors du traitement de votre demande. Veuillez réessayer ultérieurement.',
                ephemeral: true
            });
        }
    }
};

