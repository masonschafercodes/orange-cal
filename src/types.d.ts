interface IUserNotiQueue {
    userId: string
    reminderId: string
}

interface IReminderUpdateQueue {
    messageId: string
}

interface IEditReminderEmbedInput {
    name: string
    description?: string
    date: Date
    attendees: string[]
    meetingChannelId?: string
}

interface IReminder {
    userId: string
    guildId: string
    name: string
    description?: string
    date: Date
    messageId: string
    channelId: string
    attendees: string[]
    meetingChannelId?: string
}
