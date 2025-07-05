import { getIntegrityAsserter } from '$testUtils/getIntegrityAsserter';
import { mergeJsonObjects, type ArrayOnArrayStrategyResolver, type MapOnMapStrategyResolver } from '$utils/mergeJsonObjects';
import { test, expect, describe } from 'vitest';

describe('additive merge', () => {
    test('1 primitive + 1 primitive (unique)', () => {
        const base = {
            foo: 1
        }
        const baseIntegrity = getIntegrityAsserter(base);

        const top = {
            bar: 'hi'
        }
        const topIntegrity = getIntegrityAsserter(top);

        expect(mergeJsonObjects(base, top)).toStrictEqual({
            foo: 1,
            bar: 'hi'
        });
        baseIntegrity(base);
        topIntegrity(top);
    })
});

describe('modifying merge', () => {
    describe("source = primitive", () => {
        test('1 primitive + 1 primitive (duplicate key) = replace', () => {
            const base = {
                foo: 1
            }
            const baseIntegrity = getIntegrityAsserter(base);

            const top = {
                foo: 'hi'
            }
            const topIntegrity = getIntegrityAsserter(top);

            expect(mergeJsonObjects(base, top)).toStrictEqual({
                foo: "hi",
            })
            baseIntegrity(base);
            topIntegrity(top);
        });

        test('1 primitive + 1 array (duplicate key) = replace', () => {
            const base = {
                foo: 1
            }
            const baseIntegrity = getIntegrityAsserter(base);

            const top = {
                foo: ['hi', 'there']
            }
            const topIntegrity = getIntegrityAsserter(top);

            expect(mergeJsonObjects(base, top)).toStrictEqual({
                foo: ['hi', 'there'],
            })
            baseIntegrity(base);
            topIntegrity(top);
        });

        test('1 primitive + 1 map (duplicate key) = replace', () => {
            const base = {
                foo: 1
            }
            const baseIntegrity = getIntegrityAsserter(base);

            const top = {
                foo: { 'hi': 'there' }
            }
            const topIntegrity = getIntegrityAsserter(top);

            expect(mergeJsonObjects(base, top)).toStrictEqual({
                foo: { 'hi': 'there' }
            })
            baseIntegrity(base);
            topIntegrity(top);
        });
    })

    describe("source = array", () => {
        test('1 array + 1 primitive (duplicate key) = replace', () => {
            const base = {
                foo: [1, 2, 'four']
            }
            const baseIntegrity = getIntegrityAsserter(base);

            const top = {
                foo: 'hi'
            }
            const topIntegrity = getIntegrityAsserter(top);

            expect(mergeJsonObjects(base, top)).toStrictEqual({
                foo: "hi",
            })
            baseIntegrity(base);
            topIntegrity(top);
        });

        test('1 array + 1 array (duplicate key) = merge', () => {
            const base = {
                foo: [1, 2, 'four']
            }
            const baseIntegrity = getIntegrityAsserter(base);

            const top = {
                foo: ['hi', 'there']
            }
            const topIntegrity = getIntegrityAsserter(top);

            expect(mergeJsonObjects(base, top)).toStrictEqual({
                foo: [1, 2, 'four', 'hi', 'there'],
            })
            baseIntegrity(base);
            topIntegrity(top);
        });

        test('1 array + 1 map (duplicate key) = replace', () => {
            const base = {
                foo: [1, 2, 'four']
            }
            const baseIntegrity = getIntegrityAsserter(base);

            const top = {
                foo: { 'hi': 'there' }
            }
            const topIntegrity = getIntegrityAsserter(top);

            expect(mergeJsonObjects(base, top)).toStrictEqual({
                foo: { 'hi': 'there' }
            })
            baseIntegrity(base);
            topIntegrity(top);
        });
    });

    describe("source = map", () => {
        test('1 map + 1 primitive (duplicate key) = replace', () => {
            const base = {
                foo: { "pivo": "eto horosho" }
            }
            const baseIntegrity = getIntegrityAsserter(base);

            const top = {
                foo: 'hi'
            }
            const topIntegrity = getIntegrityAsserter(top);

            expect(mergeJsonObjects(base, top)).toStrictEqual({
                foo: "hi",
            })
            baseIntegrity(base);
            topIntegrity(top);
        });

        test('1 map + 1 array (duplicate key) = replace', () => {
            const base = {
                foo: { "pivo": "eto horosho" }
            }
            const baseIntegrity = getIntegrityAsserter(base);

            const top = {
                foo: ['hi', 'there']
            }
            const topIntegrity = getIntegrityAsserter(top);

            expect(mergeJsonObjects(base, top)).toStrictEqual({
                foo: ['hi', 'there'],
            })
            baseIntegrity(base);
            topIntegrity(top);
        });

        test('1 map + 1 map (duplicate key) = merge', () => {
            const base = {
                foo: { ":3": "UwU" }
            }
            const baseIntegrity = getIntegrityAsserter(base);

            const top = {
                foo: { 'hi': 'there' }
            }
            const topIntegrity = getIntegrityAsserter(top);

            expect(mergeJsonObjects(base, top)).toStrictEqual({
                foo: { ":3": "UwU", 'hi': 'there' }
            })
            baseIntegrity(base);
            topIntegrity(top);
        });
    });
})

describe("nesting", () => {
    test('1 level', () => {
        const base = {
            meow: "123",
            i_love_pancakes: {
                bloodred_rules: "TRUE",
                comp: [1, 2, "fouur"]
            }
        }
        const baseIntegrity = getIntegrityAsserter(base);

        const top = {
            ass: "hole",
            deep: {
                fried: "chicken"
            },
            i_love_pancakes: {
                the_answer_is: 42
            }
        }
        const topIntegrity = getIntegrityAsserter(top);

        expect(mergeJsonObjects(base, top)).toStrictEqual({
            meow: "123",
            i_love_pancakes: {
                bloodred_rules: "TRUE",
                comp: [1, 2, "fouur"],
                the_answer_is: 42
            },
            ass: "hole",
            deep: {
                fried: "chicken"
            }
        })
        baseIntegrity(base);
        topIntegrity(top);
    });
});

describe("alternative strategies", () => {
    describe("array on array", () => {
        test("strategy array on array: replace", () => {
            const base = {
                foo: [1, 2, 'four']
            }
            const baseIntegrity = getIntegrityAsserter(base);

            const top = {
                foo: ['hi', 'there']
            }
            const topIntegrity = getIntegrityAsserter(top);

            expect(mergeJsonObjects(base, top, { strategyArrayOnArray: 'replace' })).toStrictEqual({
                foo: ['hi', 'there'],
            })
            baseIntegrity(base);
            topIntegrity(top);
        });

        test("strategy array on array: preserve", () => {
            const base = {
                foo: [1, 2, 'four']
            }
            const baseIntegrity = getIntegrityAsserter(base);

            const top = {
                foo: ['hi', 'there']
            }
            const topIntegrity = getIntegrityAsserter(top);

            expect(mergeJsonObjects(base, top, { strategyArrayOnArray: 'preserve' })).toStrictEqual({
                foo: [1, 2, 'four'],
            })
            baseIntegrity(base);
            topIntegrity(top);
        });

        test("strategy array on array: function resolver", () => {
            const base = {
                foo: [1, 2, 'four']
            }
            const baseIntegrity = getIntegrityAsserter(base);

            const top = {
                foo: ['hi', 'there']
            }
            const topIntegrity = getIntegrityAsserter(top);

            const resolverReturnValue = "meow! :3";

            const resolver: ArrayOnArrayStrategyResolver =
                (key, baseValue, topValue) => {
                    expect(key).toBe("foo");
                    expect(baseValue).toStrictEqual(base.foo);
                    expect(topValue).toStrictEqual(top.foo);

                    return resolverReturnValue;
                }

            expect(mergeJsonObjects(
                base,
                top,
                {
                    strategyArrayOnArray: 'function_resolver',
                    strategyArrayOnArrayResolver: resolver
                })).toStrictEqual({
                    foo: resolverReturnValue
                })
            baseIntegrity(base);
            topIntegrity(top);
        });
    });

    describe("map on map ", () => {
        test("strategy array on map on map: replace", () => {
            const base = {
                foo: { ":3": "UwU" }
            }
            const baseIntegrity = getIntegrityAsserter(base);

            const top = {
                foo: { 'hi': 'there' }
            }
            const topIntegrity = getIntegrityAsserter(top);

            expect(mergeJsonObjects(base, top, { strategyMapOnMap: 'replace' })).toStrictEqual({
                foo: { 'hi': 'there' }
            })
            baseIntegrity(base);
            topIntegrity(top);
        });

        test("strategy array on map on map: preserve", () => {
            const base = {
                foo: { ":3": "UwU" }
            }
            const baseIntegrity = getIntegrityAsserter(base);

            const top = {
                foo: { 'hi': 'there' }
            }
            const topIntegrity = getIntegrityAsserter(top);

            expect(mergeJsonObjects(base, top, { strategyMapOnMap: 'preserve' })).toStrictEqual({
                foo: { ":3": "UwU" }
            })
            baseIntegrity(base);
            topIntegrity(top);
        });

        test("strategy array on map on map: function resolver", () => {
            const base = {
                foo: { ":3": "UwU" }
            }
            const baseIntegrity = getIntegrityAsserter(base);

            const top = {
                foo: { 'hi': 'there' }
            }
            const topIntegrity = getIntegrityAsserter(top);

            const resolverReturnValue = "meow! :3";

            const resolver: MapOnMapStrategyResolver =
                (key, baseValue, topValue) => {
                    expect(key).toBe("foo");
                    expect(baseValue).toStrictEqual(base.foo);
                    expect(topValue).toStrictEqual(top.foo);

                    return resolverReturnValue;
                }

            expect(mergeJsonObjects(
                base,
                top, {
                strategyMapOnMap: 'function_resolver',
                strategyMapOnMapResolver: resolver
            })).toStrictEqual({
                foo: resolverReturnValue
            })
            baseIntegrity(base);
            topIntegrity(top);
        });
    });
})