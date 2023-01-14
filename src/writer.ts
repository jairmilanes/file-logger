import { appendFileSync } from "fs";
import { inspect } from "util";
import { LogData, MessageType, Options } from "./types";
import * as _ from "./_";
import * as _v from "./validation";
import { LogEntry } from "./entry";

export class Writer {
    private logFile(opts: Options) {
        const { path, extension } = opts;
        const { file: { day, month, year } } = opts.write;
        return _.filePath(path, [year, month, day], extension);
    }

    private append(message: LogEntry, opts: Options): LogEntry {
        _.ensureDir(opts.path, opts.write.file.year, opts.write.file.month);

        appendFileSync(this.logFile(opts), JSON.stringify(message).concat('\n'));

        return message;
    }

    write(message: MessageType, data: LogData = {}, opts: Options): LogEntry | undefined {
        if (!message) return;

        _v.validate(opts.write, 'write');

        // Ignore levels above the logger level
        if (_.level(opts.write.level) > _.level(opts.level)) {
            return;
        }

        const entry = new LogEntry(message, data, opts.write);

        if (_.stringfyable(message)) entry.message = inspect(message);

        return this.append(entry, opts);
    }
}
