import { StagePipelineTable } from '@/components/bd/StagePipelineTable';
import { SyncControlTowerButton } from '@/components/bd/SyncControlTowerButton';

export default function Qualification() {
  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Estimation</h1>
          <p className="text-muted-foreground">Qualifying leads and assessing opportunity fit</p>
        </div>
        <SyncControlTowerButton />
      </div>
      <StagePipelineTable
        stage="qualification"
        title=""
        description=""
      />
    </div>
  );
}
