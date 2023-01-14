import { resolve, join } from 'path';
import {createReadStream, mkdirSync} from 'fs';
import {LogLevelName, ReadFilters } from "./types";
import {readdir} from "fs/promises";

export const logLevel: Record<number, LogLevelName> = {
    0: "ERROR",
    1: "WARN",
    2: "INFO",
    3: "HTTP",
    4: "VERBOSE",
    5: "DEBUG",
    6: "SILLY",
} as const

export const logLevelByName: Record<LogLevelName, number> = {
    "ERROR": 0,
    "WARN": 1,
    "INFO": 2,
    "HTTP": 3,
    "VERBOSE": 4,
    "DEBUG": 5,
    "SILLY": 6
} as const;

export function level(nameOrLevel: number | string): number {
    if (typeof nameOrLevel === "number" && nameOrLevel in logLevel) {
        return nameOrLevel;
    }

    if (typeof nameOrLevel === "string" && Object.values(logLevel).includes(nameOrLevel as LogLevelName)) {
        return logLevelByName[nameOrLevel as LogLevelName];
    }

    throw new Error(`Level ${nameOrLevel} is invalid.`);
}

export function prefix(nameOrLevel: number | string): string {
    return logLevel[level(nameOrLevel)];
}

export function pad(dayOrMonth: string | number) {
    return ('0' + `${dayOrMonth}`).slice(-2)
}

export function dateReplace(str: string): string {
    const d = new Date();
    return str
        .replace(/%year/gi, d.getFullYear().toString())
        .replace(/%month/gi, pad(d.getMonth() + 1))
        .replace(/%day/gi, pad(d.getDate()));
}

export function timeReplace(str: string) {
    const date = new Date();
    return str
        .replace(/%hour/gi, pad(date.getHours()))
        .replace(/%minute/gi, pad(date.getMinutes()))
        .replace(/%second/gi, pad(date.getSeconds()));
}

export function logsPath(path: string, year?: string, month?: string): string {
    const parts: string[] = [];
    if (year) parts.push(year);
    if (month) parts.push(month);
    return resolve(join(process.cwd(), path, ...parts));
}

export function yearPath(path: string, year: string): string {
    return dateReplace(join(process.cwd(), path, year));
}

export function monthPath(path: string, year: string, month: string): string {
    return dateReplace(join(yearPath(path, year), month));
}

export function dayPath(path: string, year: string, month: string, day: string): string {
    return dateReplace(join(monthPath(path, year, month), day));
}

export function filePath(path: string, date: [string, string, string], ext: string) {
    return resolve(dateReplace(dayPath(path, ...date).concat(ext)));
}

export function findYears(path: string): Promise<string[]> {
    return readdir(logsPath(path), { encoding: "utf-8" });
}

export function findMonths(path: string, year: string): Promise<string[]> {
    return readdir(logsPath(path, year), { encoding: "utf-8" });
}

export function findDays(path: string, year: string, month: string): Promise<string[]> {
    return readdir(logsPath(path, year, month), { encoding: "utf-8" });
}

export async function resolveMonth(path: string, ext: string, year: string, month: string): Promise<string[]> {
    const files: string[] = [];
    const days = await findDays(path, year, month);

    days.forEach(d => {
        files.push(join(path, year, month, d))
    })

    return files;
}

export async function resolveYear(path: string, ext: string, year: string): Promise<string[]> {
    const files: string[] = [];
    const months = await findMonths(path, year);

    for (let m = 0; m < months.length; m++) {
        const days = await resolveMonth(path, ext, year, months[m]);
        days.forEach(d => files.push(d));
    }

    return files;
}

export async function load(path: string, ext: string): Promise<string[]> {
    const years = await findYears(path);
    const files: string[] = [];

    for (let y = 0; y < years.length; y++) {
        const months = await resolveYear(path, ext, years[y]);
        months.forEach(m => files.push(m));
    }

    files.sort();

    return files;
}

export async function resolveTargets(path: string, ext: string, date?: Date | string): Promise<string[]> {
    if (date instanceof Date) {
        return [
            filePath(path, [
                date.getFullYear().toString(),
                pad((date.getMonth() + 1).toString()),
                pad(date.getDay().toString())
            ], ext)
        ]
    }

    const [year, month, day] = date ? splitDate(date) as string[] : [];

    if (year && !month && !day) {
        return resolveYear(path, ext, year);
    }

    if (year && month && !day) {
        return resolveMonth(path, ext, year, pad(month));
    }

    if (year && month && day) {
        return [filePath(path, [year, pad(month), pad(day)], ext)];
    }

    return load(path, ext);
}

export function splitDate(dateStr: string, parse = false): Array<string|number> {
    const parts = dateStr.split(/[-/]/g);
    if (parse) return parts.map(d => parseInt(d, 10)) as number[];
    return parts;
}

export function toTimestamp(dateStr: string): false | number {
    const parsed = Date.parse(dateStr);
    return isNaN(parsed) ? false : parsed;
}

export function strToDate(dateStr: string): Date | false {
    const timestamp = toTimestamp(dateStr);

    if (timestamp) {
        return new Date(timestamp);
    }

    return false;
}

export function checkDate(dateStr: string, filters?: ReadFilters): boolean {
    const { start, end } = filters || {};

    if (!start && !end) return true;

    const startDate = start instanceof Date ? start : strToDate(start as string);
    const endDate = end instanceof Date ? end : strToDate(end as string);
    const logDate = strToDate(dateStr);

    if (start && !startDate) throw new Error('Invalid start date.');
    if (end && !endDate) throw new Error('Invalid end date.');
    if (logDate && !logDate) throw new Error('Invalid log entry date.');

    if (startDate && !endDate) {
        return logDate >= startDate;
    }

    if (!startDate && endDate) {
        return logDate <= endDate;
    }

    return logDate >= startDate && logDate <= endDate;
}

export const isPlainObject = (value: unknown) => value != null && typeof value === "object";

export function stringfyable(value: unknown) {
    return value && !(value instanceof Error) && (isPlainObject(value) || Array.isArray(value));
}

export function merge<T extends Record<string, unknown>>(t: Partial<T>, s: Partial<T>): T {
    const o: Record<string, unknown> = Object.assign({}, t);
    if (isPlainObject(t) && isPlainObject(s)) {
        Object.keys(s).forEach((k) => {
            if (isPlainObject(s[k])) {
                if (!(k in t)) {
                    Object.assign(o, { [k]: s[k] });
                } else {
                    o[k] = merge(t[k] as T, s[k] as T);
                }
            } else {
                Object.assign(o, { [k]: s[k] });
            }
        });
    }
    return o as T;
}

export function ensureDir(root: string, year = "%year", month = "%month") {
    return mkdirSync(resolve(dateReplace(monthPath(root, year, month))), { recursive: true })
}

export function countLines(filePath: string): Promise<number> {
    return new Promise((resolve, reject) => {
        let lineCount = 0;
        createReadStream(filePath)
            .on("data", (buffer) => {
                let idx = -1;
                lineCount--; // Because the loop will run once for idx=-1
                do {
                    idx = buffer.indexOf('\n', idx + 1);
                    lineCount++;
                } while (idx !== -1);
            }).on("end", () => {
                resolve(lineCount);
            }).on("error", reject);
    });
}

