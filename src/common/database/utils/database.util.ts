import { Injectable } from '@nestjs/common';
import { Prisma } from '@generated/prisma-client';
import { randomBytes } from 'crypto';

@Injectable()
export class DatabaseUtil {
    private readonly serializableTransactionMaxRetries = 5;
    private readonly serializableTransactionRetryDelayInMs = 25;

    checkIdIsValid(id: string): boolean {
        return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
            id
        );
    }

    createId(): string {
        const bytes = randomBytes(16);
        let timestamp = Date.now();
        for (let index = 5; index >= 0; index--) {
            bytes[index] = timestamp & 0xff;
            timestamp = Math.floor(timestamp / 0x100);
        }
        bytes[6] = (bytes[6] & 0x0f) | 0x70;
        bytes[8] = (bytes[8] & 0x3f) | 0x80;

        return [
            bytes.subarray(0, 4).toString('hex'),
            bytes.subarray(4, 6).toString('hex'),
            bytes.subarray(6, 8).toString('hex'),
            bytes.subarray(8, 10).toString('hex'),
            bytes.subarray(10, 16).toString('hex'),
        ].join('-');
    }

    /**
     * Deep-clones `data` and casts it to a Prisma-compatible plain object.
     */
    toPlainObject<T, N = Prisma.JsonObject>(data: T): N {
        return structuredClone(data as unknown) as N;
    }

    /**
     * Deep-clones `data` and casts it to a Prisma-compatible plain array.
     */
    toPlainArray<T, N = Prisma.JsonObject>(data: T): N[] {
        return structuredClone(data) as N[];
    }

    async retrySerializableTransaction<T>(
        operation: () => Promise<T>
    ): Promise<T> {
        let attempt = 0;

        for (;;) {
            try {
                return await operation();
            } catch (error: unknown) {
                attempt += 1;
                if (
                    !this.isSerializableTransactionConflict(error) ||
                    attempt >= this.serializableTransactionMaxRetries
                ) {
                    throw error;
                }

                await this.delay(
                    this.serializableTransactionRetryDelayInMs * attempt
                );
            }
        }
    }

    private isSerializableTransactionConflict(error: unknown): boolean {
        return (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === 'P2034'
        );
    }

    private async delay(milliseconds: number): Promise<void> {
        await new Promise(resolve => {
            setTimeout(resolve, milliseconds);
        });
    }
}
