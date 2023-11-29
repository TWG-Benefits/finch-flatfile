function findOrThrow<T>(arr: T[], predicate: (item: T) => boolean): T {
    const result = arr.find(predicate);
    if (result === undefined) {
        throw new Error('Item not found');
    }
    return result;
}

export { findOrThrow }
