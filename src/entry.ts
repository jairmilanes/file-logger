import {format, inspect} from "util";
import {LogData, MessageType, WriteOptions} from "./types";
import * as _ from "./_";

export class LogEntry {
    level: string;
    date: string;
    time: string;
    message: string;
    data?: LogData;
    stack?: string;

    constructor(message: MessageType, data: LogData = {}, opts: WriteOptions) {
        this.level = _.prefix(opts.level);
        this.date = _.dateReplace(opts.format.date);
        this.time = _.timeReplace(opts.format.time);
        this.message = _.stringfyable(message) ? inspect(message) : format(message);
        this.data = data;
        this.stack = (message instanceof Error && opts.stack) ? message.stack : "";
    }

}
