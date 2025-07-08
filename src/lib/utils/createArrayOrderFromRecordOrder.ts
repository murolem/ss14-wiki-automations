/**
 * Creates an array of record keys in an order defined in a given object, based on object's number-only values.
 * 
 * @example 
const orderRecord = {
    stationType: 1,
    id: 2,
    staticRecipes: 3,
};

const orderArray = createArrayOrderFromOrderRecord(orderRecord);

console.log(orderArray);
// ^ prints:
// [
//     'stationType',
//     'id',
//     'staticRecipes'
// ]

 */
export function createArrayOrderFromOrderRecord(orderRecord: Record<string | number, number>): (string | number)[] {
    return Object
        .keys(orderRecord)
        .sort((a, b) =>
            Object.entries(orderRecord).find(e => e[0] === a)![1]
            - Object.entries(orderRecord).find(e => e[0] === b)![1]
        );
}