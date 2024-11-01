const {
    Client,
    Collection,
    GatewayIntentBits,
    Partials,
    EmbedBuilder,
    ButtonBuilder,
    ActionRowBuilder,
    ModalBuilder,
    TextInputBuilder,
    StringSelectMenuBuilder,
    AttachmentBuilder
} = require("discord.js");
const consola = require('consola')
class client extends Client {
    constructor() {
        super({
            fetchAllMembers: true,
            restTimeOffset: 0,
            allowedMentions: {
                parse: ["roles", "users", "everyone"],
                repliedUser: false,
            },
            partials: Object.keys(Partials),
         intents: Object.keys(GatewayIntentBits)
        });
        this.config = require("./config.json");
        this.autoReconnect = true;
        this.cmds = new Collection();
        this.commandsType = {
            CHAT_INPUT: 1,
            USER: 2,
            MESSAGE: 3,
        };
        this.optionsTypes = {
            SUB_COMMAND: 1,
            SUB_COMMAND_GROUP: 2,
            STRING: 3,
            INTEGER: 4,
            BOOLEAN: 5,
            USER: 6,
            CHANNEL: 7,
            ROLE: 8,
            MENTIONABLE: 9,
            NUMBER: 10,
            ATTACHMENT: 11,
        };
    };
    box(...args) {
        consola.box(...args)
    }

    success(...args) {
        consola.success(...args)
    }

    info(...args) {
        consola.info(...args);
    }

    warn(...args) {
        consola.warn(...args);
    }

    start(...args) {
        consola.start(...args);
    }

    error(...args) {
        consola.error(...args);
    }

    async go() {
        this.login(this.config.token).catch(() => {
            throw new Error(`[B0T] => Token invalide ou manque d'intents`)
        })
    };

    embed() {
        const embed = new EmbedBuilder();
        return embed
    };
    

    row() {
        return new ActionRowBuilder()
    };

    menu() {
        return new StringSelectMenuBuilder()
    };

    button() {
        return new ButtonBuilder()
    };

    modal() {
        return new ModalBuilder()
    };

    textInput() {
        return new TextInputBuilder()
    };

    attachment(f, name) {
        return new AttachmentBuilder(f, { name })
    }
};
process.on("unhandledRejection", (reason, p) => {
  if (reason.code === 0) return; 
  if (reason.code === 400) return;
  if (reason.code == 10062) return; 
  if (reason.code == 10008) return; 
  if (reason.code === 50035) return; 
  if (reason.code === 40032) return; 
  if (reason.code ==  50013) return; 
  if (reason.message.includes("Temp env not set")) return; 
  if (reason.message.includes('no such file or director')) return; 
  if (reason.message.includes("getaddrinfo ENOTFOUND null")) return; 
    consola.error(reason, p);
});
process.on("uncaughtException", (err, origin) => {
    consola.error(err, origin);
});

module.exports = client