import { Prisma } from '@generated/prisma-client';

export function createMessagingUserIdentifierWhere(
    identifier: string
): Prisma.UserWhereInput | null {
    const normalized = identifier.trim();
    if (!normalized) {
        return null;
    }

    if (/^\d+$/.test(normalized)) {
        return {
            legacyId: BigInt(normalized),
        };
    }

    if (
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
            normalized
        )
    ) {
        return {
            id: normalized,
        };
    }

    return {
        mobileNumbers: {
            some: {
                number: normalized,
            },
        },
    };
}
