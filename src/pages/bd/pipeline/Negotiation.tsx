import { StagePipelineTable } from '@/components/bd/StagePipelineTable';
import { SyncControlTowerButton } from '@/components/bd/SyncControlTowerButton';

export default function Negotiation() {
  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Proposal Shared</h1>
          <p className="text-muted-foreground">Finalizing terms and closing deals</p>
        </div>
        <SyncControlTowerButton />
      </div>
      <StagePipelineTable
        stage="negotiation"
        title=""
        description=""
      />
    </div>
  );
}
