import { useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, MoreVertical, Edit, Trash2 } from 'lucide-react';
import { useBrands } from '@/hooks/useBrands';
import { BrandDialog } from '@/components/brands/BrandDialog';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { usePagination } from '@/hooks/usePagination';
import type { Brand, CreateBrandData } from '@/types/brand';

const BrandManagement = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState<Brand | undefined>();
  const { currentPage, pageSize } = usePagination();

  const { brands, total, isLoading, createBrand, updateBrand, deleteBrand } = useBrands(
    { search: searchQuery },
    currentPage,
    pageSize
  );

  const handleCreate = (data: CreateBrandData) => {
    createBrand.mutate(data, {
      onSuccess: () => {
        setDialogOpen(false);
        setSelectedBrand(undefined);
      },
    });
  };

  const handleEdit = (brand: Brand) => {
    setSelectedBrand(brand);
    setDialogOpen(true);
  };

  const handleDelete = (brandId: string) => {
    if (confirm('Are you sure you want to deactivate this brand?')) {
      deleteBrand.mutate(brandId);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Brand Management</h1>
            <p className="text-muted-foreground">Manage all brands and their configurations</p>
          </div>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Brand
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search brands..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Brand</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Budget</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {brands.map((brand) => (
                <TableRow key={brand.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {brand.logo_url && (
                        <img src={brand.logo_url} alt={brand.name} className="w-8 h-8 rounded object-cover" />
                      )}
                      <div>
                        <p className="font-medium">{brand.name}</p>
                        <p className="text-xs text-muted-foreground">{brand.description}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={brand.type === 'internal' ? 'default' : 'secondary'}>
                      {brand.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    ${brand.monthly_budget?.toLocaleString() || 0}
                  </TableCell>
                  <TableCell>
                    <Badge variant={brand.is_active ? 'default' : 'secondary'}>
                      {brand.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(brand.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(brand)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(brand.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Deactivate
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <BrandDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setSelectedBrand(undefined);
        }}
        onSubmit={handleCreate}
        brand={selectedBrand}
        isLoading={createBrand.isPending || updateBrand.isPending}
      />
    </AdminLayout>
  );
};

export default BrandManagement;
