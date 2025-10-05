export default async function () {
    (await import("./processors/locale")).default();
    (await import("./processors/prototype")).default();
    (await import("./processors/entity/entity")).default();
    (await import("./processors/prototype/prototypes/cargoOrder")).default();
    (await import("./processors/prototype/prototypes/latheRecipe")).default();
    (await import("./processors/entity/entities/structures/lathe")).default();
}