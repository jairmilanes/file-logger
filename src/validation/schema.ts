import {Schema} from "./types";
import {isDate, isExtension, isLevel, message} from "./utils";

export const schema: Schema = {
    children: [
        {
            name: "name",
            required: true,
            type: "string"
        },
        {
            name: "path",
            required: true,
            type: "string"
        },
        {
            name: "extension",
            required: true,
            validations: [
                { fn: isExtension, message: "%s must be a valid extension." }
            ]
        },
        {
            name: "level",
            required: true,
            validations: [
                { fn: isLevel, message: message.level }
            ]
        },
        {
            name: "write",
            required: true,
            type: "object",
            children: [
                {
                    name: "level",
                    required: true,
                    validations: [
                        { fn: isLevel, message: message.level}
                    ]
                },
                {
                    name: "format",
                    type: "object",
                    required: true,
                    children: [
                        {
                            name: "time",
                            type: "string",
                            required: true
                        },
                        {
                            name: "date",
                            type: "string",
                            required: true
                        }
                    ]
                },
                {
                    name: "stringify",
                    type: "boolean"
                },
                {
                    name: "stack",
                    type: "boolean"
                },
                {
                    name: "file",
                    type: "object",
                    children: [
                        {
                            name: "day",
                            type: "string"
                        },
                        {
                            name: "month",
                            type: "string"
                        },
                        {
                            name: "year",
                            type: "string"
                        }
                    ]
                }
            ]
        },
        {
            name: "read",
            type: "object",
            required: true,
            children: [
                {
                    name: "path",
                    type: "string"
                },
                {
                    name: "stats",
                    type: "boolean"
                },
                {
                    name: "json",
                    type: "boolean"
                },
                {
                    name: "lines",
                    required: true,
                    type: "number"
                },
                {
                    name: "filter",
                    required: true,
                    type: "object",
                    children: [
                        {
                            name: "start",
                            validations: [
                                { fn: isDate, message: message.date}
                            ]
                        },
                        {
                            name: "end",
                            validations: [
                                { fn: isDate, message: message.date }
                            ]
                        },
                        {
                            name: "level",
                            validations: [
                                { fn: isLevel, message: message.level }
                            ]
                        }
                    ]
                }
            ]
        },
    ],
}
