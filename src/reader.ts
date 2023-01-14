import {createReadStream, ReadStream} from "fs";
import { stat } from "fs/promises";
import readline from "readline";
import * as _ from "./_";
import * as _v from "./validation";
import {Options, ReadOptions, LogFile} from "./types";
import {LogEntry} from "./entry";

export class Reader {

    private readonly options: Options;

    private readOptions: ReadOptions;

    private _stream?: ReadStream;

    private lineReader?: readline.Interface;

    private _files: LogFile[] = [];

    private current = 0;

    private lastLine = 0;

    constructor(options: Options) {
        this.options = options;
        this.readOptions = options.read;
    }

    private async stream(): Promise<readline.Interface> {
        this._stream = createReadStream(
            this._files[this.current].path,
            { encoding: "utf-8", start: this.lastLine }
        );

        this.lineReader = readline.createInterface({
            input: this._stream,
            terminal: false,
            crlfDelay: Infinity
        });

        return this.lineReader
    }

    get files() {
        return this._files;
    }

    async load(opts: Options): Promise<void> {
        _v.validate(opts.read, 'read');

        this.readOptions = _.merge(this.options.read, opts.read);

        this.current = 0;
        this.lastLine = 0;

        const { path, extension } = opts;
        const targets = await _.resolveTargets(path, extension);

        for (let i = 0; i < targets.length; i++) {
            const target: LogFile = { path: targets[i] };

            if (this.readOptions.stats) {
                const stats = await stat(target.path);
                target.size = stats.size;
                target.lines = await _.countLines(target.path);
            }

            this._files.push(target)
        }
    }

    async read<T = string | LogEntry>(previousLines?: Array<T>): Promise<Array<T>> {
        if (!this._files?.length) {
            return [];
        }

        const lineReader = await this.stream();
        const lines: T[] = previousLines || [];

        for await (const line of lineReader) {
            if (!line.trim()) continue;

            const lineObj = JSON.parse(line.trim()) as LogEntry;
            const levelI = _.level(this.options.level);
            const lineLevelI = _.level(lineObj.level);

            this.lastLine += Buffer.byteLength(line, 'utf-8') + 1

            if (lineLevelI > levelI) {
                continue;
            }

            const { filter } = this.readOptions;

            if (filter?.level) {
                if (_.level(filter.level) !== _.level(lineObj.level)) {
                    continue;
                }
            }

            if (!_.checkDate(lineObj.date, filter)) {
                continue;
            }

            if (this.readOptions.json) {
                lines.push(lineObj as T);
            } else {
                lines.push(line.trim() as T);
            }

            if (lines.length >= this.readOptions.lines) {
                break;
            }
        }

        this.close();

        if (lines.length < this.readOptions.lines) {
            this.current += 1;
            this.lastLine = 0;

            if (!this._files[this.current]) {
                return lines as T[];
            }

            return this.read(lines);
        }

        return lines as T[];
    }

    close() {
        this._stream?.destroy();
        this.lineReader?.close();
    }
}
