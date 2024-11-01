module.exports = {
    name: 'setcategorie',
    description: "Définit la catégorie pour les tickets",
    type: 1,
    options: [
        {
            name: 'type',
            description: "Type de ticket à configurer",
            type: 3,
            required: true,
            choices: [
                { name: 'Gestion Staff', value: 'gestionstaff' },
                { name: 'Gestion Abus', value: 'gestionabus' },
                { name: 'Owner', value: 'owner' }
            ]
        },
        {
            name: 'categorie',
            description: "Spécifie la nouvelle catégorie pour les tickets",
            type: 7,
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
            client.info(`${interaction.user.tag} (${interaction.user.id}) => /setcategorie`)

            const ticketType = interaction.options.getString('type');
            const newCategory = interaction.options.getChannel('categorie');
            let dbKey;

            switch (ticketType) {
                case 'gestionstaff':
                    dbKey = `ticketcategory_${interaction.guild.id}`;
                    break;
                case 'gestionabus':
                    dbKey = `ticketcategorygap_${interaction.guild.id}`;
                    break;
                case 'owner':
                    dbKey = `ticketcategoryowner_${interaction.guild.id}`;
                    break;
                default:
                    return interaction.reply({ 
                        content: 'Type de ticket invalide.', 
                        ephemeral: true 
                    });
            }

            db.set(dbKey, newCategory.id);

            interaction.reply({
                content: `La catégorie pour les tickets de type ${ticketType} a été définie sur ${newCategory.name}.`,
                ephemeral: true
            });
        } catch (error) {
            client.error(error);
            interaction.reply({
                content: 'Veuillez réessayer ultérieurement.',
                ephemeral: true
            });
        }
    }
};
