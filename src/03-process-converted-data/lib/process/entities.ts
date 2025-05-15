import { resolveInheritance } from '$schemas/utils';
import { loadPrototypes } from '$src/03-process-converted-data/lib/loadPrototypes';
import { outputSubstepDirPaths, stepAbsDirPaths } from '$src/preset';
import { toOsPath } from '$utils/toOsPath';
import fs from 'fs-extra';

export default function () {
    const protos = loadPrototypes(); // same ref
    let entities = protos.filter(proto => proto.type === 'entity');

    const saveDirPath = toOsPath(`${stepAbsDirPaths.outputData}/${outputSubstepDirPaths.entities}`);
    fs.ensureDirSync(saveDirPath);


    fs.writeFileSync(
        toOsPath(`${saveDirPath}/${outputSubstepDirPaths.entities_raw}`),
        JSON.stringify(entities, null, 4),
    );


    entities = entities.map(entity => resolveInheritance(entity, entities, 'parent', 'id'));

    fs.writeFileSync(
        toOsPath(`${saveDirPath}/${outputSubstepDirPaths.entities_inheritance_resolved}`),
        JSON.stringify(entities, null, 4)
    );
}