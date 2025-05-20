import type { Prototype } from '$schemas/prototype';
import { resolveInheritance } from '$src/03-process-converted-data/lib/processors/prototypes/resolveInheritance';
import { test, expect, describe } from 'vitest';

// note: no tests for how fields merge/get replaced because that
// is covered by mergeJsonObjects tests.

describe('general', () => {
    test('no parents', () => {
        const parent: Prototype = {
            id: 'foo',
            type: 'weh',
            i_want_waffles: 3
        }

        const descendant: Prototype = {
            id: 'bar',
            type: 'weh',
            bees: 'are cool'
        }

        const parentPool: Prototype[] = [parent, descendant];

        expect(resolveInheritance(descendant, parentPool)).toStrictEqual({
            id: 'bar',
            type: 'weh',
            bees: 'are cool'
        })
    });

    test('1 parent → 1 descendant; unique keys', () => {
        const parent: Prototype = {
            id: 'foo',
            type: 'weh',
            i_want_waffles: 3
        }

        const descendant: Prototype = {
            id: 'bar',
            type: 'weh',
            parent: 'foo',
            bees: 'are cool'
        }

        const parentPool: Prototype[] = [parent, descendant];

        expect(resolveInheritance(descendant, parentPool)).toStrictEqual({
            id: 'bar',
            type: 'weh',
            i_want_waffles: 3,
            bees: 'are cool'
        })
    });

    test('1 parent → 1 parent → 1 descendant; unique keys', () => {
        const parent1: Prototype = {
            id: 'foo',
            type: 'weh',
            i_want_waffles: 3
        }

        const parent2: Prototype = {
            id: 'bar',
            type: 'weh',
            parent: 'foo',
            bees: 'are cool'
        }

        const descendant: Prototype = {
            id: 'alakasam',
            type: 'weh',
            parent: 'bar',
            meow: 'mrrr'
        }

        const parentPool: Prototype[] = [parent1, parent2, descendant];

        expect(resolveInheritance(descendant, parentPool)).toStrictEqual({
            id: 'alakasam',
            type: 'weh',
            i_want_waffles: 3,
            bees: 'are cool',
            meow: 'mrrr'
        })
    })
})

describe('abstract', () => {
    test('1 parent → 1 descendant; abstract parent, abstract is removed on final', () => {
        const parent: Prototype = {
            id: 'foo',
            type: 'weh',
            abstract: true,
            i_want_waffles: 3
        }

        const descendant: Prototype = {
            id: 'bar',
            type: 'weh',
            parent: 'foo',
            bees: 'are cool'
        }

        const parentPool: Prototype[] = [parent, descendant];

        const res = resolveInheritance(descendant, parentPool);
        expect(res).toStrictEqual({
            id: 'bar',
            type: 'weh',
            i_want_waffles: 3,
            bees: 'are cool'
        });
    });

    test('1 parent → 1 descendant; abstract both parent and descendant, abstract is kept on final', () => {
        const parent: Prototype = {
            id: 'foo',
            type: 'weh',
            abstract: true,
            i_want_waffles: 3
        }

        const descendant: Prototype = {
            id: 'bar',
            type: 'weh',
            parent: 'foo',
            abstract: true,
            bees: 'are cool'
        }

        const parentPool: Prototype[] = [parent, descendant];

        expect(resolveInheritance(descendant, parentPool)).toStrictEqual({
            id: 'bar',
            type: 'weh',
            abstract: true,
            i_want_waffles: 3,
            bees: 'are cool'
        })
    });
});

describe('entities', () => {
    // most of these are based off of https://hackmd.io/@Slart/S1hsoGFm1l by @Slartibartfast, on the maints

    const tagA1: Prototype = {
        type: 'tag',
        id: 'TagA1'
    }

    const tagA2 = {
        type: 'tag',
        id: 'TagA2'
    }

    const tagB = {
        type: 'tag',
        id: 'TagB'
    }

    const parentA: Prototype =
    {

        type: "entity",
        id: "ParentA",
        abstract: true,
        components: [
            {
                type: 'Tag',
                tags: ["TagA1", "TagA2"]
            },
            {
                type: "MeleeWeapon", // turn the entity into a weapon
                damage: {
                    types: [
                        { Heat: 10 }
                    ]
                }
            }
        ]
    }

    const parentB: Prototype = {
        type: "entity",
        id: "ParentB",
        abstract: true,
        components: [
            {
                type: "Tag",
                tags: ["TagB"]
            },
            {
                type: "PointLight", // make it glow
                color: "green"
            }
        ]
    }

    const parentC: Prototype = {
        type: "entity",
        id: "ParentC",
        abstract: true,
        components: [
            {
                type: "Sprite",
                state: "plushie_hampter" // # change the sprite state only, but not the rsi
            }
        ]
    }

    // A simple item with a lizard sprite.
    // A sprite needs both the 'sprite' datafield, which contains the path to the rsi folder the image file is in.
    // And the 'state' datafield which is the name of the.png file itself.
    const testItem1: Prototype = {
        type: "entity",
        id: "TestItem1",
        name: "test lizard 1",
        components: [
            {
                type: "Sprite",
                sprite: "Objects/Fun/toys.rsi",
                state: "plushie_lizard"
            }
        ]
    }

    // The lizard sprite state is inherited first.
    // The state is not overwritten by the hampter because it already exists.
    const testItem2: Prototype = {
        type: "entity",
        parent: ["TestItem1", "ParentC"],
        id: "TestItem2",
        name: "test lizard 2"
    }

    // If we inherit in this order the state will be taken from ParentC.
    // TestItem1 will then add the rsi path, but not overwrite the state.
    const testItem3: Prototype = {
        type: "entity",
        parent: ["ParentC", "TestItem1"],
        id: "TestItem3",
        name: "test hampter 3"
    }

    // This time we manually overwrite the inherited state.
    // The rsi remains unchanged.
    // The result will be another hampter.
    const testItem4: Prototype = {
        type: "entity",
        parent: "TestItem1",
        id: "TestItem4",
        name: "test hampter 4",
        components: [
            {
                type: "Sprite",
                state: "plushie_hampter"
            }
        ]
    }

    // This item will inherit the tags from ParentA, but not from ParentB.
    // To fix this we have to redefine the list manually and include all three tags.
    // The item will have both the PointLightComponent and the MeleeWeaponComponent and the corresponding datafields set in the parents.
    const testItem5: Prototype = {
        type: "entity",
        parent: ["TestItem1", "ParentA", "ParentB"],
        id: "TestItem5",
        name: "test lizard 5",
        components: [
            {
                type: "Tag",
                tags: ["TagA1", "TagA2", "TagB"]
            }
        ]
    }

    describe("one parent → child inheritance", () => {
        test('duplicate components (by type) - merge duplicates (no field conflicts)', () => {
            const parents: Prototype[] = [
                {
                    type: "entity",
                    id: "TestItem1",
                    name: "test lizard 1",
                    components: [
                        {
                            type: "Sprite",
                            sprite: "Objects/Fun/toys.rsi",
                        }
                    ]
                }
            ];

            const descendant: Prototype = {
                type: "entity",
                id: "TestItem2",
                name: "test lizard 2",
                parent: "TestItem1",
                components: [
                    {
                        type: "Sprite",
                        state: "plushie_lizard"
                    }
                ]
            };

            const parentPool: Prototype[] = [...parents, descendant];

            const res = resolveInheritance(descendant, parentPool);
            expect(res).toStrictEqual({
                type: "entity",
                id: "TestItem2",
                name: "test lizard 2",
                components: [
                    {
                        type: "Sprite",
                        sprite: "Objects/Fun/toys.rsi",
                        state: "plushie_lizard"
                    }
                ]
            });
        });

        test('duplicate components (by type), duplicate field (primitive on primitive) - replace', () => {
            const parents: Prototype[] = [
                {
                    type: "entity",
                    id: "TestItem1",
                    name: "test lizard 1",
                    components: [
                        {
                            type: "Sprite",
                            sprite: "Objects/Fun/toys.rsi",
                        }
                    ]
                }
            ];

            const descendant: Prototype = {
                type: "entity",
                id: "TestItem2",
                name: "test lizard 2",
                parent: "TestItem1",
                components: [
                    {
                        type: "Sprite",
                        sprite: "Objects/VeryFun/guns.rsi",
                    }
                ]
            };

            const parentPool: Prototype[] = [...parents, descendant];

            const res = resolveInheritance(descendant, parentPool);
            expect(res).toStrictEqual({
                type: "entity",
                id: "TestItem2",
                name: "test lizard 2",
                components: [
                    {
                        type: "Sprite",
                        sprite: "Objects/VeryFun/guns.rsi",
                    }
                ]
            });
        });


        test('duplicate components (by type), duplicate field (array on array) - replace', () => {
            const parents: Prototype[] = [
                {
                    type: "entity",
                    id: "TestItem1",
                    name: "test lizard 1",
                    components: [
                        {
                            type: "Sprite",
                            sprite: "Objects/Fun/toys.rsi",
                            layers: [
                                { state: "shark" },
                                { state: "shark-gun" },
                            ]
                        }
                    ]
                }
            ];

            const descendant: Prototype = {
                type: "entity",
                id: "TestItem2",
                name: "test lizard 2",
                parent: "TestItem1",
                components: [
                    {
                        type: "Sprite",
                        sprite: "Objects/VeryFun/guns.rsi",
                        layers: [
                            { state: "lizard" },
                        ]
                    }
                ]
            };

            const parentPool: Prototype[] = [...parents, descendant];

            const res = resolveInheritance(descendant, parentPool);
            expect(res).toStrictEqual({
                type: "entity",
                id: "TestItem2",
                name: "test lizard 2",
                components: [
                    {
                        type: "Sprite",
                        sprite: "Objects/VeryFun/guns.rsi",
                        layers: [
                            { state: "lizard" },
                        ]
                    }
                ]
            });
        });

        test('duplicate components (by type), duplicate field (map on map) - replace', () => {
            const parents: Prototype[] = [
                {
                    type: "entity",
                    id: "MobXeno",
                    name: "burrower",
                    components: [
                        {
                            type: "MeleeWeapon",
                            damage: {
                                groups: {
                                    Brute: 5
                                }
                            }
                        }
                    ]
                }
            ];

            const descendant: Prototype = {
                type: "entity",
                id: "MobXenoRunner",
                name: "runner",
                parent: "MobXeno",
                components: [
                    {
                        type: "MeleeWeapon",
                        damage: {
                            groups: {
                                Brute: 15
                            }
                        }
                    }
                ]
            };

            const parentPool: Prototype[] = [...parents, descendant];

            const res = resolveInheritance(descendant, parentPool);
            expect(res).toStrictEqual({
                type: "entity",
                id: "MobXenoRunner",
                name: "runner",
                components: [
                    {
                        type: "MeleeWeapon",
                        damage: {
                            groups: {
                                Brute: 15
                            }
                        }
                    }
                ]
            });
        });
    })

    describe("parent + parent → child inheritance", () => {
        test('duplicate component field - preserve first parent field duplicate', () => {
            const parents: Prototype[] = [
                {
                    type: "entity",
                    id: "TestItem1",
                    name: "test lizard 1",
                    components: [
                        {
                            type: "Sprite",
                            sprite: "Objects/Fun/toys.rsi",
                            state: "plushie_lizard"
                        }
                    ]
                }, {
                    type: "entity",
                    id: "ParentC",
                    abstract: true,
                    components: [
                        {
                            type: "Sprite",
                            state: "plushie_hampter" // # change the sprite state only, but not the rsi
                        }
                    ]
                }
            ];

            const descendant: Prototype = {
                type: "entity",
                parent: ["TestItem1", "ParentC"],
                id: "TestItem2",
                name: "test lizard 2"
            };

            const parentPool: Prototype[] = [...parents, descendant];

            const res = resolveInheritance(descendant, parentPool);
            expect(res).toStrictEqual({
                type: "entity",
                id: "TestItem2",
                name: "test lizard 2",
                components: [
                    {
                        type: "Sprite",
                        sprite: "Objects/Fun/toys.rsi",
                        state: "plushie_lizard"
                    }
                ]
            });
        })
    });
})