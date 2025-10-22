import { StagePipelineTable } from '@/components/bd/StagePipelineTable';

export default function Proposal() {
  return (
    <StagePipelineTable
      stage="proposal"
      title="Proposal Stage"
      description="Preparing and presenting proposals to qualified prospects"
    />
  );
}
