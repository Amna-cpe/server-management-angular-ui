import { Server } from "./server";

export interface CustomeResponse {
    timeStamp:Date;
    statusCode:number;
    status:string;
    reasone:string;
    message:string;
    developerMessage:string;
    data:{servers?:Server[] , server?:Server};
}