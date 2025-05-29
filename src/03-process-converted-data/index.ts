import { loadProcessors, runProcessor } from '$process/lib/processor';

await loadProcessors();

runProcessor('locale');
runProcessor('prototypes');
runProcessor('entities');
runProcessor('cargo_orders');