import { ChannelType, Client, EmbedBuilder } from 'discord.js'
import { config } from './config'
import { commands } from './commands'
import { buttons } from './buttons'
import { deployCommands } from './deploy-commands'
import { connect } from 'mongoose'
import Queue from 'bull'
import { Reminder } from './schemas/reminder'

export const userNotiQueue = new Queue<{
    userId: string
    reminderId: string
}>('user-reminder-notifications', {
    redis: {
        host: config.redisHost,
        port: config.redisPort,
    },
})
export const reminderUpdateQueue = new Queue<{
    messageId: string
}>('reminder-update', {
    redis: {
        host: config.redisHost,
        port: config.redisPort,
    },
})
const client = new Client({
    intents: ['Guilds', 'GuildMessages', 'DirectMessages'],
})

client.once('ready', () => {
    console.log('OrangeCal is Ready! 🍊📅')
})

client.on('guildCreate', async (guild) => {
    await deployCommands({ guildId: guild.id })
})

client.on('interactionCreate', async (interaction) => {
    try {
        if (interaction.isCommand()) {
            const { commandName } = interaction
            if (commands[commandName as keyof typeof commands]) {
                commands[commandName as keyof typeof commands].execute(
                    interaction
                )
            }
        } else if (interaction.isButton()) {
            const { customId } = interaction
            if (buttons[customId as keyof typeof buttons]) {
                buttons[customId as keyof typeof buttons].execute(interaction)
            }
        } else {
            console.log('Unknown interaction type: ', interaction)
        }
    } catch (error) {
        console.error('Error handling interaction: ', error)
    }
})

reminderUpdateQueue.process(async (job, done) => {
    const { messageId } = job.data
    const reminder = await Reminder.findOne({
        messageId,
    })

    if (!reminder) {
        console.error('Reminder not found: ', messageId)
        return done()
    }

    const channel = client.channels.cache.get(reminder.channelId)

    if (!channel || channel.type !== ChannelType.GuildText) {
        console.error('Channel not found: ', reminder.channelId)
        return done()
    }

    const message = await channel.messages.fetch(messageId)

    if (!message) {
        console.error('Message not found: ', messageId)
        return done()
    }

    const utcTime = reminder.date.getTime().toString().slice(0, -3)
    let attendeesString = reminder.attendees
        .slice(0, 10)
        .map((id) => `<@${id}>`)
        .join('\n')

    if (reminder.attendees.length > 10) {
        attendeesString += `\nand ${reminder.attendees.length - 10} more...`
    }

    const member = channel.guild.members.cache.get(reminder.userId)

    const embed = new EmbedBuilder()
        .setTitle(`New Reminder: ${reminder.name}`)
        .addFields([
            {
                name: 'Date',
                value: `<t:${utcTime}> (Already Started)`,
            },
            {
                name: `Attendees (${reminder.attendees.length})`,
                value: `>>> ${attendeesString}`,
                inline: true,
            },
        ])
        .setFooter({
            text: `Created by ${member?.user.username || 'Unknown'}`,
        })
        .setColor('Orange')

    if (reminder.meetingChannelId) {
        embed.addFields({
            name: 'Meeting In',
            value: `<#${reminder.meetingChannelId}>`,
        })
    }

    await message.edit({
        embeds: [embed],
        components: [],
    })

    done()
})

userNotiQueue.process(async (job, done) => {
    const { userId, reminderId } = job.data
    const user = await client.users.fetch(userId)

    if (!user) {
        console.error('User not found: ', userId)
        return done()
    }

    const reminder = await Reminder.findById(reminderId)

    if (!reminder) {
        console.error('Reminder not found: ', reminderId)
        return done()
    }

    user.send(
        `🍊📅 **Reminder:** \n\n Name: ${reminder.name} \n Start Date: <t:${reminder.date.getTime().toString().slice(0, -3)}> ${reminder.meetingChannelId && `\n Meeting In: <#${reminder.meetingChannelId}>`} \n\n  <@${user.id}>`
    )
    done()
})

client
    .login(config.discordToken)
    .then(async () => {
        try {
            await connect(config.mongoUri)
        } catch (error) {
            console.error('Error connecting to MongoDB: ', error)
        }
    })
    .catch((error) => {
        console.error('Error logging in: ', error)
    })
