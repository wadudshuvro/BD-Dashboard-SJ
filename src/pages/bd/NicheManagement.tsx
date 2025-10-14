import { useState } from 'react';
import { Plus, Filter, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePods } from '@/hooks/usePods';
import { useTargetNiches } from '@/hooks/useTargetNiches';
import { NicheCard } from '@/components/bd/NicheCard';
import { NicheDialog } from '@/components/bd/NicheDialog';

export default function NicheManagement() {
  const { pods } = usePods();
  const { niches, createNiche, updateNiche, deleteNiche } = useTargetNiches();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingNiche, setEditingNiche] = useState(null);
  const [selectedPod, setSelectedPod] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredNiches = niches.filter((niche) => {
    const matchesPod = selectedPod === 'all' || niche.pod_id === selectedPod;
    const matchesSearch = niche.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         niche.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || niche.status === statusFilter;
    return matchesPod && matchesSearch && matchesStatus;
  });

  const groupedNiches = pods.map((pod) => ({
    pod,
    niches: filteredNiches.filter((n) => n.pod_id === pod.id),
  }));

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Target Niche Management</h1>
          <p className="text-muted-foreground">Define and manage your target market segments</p>
        </div>
        <Button onClick={() => { setEditingNiche(null); setDialogOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          Create Niche
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search niches..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedPod} onValueChange={setSelectedPod}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by POD" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All PODs</SelectItem>
            {pods.map((pod) => (
              <SelectItem key={pod.id} value={pod.id}>
                {pod.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="researching">Researching</SelectItem>
            <SelectItem value="paused">Paused</SelectItem>
            <SelectItem value="retired">Retired</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="grid">
        <TabsList>
          <TabsTrigger value="grid">Grid View</TabsTrigger>
          <TabsTrigger value="pods">By POD</TabsTrigger>
        </TabsList>

        <TabsContent value="grid" className="mt-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredNiches.map((niche) => (
              <NicheCard
                key={niche.id}
                niche={niche}
                onEdit={(n) => { setEditingNiche(n); setDialogOpen(true); }}
                onDelete={(id) => deleteNiche.mutate(id)}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="pods" className="mt-6">
          <div className="space-y-8">
            {groupedNiches.map(({ pod, niches }) => (
              <div key={pod.id}>
                <h2 className="text-2xl font-bold mb-4">{pod.name}</h2>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {niches.map((niche) => (
                    <NicheCard
                      key={niche.id}
                      niche={niche}
                      onEdit={(n) => { setEditingNiche(n); setDialogOpen(true); }}
                      onDelete={(id) => deleteNiche.mutate(id)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <NicheDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        niche={editingNiche}
        pods={pods}
        onSave={async (data) => {
          if (editingNiche) {
            await updateNiche.mutateAsync({ id: editingNiche.id, ...data });
          } else {
            await createNiche.mutateAsync(data);
          }
          setDialogOpen(false);
        }}
      />
    </div>
  );
}
