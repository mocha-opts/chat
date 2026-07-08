import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class VerificationStatusResponseDto {
    @ApiProperty({
        required: true,
        example: 'ok',
    })
    @Expose()
    status: string;
}
