import { resolveInheritance } from '$schemas/utils';
import { loadPrototypes } from '$src/03-process-converted-data/lib/loadPrototypes';
import { stepAbsDirPaths } from '$src/preset';
import { toOsPath } from '$utils/toOsPath';
import fs from 'fs-extra';

export default function () {
    const protos = loadPrototypes(); // same ref
    let entities = protos.filter(proto => proto.type === 'entity');

    const saveDirPath = toOsPath(`${stepAbsDirPaths.outputData}/entities`);
    fs.ensureDirSync(saveDirPath);

    fs.writeFileSync(toOsPath(`${saveDirPath}/01-entities-raw.json`), JSON.stringify(entities, null, 4));


    entities = entities.map(entity => resolveInheritance(entity, entities, 'parent', 'id'));

    fs.writeFileSync(toOsPath(`${saveDirPath}/02-entities-inheritance-resolved.json`), JSON.stringify(entities, null, 4));
}