export const KafkaTopics = {
    imMessageCreated: 'im.message.created',
    imMessagePersist: 'im.message.persist',
    imRealtimePush: 'im.realtime.push',
    imFriendApplication: 'im.friend.application',
    imConversationCreated: 'im.conversation.created',
    imMomentCreated: 'im.moment.created',
    imRedPacketCreated: 'im.red-packet.created',
    imDeadLetter: 'im.dead-letter',
} as const;

export type IKafkaTopic = (typeof KafkaTopics)[keyof typeof KafkaTopics];
