import kafkajs from 'kafkajs';

const { Kafka } = kafkajs;

const Topics = [
    'im.message.created',
    'im.message.persist',
    'im.realtime.push',
    'im.friend.application',
    'im.conversation.created',
    'im.moment.created',
    'im.red-packet.created',
    'im.dead-letter',
];

const Brokers = (process.env.KAFKA_BROKERS ?? 'kafka:29092')
    .split(',')
    .map(broker => broker.trim())
    .filter(Boolean);

const ClientId = `${process.env.KAFKA_CLIENT_ID ?? 'infinite-chat-api'}-topic-init`;
const RetryCount = 10;
const RetryDelayMs = 3000;

function sleep(ms) {
    return new Promise(resolve => {
        setTimeout(resolve, ms);
    });
}

async function ensureTopics() {
    const kafka = new Kafka({
        clientId: ClientId,
        brokers: Brokers,
    });
    const admin = kafka.admin();

    for (let attempt = 1; attempt <= RetryCount; attempt += 1) {
        try {
            await admin.connect();
            await admin.createTopics({
                waitForLeaders: true,
                topics: Topics.map(topic => ({
                    topic,
                    numPartitions: 3,
                    replicationFactor: 1,
                })),
            });
            await admin.disconnect();
            console.log(`[kafka-topic-init] topics ready: ${Topics.join(', ')}`);
            return;
        } catch (error) {
            await admin.disconnect().catch(() => undefined);

            if (attempt === RetryCount) {
                throw error;
            }

            console.warn(
                `[kafka-topic-init] attempt ${attempt} failed, retrying in ${RetryDelayMs}ms`
            );
            await sleep(RetryDelayMs);
        }
    }
}

await ensureTopics();
