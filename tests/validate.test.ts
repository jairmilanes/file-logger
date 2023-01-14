import * as _ from "../src/_";
import * as _v from "../src/validation";
import {message} from "../src/validation/utils"
import {Options} from "../src";

const options: Options = {
    name: "default",
    path: "logs",
    extension: '.log',
    level: _.logLevelByName.INFO,
    write: {
        level: _.logLevel[2],
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

function assertResult(targetOpts: Record<string, any>, validation: Record<string, any>, type?: string) {
    Object.keys(targetOpts).forEach(key => {
        expect(validation).toHaveProperty(key);

        if (typeof targetOpts[key] === "object" && targetOpts[key] !== null) {
            return assertResult(targetOpts[key], validation[key], type);
        }

        expect(validation[key].length > 0).toEqual(true);

        if (type) {
            expect(validation[key].endsWith(type)).not.toBeUndefined();
        }
    })
}

function validateAndAssert(targetOpts: any) {
    const opts = JSON.parse(JSON.stringify(options));
    const validation = _v.validate(_.merge(opts, targetOpts));

    expect(typeof validation !== "boolean").toEqual(true);

    if (typeof validation !== "boolean") {
        assertResult(targetOpts, validation, message.required.substring(2));
    }
}

describe('Validate', () => {

    it('should return true for valid options', () => {
        expect(_v.validate(options)).toEqual(true);
    })

    it('should validate required options', () => {
        const targetOpts = {
            name:  null,
            path:  undefined,
            extension: "",
            level:  "",
            write: {
                format: {
                    time: null,
                    date: undefined
                }
            }
        }

        validateAndAssert(targetOpts)
    })

    it('should validate string options', () => {
        const targetOpts = {
            name:  10,
            path:  20,
            write: {
                format: {
                    time: 0,
                    date: 1
                }
            }
        };

        validateAndAssert(targetOpts);
    })

    it('should validate boolean options', () => {
        const targetOpts = {
            write: {
                stringify: "string",
                stack: 0
            },
            read: {
                stats: 1,
                json: "string"
            }
        };

        validateAndAssert(targetOpts);
    })

    it('should validate number options', () => {
        const targetOpts = {
            read: {
                lines: "15"
            }
        };

        validateAndAssert(targetOpts);
    })

    it('should validate level options', () => {
        const targetOpts = {
            level: false,
            write: {
                level: "invalid"
            },
            read: {
                filter: {
                    level: 10
                }
            }
        };

        validateAndAssert(targetOpts);
    })

    it('should validate date options', () => {
        const targetOpts = {
            read: {
                filter: {
                    start: "invalid",
                    end: "invalid"
                }
            }
        };

        validateAndAssert(targetOpts);
    });
})
