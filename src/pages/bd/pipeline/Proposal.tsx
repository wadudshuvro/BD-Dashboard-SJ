import { StagePipelineTable } from '@/components/bd/StagePipelineTable';
import { SyncHubSpotButton } from '@/components/bd/SyncHubSpotButton';

export default function Proposal() {
  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Discovery</h1>
          <p className="text-muted-foreground">Preparing and presenting proposals to qualified prospects</p>
        </div>
        <SyncHubSpotButton />
      </div>
      <StagePipelineTable
        stage="proposal"
        title=""
        description=""
      />
    </div>
  );
}
