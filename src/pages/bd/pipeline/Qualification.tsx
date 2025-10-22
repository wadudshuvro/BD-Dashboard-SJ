import { StagePipelineTable } from '@/components/bd/StagePipelineTable';

export default function Qualification() {
  return (
    <StagePipelineTable
      stage="qualification"
      title="Qualification Stage"
      description="Qualifying leads and assessing opportunity fit"
    />
  );
}
