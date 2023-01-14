
export type RecursivePartial<T> = {
    [P in keyof T]?: Partial<T[P]>;
};

export type LogLevelName = "ERROR" | "WARN" | "INFO" | "HTTP" | "VERBOSE" | "DEBUG" | "SILLY"

export type MessageType = string | number | Array<string|number> | Record<string, unknown> | Error;

export interface MessageFormat {
    time: string;
    date: string;
}

export interface WriteFile {
    day: string;
    month: string;
    year: string;
}

export interface WriteOptions extends Record<string, unknown> {
    level: number | LogLevelName;
    format: MessageFormat,
    stringify: boolean;
    stack: boolean;
    file: WriteFile;
}

export interface ReadFilters {
    start?: Date | string;
    end?: Date | string;
    level?: number | LogLevelName;
}

export interface ReadOptions extends Record<string, unknown> {
    path: undefined;
    stats: boolean;
    json: boolean;
    lines: number;
    offset: number;
    filter?: ReadFilters;
}

export interface Options extends Record<string, unknown> {
    name: string;
    level: number | LogLevelName;
    path: string;
    extension: string;
    read: ReadOptions;
    write: WriteOptions;
}

export type SafeAny = string | number | boolean | symbol | null | undefined;

export type AnyArray = Array<SafeAny | Record<string, SafeAny | AnyRecord | AnyArray> | AnyArray>;

export type AnyRecord = Record<string, SafeAny | SafeArray | Record<string, unknown>>;

export type LogData = SafeAny | AnyArray | AnyRecord;

export interface LogFile {
    lines?: number;
    path: string;
    size?: number;
}
