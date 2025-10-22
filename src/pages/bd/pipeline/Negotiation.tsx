import { StagePipelineTable } from '@/components/bd/StagePipelineTable';

export default function Negotiation() {
  return (
    <StagePipelineTable
      stage="negotiation"
      title="Negotiation Stage"
      description="Finalizing terms and closing deals"
    />
  );
}
