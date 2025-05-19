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