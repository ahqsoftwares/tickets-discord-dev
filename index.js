const Discord = require("discord.js");
const {DB} = require('mongquick');
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
var settings, type, mid;
async function login(url) {
  if (url == 'local') {
    type = "quick";
    settings = require('quick.db');
    return
  }
  type = 'mongo';
  settings = new DB(url);
}

async function start(client){
if(!client) throw new Error("Client not provided, Ticket system will not be working.")

client.on("interactionCreate", async (interaction) => {
  if (!(interaction.isButton())) return;
  if (!(interaction.customId == 'cr')) return;
  if (interaction.member.user.bot) return;
  const reaction = interaction;
  await interaction.deferReply({ephemeral: true});
  if (type == 'mongo') {
  if (!(await(settings.has(`${interaction.guild.id}-ticket`)))) return;
  if (reaction.channel.id == (await(settings.get(`${interaction.message.guild.id}-ticket`)))) {
    ticket(interaction);
  }
} else {
  if (!((settings.has(`${interaction.guild.id}-ticket`)))) return;
  if (reaction.channel.id == ((settings.get(`${interaction.message.guild.id}-ticket`)))) {
    ticket(interaction);
  }
}
});
}
async function ticket(interaction) {
  let reaction = interaction;
  reaction.guild.channels
  .create(`ticket-${interaction.member.user.username}`, {
    permissionOverwrites: [
      {
        id: interaction.member.user.id,
        allow: ["SEND_MESSAGES", "VIEW_CHANNEL"]
      },
      {
        id: reaction.guild.id,
        deny: ["VIEW_CHANNEL"]
      },
      {
        id: reaction.guild.roles.cache.find(
          role => role.name === "Ticket"
        ),
        allow: ["SEND_MESSAGES", "VIEW_CHANNEL"]
      }
    ],
    type: "text"
  })
  .then(async channel => {
    settings.set(channel.id, interaction.member.user.id);
    channel.send({
      content: String(`<@${interaction.member.user.id}>`),
      embeds: [new Discord.MessageEmbed()
        .setTitle("Welcome to your ticket!")
        .setDescription("Support Team will be with you shortly")
        .setColor("RANDOM")],
      components: [
        new Discord.MessageActionRow().addComponents(
          new Discord.MessageButton()
          .setStyle('DANGER')
          .setLabel("Lock Ticket")
          .setCustomId('cl')
          .setEmoji('🔒')
        )
      ]
    }).then(m => {
      let collector = m.createMessageComponentCollector({
        max: 3
    });
    collector.on('collect', async i => {
      if (i.user.id !== interaction.member.user.id) {
        await i.reply({
          content: String("You are not the ticket issuer"), 
          ephemeral: true
        })
        return
      }
      await i.update({
        embeds: [new Discord.MessageEmbed()
          .setTitle("Welcome to your ticket!")
          .setDescription("The ticket was archived")
          .setColor("RANDOM")],
        components: [
          new Discord.MessageActionRow().addComponents(
            new Discord.MessageButton()
            .setStyle('DANGER')
            .setLabel("Locked Ticket")
            .setCustomId('cl')
            .setEmoji('🔏')
            .setDisabled(true)
          )
        ]
      })
      archive(channel)
    })
    });
  });
}
async function setup(message,channelID){
    const channel = message.guild.channels.cache.find(channel => channel.id === channelID);
    channel.send({
      embeds: [
        new Discord.MessageEmbed()
          .setTitle("Ticket System")
          .setDescription("Click to open a ticket!")
          .setFooter(`Secure ticketing for ${message.guild.name}`)
          .setColor("RANDOM")
      ],
      components: [
            new Discord.MessageActionRow().addComponents(
              new Discord.MessageButton()
              .setStyle('SUCCESS')
              .setLabel("Open Ticket")
              .setCustomId('cr')
              .setEmoji('🎫')
            )
          ]
    }).then(sent => {
      settings.set(`${message.guild.id}-ticket`, channelID);
    });
    if (!(message.guild.roles.cache.find(role => role.name == "Ticket"))) {

message.guild.roles.create({
    name: "Ticket",
    color: "#ff0000"
}).then(role => {
    role.setPermissions([Discord.Permissions.FLAGS.VIEW_CHANNEL, Discord.Permissions.FLAGS.SEND_MESSAGES]);
    role.setMentionable(false);
    message.channel.send(`Role \`${role.name}\` created and ticket system success!`);
});
    } else {
      message.channel.send(`Role \`Ticket\` was found and ticket system success!`);
    }
}
async function unarchive(channel){
  if (type == 'mongo') {
    if (!(await(settings.has(channel.id)))) {
      channel.send({
        content: String("The user of the ticket was not found!")
      })
      return
    }
    mid = (await(settings.get(channel.id)));
  } else {
    if (!((settings.has(channel.id)))) {
      channel.send({
        content: String("The user of the ticket was not found!")
      })
      return
    }
    mid = (settings.get(channel.id));
  }
  await delay(1500)
  channel.edit({
    permissionOverwrites: [
    {
      id: mid,
      allow: ["VIEW_CHANNEL", "SEND_MESSAGES"]
    },
    {
      id: channel.guild.id,
      deny: ["VIEW_CHANNEL"]
    },
    {
      id: channel.guild.roles.cache.find(
        role => role.name === "Ticket"
      ),
      allow: ["SEND_MESSAGES", "VIEW_CHANNEL"]
    }
  ]
  });
  channel.send({
    content: String(`Hello <@${mid}> \n The ticket was reopened by a staff member`)
  })
}
async function archive(message){
  if (!message.name.includes("ticket-")){
    message.send("You cannot use that here!");
    return 
    }
  message.edit({
    permissionOverwrites: [
    {
      id: message.guild.id,
      deny: ["VIEW_CHANNEL"]
    },
    {
      id: message.guild.roles.cache.find(
        role => role.name === "Ticket"
      ),
      allow: ["SEND_MESSAGES", "VIEW_CHANNEL"]
    }
  ]
});
}
async function close(message){
  if (!message.name.includes("ticket-")){
  message.send("You cannot use that here!");
  return 
  }
message.delete()
}
async function modmail(client, options = []) {
  let { MessageButton, MessageActionRow } = require('discord.js')


let guild = client.guilds.cache.get(options.guildID);

if (!guild) throw new Error("No Guild!");



  client.on("messageCreate", async(message) => {

if (message.author.bot) return;
if (message.channel.type === "DM") {
    let mailName = `${message.author.id}`

let usersChannel = await guild.channels.cache.find(ch => ch.name === mailName.toLowerCase());



if (!usersChannel) {

  const createdEmbed = new Discord.MessageEmbed()
  .setAuthor(`${message.author.tag}`, message.author.displayAvatarURL({ dynamic: true }))
  .setTitle("No Mail Opened")
  .setDescription(message.content)
  .setColor(options.embedColor)



  let categ = guild.channels.cache.get(options.categoryID)



if (!categ) throw new Error("No Category!")


if (!options.staffRole) throw new Error("No Role!")


    let permissions = {
      id: options.staffRole,
      allow: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'READ_MESSAGE_HISTORY']
    }


  guild.channels.create(`${message.author.id}`, {
    type: "text",
    parent: categ,
    permissionOverwrites: [
      {
        id: guild.roles.everyone,
        deny: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'READ_MESSAGE_HISTORY'] //Deny permissions
      },
     permissions
    ],
  }).then(async (ch) => {


let role = ch.guild.roles.cache.find((r) => r.id == options.staffRole)


if (!role) throw new Error("No role!")


const openedUserEmbed = new Discord.MessageEmbed()
.setAuthor(`${message.author.tag}`, message.author.displayAvatarURL({ dynamic: true }))
.setTitle(`${options.userOpenedTitle}`)
.setDescription(`${options.userOpenedMessage}`)
.setTimestamp()
.setColor(options.embedColor)
    message.author.send({ embeds: [openedUserEmbed] })


    let usersCreatedChannel = await guild.channels.cache.find(ch => ch.name === mailName.toLowerCase());



let delButton = new MessageButton()
.setStyle("DANGER")
.setLabel('Delete')
.setCustomId('close_mail')
.setEmoji(`${options.wrongEmoji}` || '❌')



let deleteRow = new MessageActionRow()
.addComponents([delButton])

const openedStaffEmbed = new Discord.MessageEmbed()
.setAuthor(`${message.author.tag}`, message.author.displayAvatarURL({ dynamic: true }))
.setTitle(`${options.staffOpenedTitle}`)
.setDescription(`${options.staffOpenedMessage}\n**User: ${message.author.tag} (${message.author.id})**\n\n ${message.content}`)
.setTimestamp()
.setColor(options.embedColor)

usersCreatedChannel.send({ embeds: [openedStaffEmbed], components: [deleteRow] })
  })


} else {

    let usersHadChannel = await guild.channels.cache.find(ch => ch.name === mailName.toLowerCase());


const userHadEmbed = new Discord.MessageEmbed()
.setAuthor(`${message.author.tag}`, message.author.displayAvatarURL({ dynamic: true }))
.setTitle(`${message.content}`)
.setTimestamp()
.setColor(options.embedColor)


usersHadChannel.send({ embeds: [userHadEmbed] })
}

// Sent In DM's //
} else {
  if (message.channel.type === "GUILD_TEXT") {

let categor = guild.channels.cache.get(options.categoryID)


    if (message.channel.parentId !== categor.id) return;

    const usertosend = message.guild.members.cache.find((user) => user.id == message.channel.name)

    if (!usertosend) return;

if (options.anonymousReply === true) {


    const staffSendEmbedA = new Discord.MessageEmbed()
    .setAuthor(`Staff Team`)
    .setTitle(`${message.content}`)
    .setTimestamp()
    .setColor(options.embedColor)

    usertosend.send({ embeds: [staffSendEmbedA] })

} else {
    const staffSendEmbed = new Discord.MessageEmbed()
    .setAuthor(`${message.author.tag}`, message.author.displayAvatarURL())
    .setTitle(`${message.content}`)
    .setTimestamp()
    .setColor(options.embedColor)

    usertosend.send({ embeds: [staffSendEmbed] })
}
  }
}
  })



// Channel Deleted //

client.on("channelDelete", (channel) => {

  let category = guild.channels.cache.get(options.categoryID)


if (channel.parentId !== category.id) return;

const user = channel.guild.members.cache.find((user) => user.id == channel.name)

if (!user) return;

const deletedEmbed = new Discord.MessageEmbed()
.setTitle(`${options.closedTitle}`)
.setDescription(`${options.closedMessage}`)
.setColor(options.embedColor)


user.send({ embeds: [deletedEmbed] })


});





// Delete Buttons //

  let confirmButton = new MessageButton()
.setStyle("SUCCESS")
.setLabel('Confirm')
.setCustomId('confirm_mail')
.setEmoji(`${options.rightEmoji}` || '✔️')


  let cancleButton = new MessageButton()
.setStyle("SECONDARY")
.setLabel('Cancle')
.setCustomId('cancle_mail')
.setEmoji(`${options.wrongEmoji}` || '❌')


let optionsRow = new MessageActionRow()
.addComponents([confirmButton])
.addComponents([cancleButton])


client.on('interactionCreate', interaction => {



if (interaction.customId === "close_mail") {
interaction.update({ components: [optionsRow]})

} else {

  if (interaction.customId === "cancle_mail") {

let delButton2 = new MessageButton()
.setStyle("DANGER")
.setLabel('Delete')
.setCustomId('close_mail')
.setEmoji('❌')



let deleteRow2 = new MessageActionRow()
.addComponents([delButton2])



interaction.update({ components: [deleteRow2]})


  } else {
    if (interaction.customId === "confirm_mail") {
      interaction.message.channel.delete();
    }
  }
} 

  });

}
module.exports = modmail
module.exports.setup = setup
module.exports.login = login
module.exports.start = start
module.exports.close = close
module.exports.archive = archive
module.exports.unarchive = unarchive
