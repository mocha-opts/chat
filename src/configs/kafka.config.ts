import { registerAs } from '@nestjs/config';

export interface IConfigKafka {
    clientId: string;
    groupId: string;
    brokers: string[];
}

export default registerAs(
    'kafka',
    (): IConfigKafka => ({
        clientId: process.env.KAFKA_CLIENT_ID!,
        groupId: process.env.KAFKA_GROUP_ID!,
        brokers: process.env.KAFKA_BROKERS!.split(',')
            .map(broker => broker.trim())
            .filter(broker => broker.length > 0),
    })
);
