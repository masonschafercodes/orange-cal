import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ChannelType,
    Client,
    EmbedBuilder,
    GuildMember,
} from 'discord.js'
import Queue from 'bull'
import { config } from '../config'
import { Reminder } from '../schemas/reminder'

export async function editReminderEmbed(
    reminder: IEditReminderEmbedInput,
    member: GuildMember | undefined
) {
    const utcTime = reminder.date.getTime().toString().slice(0, -3)
    let attendeesString = reminder.attendees
        .slice(0, 10)
        .map((id) => `<@${id}>`)
        .join('\n')

    if (reminder.attendees.length > 10) {
        attendeesString += `\nand ${reminder.attendees.length - 10} more...`
    }

    if (reminder.attendees.length === 0) {
        attendeesString = '-'
    }

    const isOld = reminder.date.getTime() < Date.now()

    const embed = new EmbedBuilder()
        .setTitle(`New Reminder: ${reminder.name}`)
        .addFields([
            {
                name: 'Date',
                value: `<t:${utcTime}> (${isOld ? 'Already Started' : `<t:${utcTime}:R>`})`,
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

    if (reminder.description) {
        embed.setDescription(reminder.description)
    }

    return embed
}

export function reminderEmbedButtons() {
    const buttons = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
            .setCustomId('getReminder')
            .setEmoji('🍊')
            .setLabel('Get Reminder')
            .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
            .setCustomId('editReminder')
            .setEmoji('⚙️')
            .setLabel('Edit Reminder')
            .setStyle(ButtonStyle.Secondary)
    )

    return buttons
}

const redisQueueConfig: Queue.QueueOptions = {
    redis: {
        host: config.redisHost,
        port: config.redisPort,
    },
}

export const userNotiQueue = new Queue<IUserNotiQueue>(
    'user-reminder-notifications',
    redisQueueConfig
)
export const reminderUpdateQueue = new Queue<IReminderUpdateQueue>(
    'reminder-update',
    redisQueueConfig
)

export function createReminderQueues(client: Client) {
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

        const member = channel.guild.members.cache.get(reminder.userId)

        const embed = await editReminderEmbed(reminder, member)

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
            `🍊📅 **Reminder:** \n\nName: ${reminder.name} \nStart Date: <t:${reminder.date.getTime().toString().slice(0, -3)}> \nMeeting In: ${reminder.meetingChannelId ? `<#${reminder.meetingChannelId}>` : '-'} \nDescription: ${reminder.description || '-'} \n\n<@${user.id}>`
        )
        done()
    })
}
