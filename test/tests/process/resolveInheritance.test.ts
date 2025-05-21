import type { Prototype } from '$schemas/prototype/base';
import { createProtoPool, resolveInheritance, type ProtoPool } from '$src/03-process-converted-data/lib/processors/prototypes/resolveInheritance';
import { getIntegrityAsserter } from '$testUtils/getIntegrityAsserter';
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
        const parentIntegrity = getIntegrityAsserter(parent);

        const descendant: Prototype = {
            id: 'bar',
            type: 'weh',
            bees: 'are cool'
        }
        const descendantIntegrity = getIntegrityAsserter(descendant);

        const parentPool: ProtoPool = createProtoPool([parent, descendant]);

        expect(resolveInheritance(descendant, parentPool)).toStrictEqual({
            id: 'bar',
            type: 'weh',
            bees: 'are cool'
        });
        parentIntegrity(parent);
        descendantIntegrity(descendant);
    });

    test('1 parent → 1 descendant; unique keys', () => {
        const parent: Prototype = {
            id: 'foo',
            type: 'weh',
            i_want_waffles: 3
        }
        const parentIntegrity = getIntegrityAsserter(parent);

        const descendant: Prototype = {
            id: 'bar',
            type: 'weh',
            parent: 'foo',
            bees: 'are cool'
        }
        const descendantIntegrity = getIntegrityAsserter(descendant);

        const parentPool: ProtoPool = createProtoPool([parent, descendant]);

        expect(resolveInheritance(descendant, parentPool)).toStrictEqual({
            id: 'bar',
            type: 'weh',
            i_want_waffles: 3,
            bees: 'are cool'
        })
        parentIntegrity(parent);
        descendantIntegrity(descendant);
    });

    test('1 parent → 1 parent → 1 descendant; unique keys', () => {
        const parent1: Prototype = {
            id: 'foo',
            type: 'weh',
            i_want_waffles: 3
        }
        const parent1Integrity = getIntegrityAsserter(parent1);

        const parent2: Prototype = {
            id: 'bar',
            type: 'weh',
            parent: 'foo',
            bees: 'are cool'
        }

        const parent2Integrity = getIntegrityAsserter(parent2);

        const descendant: Prototype = {
            id: 'alakasam',
            type: 'weh',
            parent: 'bar',
            meow: 'mrrr'
        }
        const descendantIntegrity = getIntegrityAsserter(descendant);

        const parentPool: ProtoPool = createProtoPool([parent1, parent2, descendant]);

        expect(resolveInheritance(descendant, parentPool)).toStrictEqual({
            id: 'alakasam',
            type: 'weh',
            i_want_waffles: 3,
            bees: 'are cool',
            meow: 'mrrr'
        })
        parent1Integrity(parent1);
        parent2Integrity(parent2);
        descendantIntegrity(descendant);
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
        const parentIntegrity = getIntegrityAsserter(parent);

        const descendant: Prototype = {
            id: 'bar',
            type: 'weh',
            parent: 'foo',
            bees: 'are cool'
        }
        const descendantIntegrity = getIntegrityAsserter(descendant);

        const parentPool: ProtoPool = createProtoPool([parent, descendant]);

        const res = resolveInheritance(descendant, parentPool);
        expect(res).toStrictEqual({
            id: 'bar',
            type: 'weh',
            i_want_waffles: 3,
            bees: 'are cool'
        });
        parentIntegrity(parent);
        descendantIntegrity(descendant);
    });

    test('1 parent → 1 descendant; abstract both parent and descendant, abstract is kept on final', () => {
        const parent: Prototype = {
            id: 'foo',
            type: 'weh',
            abstract: true,
            i_want_waffles: 3
        }
        const parentIntegrity = getIntegrityAsserter(parent);

        const descendant: Prototype = {
            id: 'bar',
            type: 'weh',
            parent: 'foo',
            abstract: true,
            bees: 'are cool'
        }
        const descendantIntegrity = getIntegrityAsserter(descendant);

        const parentPool: ProtoPool = createProtoPool([parent, descendant]);

        expect(resolveInheritance(descendant, parentPool)).toStrictEqual({
            id: 'bar',
            type: 'weh',
            abstract: true,
            i_want_waffles: 3,
            bees: 'are cool'
        })
        parentIntegrity(parent);
        descendantIntegrity(descendant);
    });
});

describe('entities', () => {
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
            const parentsIntegrity = getIntegrityAsserter(parents);

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
            const descendantIntegrity = getIntegrityAsserter(descendant);

            const parentPool: ProtoPool = createProtoPool([...parents, descendant]);

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
            parentsIntegrity(parents);
            descendantIntegrity(descendant);
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
            const parentsIntegrity = getIntegrityAsserter(parents);

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
            const descendantIntegrity = getIntegrityAsserter(descendant);

            const parentPool: ProtoPool = createProtoPool([...parents, descendant]);

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
            parentsIntegrity(parents);
            descendantIntegrity(descendant);
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
            const parentsIntegrity = getIntegrityAsserter(parents);

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
            const descendantIntegrity = getIntegrityAsserter(descendant);

            const parentPool: ProtoPool = createProtoPool([...parents, descendant]);

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
            parentsIntegrity(parents);
            descendantIntegrity(descendant);
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
            const parentsIntegrity = getIntegrityAsserter(parents);

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
            const descendantIntegrity = getIntegrityAsserter(descendant);

            const parentPool: ProtoPool = createProtoPool([...parents, descendant]);

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
            parentsIntegrity(parents);
            descendantIntegrity(descendant);
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
            const parentsIntegrity = getIntegrityAsserter(parents);

            const descendant: Prototype = {
                type: "entity",
                parent: ["TestItem1", "ParentC"],
                id: "TestItem2",
                name: "test lizard 2"
            };
            const descendantIntegrity = getIntegrityAsserter(descendant);

            const parentPool: ProtoPool = createProtoPool([...parents, descendant]);

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
            parentsIntegrity(parents);
            descendantIntegrity(descendant);
        })
    });
})