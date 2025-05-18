import { loadProcessors, runProcessor } from '$src/03-process-converted-data/lib/processor';

await loadProcessors();

runProcessor('locale');
runProcessor('prototypes');
runProcessor('entities');