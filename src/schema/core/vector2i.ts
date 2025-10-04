import z from 'zod';

const regex = new RegExp(/(-?\d+), (-?\d+)/);

export const vector2iSchema = z.string()
    .refine(val => regex.test(val), {
        error: "Not a valid Vector2i format"
    })
    .transform(val => {
        const res = regex.exec(val)!;
        return [parseInt(res[1]), parseInt(res[2])] as [number, number]
    });