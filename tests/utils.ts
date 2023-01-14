import {FileLogger, LogEntry, LogLevelName, ReadOptions} from "../src";
import {logLevel} from "../src/_";

export function sleep(mili: number) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(null);
        }, mili)
    })
}

export function genTestDate(year: number, month?: number, day?: number): { dateStr: string, date: Date } {
    const date = new Date();

    const testDate = [
        year,
        (month || (Math.floor(Math.random() * 12) + 1) - 1),
        (day || (Math.floor(Math.random() * 31) + 1))
    ];

    date.setFullYear(
        testDate[0],
        testDate[1] - 1,
        testDate[2]
    );

    return {
        date,
        dateStr: `${testDate[0]}/${testDate[1]}/${testDate[2]}`
    }
}

export function genLogEntries(count = 100, logger: FileLogger, files: any[], levels?: LogLevelName[], callback?: (entry: LogEntry | undefined) => void) {
    for (let f = 0; f < files.length; f++) {
        for (let i = 0; i < count; i++) {
            const level = levels ? levels[(Math.floor(Math.random() * levels.length) + 1) - 1] : logLevel[2];

            const entry = logger.write(`Message ${i + 1}`, {}, {
                level,
                format: {
                    time: '%hour:%minute:%second',
                    date: `${files[f].year}/${files[f].month}/${files[f].day}`,
                },
                file: files[f]
            });

            if (callback) callback(entry)
        }
    }
}

export async function readEntries(opts: Partial<ReadOptions>, logger: FileLogger, callback?: (entry: LogEntry[]) => void): Promise<number> {
    await logger.load(opts);

    let totalRead = 0;
    let read = true;

    while (read) {
        const entries = await logger.read<LogEntry>();

        totalRead += entries.length;

        if (entries.length < 15) {
            read = false;
        } else {
            if (callback) {
                callback(entries)
            }
        }
    }

    return totalRead;
}

