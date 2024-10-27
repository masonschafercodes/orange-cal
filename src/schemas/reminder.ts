import { Schema, model } from 'mongoose'

export interface IReminder {
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

const reminderSchema = new Schema<IReminder>({
    userId: { type: String, required: true },
    guildId: { type: String, required: true },
    name: { type: String, required: true },
    description: { type: String },
    date: { type: Date, required: true },
    messageId: { type: String, required: true },
    channelId: { type: String, required: true },
    attendees: { type: [String], required: true },
    meetingChannelId: { type: String },
})

export const Reminder = model<IReminder>('Reminder', reminderSchema)
