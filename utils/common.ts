import moment from "moment";
import { Moment } from "moment";

function findOrThrow<T>(arr: T[], predicate: (item: T) => boolean): T {
    const result = arr.find(predicate);
    if (result === undefined) {
        throw new Error('Item not found');
    }
    return result;
}

function timer(start: Moment, end: Moment) {
    const duration = moment.duration(end.diff(start));
    console.log("Duration: " + duration.asSeconds() + " seconds");
}


export { timer, findOrThrow }

