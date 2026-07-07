import { Injectable } from '@nestjs/common';
import { Prisma } from '@generated/prisma-client';
import { v7 as uuidV7, validate as uuidValidate } from 'uuid';

@Injectable()
export class DatabaseUtil {
    checkIdIsValid(id: string): boolean {
        return uuidValidate(id);
    }

    createId(): string {
        return uuidV7();
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
}
