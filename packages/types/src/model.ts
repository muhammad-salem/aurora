
export interface Model {
    __observable: { [key: string]: Function[] };
    subscribeModel(eventName: string, callback: Function): void;
    emitChangeModel(eventName: string, source?: any[]): void;
}

export function isModel(object: any): object is Model {
    return object.__observable
        && object.subscribeModel
        && object.emitChangeModel;
}
