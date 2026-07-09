export const RedPacketAmountKeyPrefix = 'red_packet:amount:';
export const RedPacketUserKeyPrefix = 'red_packet:users:';
export const RedPacketExpireMarkerKeyPrefix = 'red_packet:count:';
export const RedPacketDefaultWrapperText = '恭喜发财，大吉大利';
export const RedPacketExpireInMs = 24 * 60 * 60 * 1000;
export const RedPacketExpireScanIntervalInMs = 60 * 1000;
export const RedPacketExpireScanLimit = 100;
export const RedPacketMinAmountInCents = 1n;
export const RedPacketMaxAmountPerPacketInCents = 20000n;
export const RedPacketSnowflakeEpochInMs = 1_735_689_600_000n;
export const RedPacketRandomMultiplier = 2n;

export const RedPacketClaimLuaScript = `
if redis.call('sismember', KEYS[2], ARGV[1]) == 1 then
    return '-1'
end
local amount = redis.call('rpop', KEYS[1])
if amount == false then
    return '0'
end
redis.call('sadd', KEYS[2], ARGV[1])
redis.call('pexpire', KEYS[2], ARGV[2])
return amount
`;

export const RedPacketCompensateLuaScript = `
if redis.call('sismember', KEYS[2], ARGV[1]) == 1 then
    redis.call('srem', KEYS[2], ARGV[1])
    redis.call('lpush', KEYS[1], ARGV[2])
    redis.call('pexpire', KEYS[1], ARGV[3])
    return '1'
end
return '0'
`;
