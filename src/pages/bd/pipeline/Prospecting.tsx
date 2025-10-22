import { StagePipelineTable } from '@/components/bd/StagePipelineTable';
import { SyncControlTowerButton } from '@/components/bd/SyncControlTowerButton';

export default function Prospecting() {
  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Prospecting Stage</h1>
          <p className="text-muted-foreground">Initial outreach and qualification of potential opportunities</p>
        </div>
        <SyncControlTowerButton />
      </div>
      <StagePipelineTable
        stage="prospecting"
        title=""
        description=""
      />
    </div>
  );
}
