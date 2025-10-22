import { StagePipelineTable } from '@/components/bd/StagePipelineTable';

export default function Prospecting() {
  return (
    <StagePipelineTable
      stage="prospecting"
      title="Prospecting Stage"
      description="Initial outreach and qualification of potential opportunities"
    />
  );
}
