import {existsSync } from "fs";
import { rm, unlink } from "node:fs/promises"
import {
    LogData,
    MessageType,
    Options,
    ReadOptions,
    RecursivePartial, WriteOptions,
} from "./types";
import * as _ from "./_";
import * as _v from "./validation";
import {Reader} from "./reader";
import {Writer} from "./writer";
import {LogEntry} from "./entry";

export class FileLogger {
    private readonly options: Options = {
        name: "default",
        path: "logs",
        extension: '.log',
        level: _.logLevelByName.INFO,
        write: {
            level: _.logLevelByName.INFO,
            format: {
                time: '%hour:%minute:%second',
                date: '%year/%month/%day'
            },
            stringify: true,
            stack: true,
            file: {
                day: "%day",
                month: "%month",
                year: "%year"
            }
        },
        read: {
            path: undefined,
            stats: false,
            json: true,
            lines: 15,
            offset: 0,
            filter: {}
        }
    };

    private reader: Reader;
    private writer: Writer;

    constructor(name: string, opts: RecursivePartial<Options>) {
        this.options = _.merge(this.options, { name, ...opts }) as Options;

        _v.validate(this.options);

        if (!this.options.level) {
            this.options.level = _.level(_.logLevelByName.INFO);
        }

        if (typeof this.options.level === "string") {
            this.options.level = _.level(this.options.level);
        }

        this.reader = new Reader(this.options);
        this.writer = new Writer();
    }

    get files() {
        return this.reader.files;
    }

    write(message: MessageType, data: LogData = {}, opts: Partial<WriteOptions> = {} ): LogEntry | undefined {
        return this.writer.write(message, data, _.merge(this.options, { write: opts } as Partial<Options>));
    }

    error(message: string, data: LogData = {}) {
        return this.write(message, data, { level: _.logLevel[0] });
    }

    warn(message: string, data: LogData = {}) {
        return this.write(message, data, { level: _.logLevel[1] });
    }

    info(message: string, data: LogData = {}) {
        return this.write(message, data, { level: _.logLevel[2] });
    }

    http(message: string, data: LogData = {}) {
        return this.write(message, data, { level: _.logLevel[3] });
    }

    verbose(message: string, data: LogData = {}) {
        return this.write(message, data, { level: _.logLevel[4] });
    }

    debug(message: string, data: LogData = {}) {
        return this.write(message, data, { level: _.logLevel[5] });
    }

    silly(message: string, data: LogData = {}) {
        return this.write(message, data, { level: _.logLevel[6] });
    }

    async load(opts: Partial<ReadOptions> = {}): Promise<void> {
        return this.reader.load(_.merge(this.options, { read: opts } as Partial<Options>));
    }

    async read<T = string | LogEntry>(): Promise<T[]> {
        return this.reader.read<T>();
    }

    async remove(year?: string, month?: string, day?: string): Promise<void> {
        let path = "";

        if (!year) {
            const years = await _.findYears(this.options.path);

            for (let i = 0; i < years.length; i++) {
                await rm(_.logsPath(this.options.path, years[i]),  { recursive: true, force: true });
            }

            this.reader = new Reader(this.options);
            return;
        }

        if (!month && !day) {
            path = _.yearPath(this.options.path, year);
        }

        if (month && !day) {
            path = _.monthPath(this.options.path, year, month);
        }

        if (month && day) {
            path = _.dayPath(this.options.path, year, month, day).concat(this.options.extension);
        }

        if (!existsSync(path)) {
            this.reader = new Reader(this.options);
            return;
        }

        if (path.endsWith(this.options.extension)) {
            this.reader = new Reader(this.options);
            return unlink(path);
        }

        await rm(path,  { recursive: true, force: true });

        this.reader = new Reader(this.options);
    }
}
