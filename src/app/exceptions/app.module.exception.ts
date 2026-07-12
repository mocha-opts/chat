import { AppBaseException } from '@app/exceptions/app.base.exception';
import { IAppBaseExceptionOptions } from '@app/interfaces/app.interface';
import { HttpStatus } from '@nestjs/common';

export interface IAppModuleExceptionPayload {
    module: string;
    statusCode: number;
    statusCodeKey: string;
    httpStatus: HttpStatus;
    messagePath: string;
    options?: IAppBaseExceptionOptions;
}

export class AppModuleException extends AppBaseException {
    readonly module: string;
    readonly statusCode: number;
    readonly statusCodeKey: string;
    readonly httpStatus: HttpStatus;

    constructor(payload: IAppModuleExceptionPayload) {
        super(payload.messagePath, payload.options);

        this.module = payload.module;
        this.statusCode = payload.statusCode;
        this.statusCodeKey = payload.statusCodeKey;
        this.httpStatus = payload.httpStatus;
    }
}
