import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  LayoutDashboard,
  ClipboardList,
  BarChart3,
  Settings,
  Shield,
  Eye,
  Edit,
  Users,
  Briefcase,
  X,
  Save,
  RotateCcw
} from "lucide-react";
import { User, UserPermissions, mockBrands } from "@/data/mockData";

interface UserPermissionDialogProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (userId: string, permissions: UserPermissions) => void;
}

const ModuleIcons = {
  dashboard: LayoutDashboard,
  taskHub: ClipboardList,
  reports: BarChart3,
  settings: Settings,
  adminPanel: Shield,
};

const getDefaultPermissions = (role: 'super_admin' | 'manager' | 'pm' | 'user'): UserPermissions => {
  switch (role) {
    case 'super_admin':
      return {
        modules: {
          dashboard: true,
          taskHub: true,
          reports: true,
          settings: true,
          adminPanel: true,
        },
        brands: {}
      };
    case 'manager':
      return {
        modules: {
          dashboard: true,
          taskHub: true,
          reports: true,
          settings: true,
          adminPanel: false,
        },
        brands: {}
      };
    case 'pm':
      return {
        modules: {
          dashboard: true,
          taskHub: true,
          reports: true,
          settings: true,
          adminPanel: false,
        },
        brands: {}
      };
    case 'user':
      return {
        modules: {
          dashboard: true,
          taskHub: true,
          reports: false,
          settings: false,
          adminPanel: false,
        },
        brands: {}
      };
  }
};

export const UserPermissionDialog = ({ user, isOpen, onClose, onSave }: UserPermissionDialogProps) => {
  const [permissions, setPermissions] = useState<UserPermissions>(
    user?.permissions || getDefaultPermissions(user?.role || 'user')
  );

  const handleModulePermissionChange = (module: keyof UserPermissions['modules'], value: boolean) => {
    setPermissions(prev => ({
      ...prev,
      modules: {
        ...prev.modules,
        [module]: value
      }
    }));
  };

  const handleBrandAccessChange = (brandId: string, hasAccess: boolean) => {
    setPermissions(prev => ({
      ...prev,
      brands: {
        ...prev.brands,
        [brandId]: hasAccess ? {
          access: true,
          level: 'viewer',
          permissions: {
            viewKPIs: true,
            editKPIs: false,
            manageTeam: false,
            editSettings: false,
          }
        } : { ...prev.brands[brandId], access: false }
      }
    }));
  };

  const handleBrandLevelChange = (brandId: string, level: 'owner' | 'member' | 'viewer') => {
    const levelPermissions = {
      owner: { viewKPIs: true, editKPIs: true, manageTeam: true, editSettings: true },
      member: { viewKPIs: true, editKPIs: false, manageTeam: false, editSettings: false },
      viewer: { viewKPIs: true, editKPIs: false, manageTeam: false, editSettings: false },
    };

    setPermissions(prev => ({
      ...prev,
      brands: {
        ...prev.brands,
        [brandId]: {
          ...prev.brands[brandId],
          level,
          permissions: levelPermissions[level]
        }
      }
    }));
  };

  const handleBrandPermissionChange = (
    brandId: string, 
    permission: keyof UserPermissions['brands'][string]['permissions'], 
    value: boolean
  ) => {
    setPermissions(prev => ({
      ...prev,
      brands: {
        ...prev.brands,
        [brandId]: {
          ...prev.brands[brandId],
          permissions: {
            ...prev.brands[brandId].permissions,
            [permission]: value
          }
        }
      }
    }));
  };

  const resetToDefaults = () => {
    setPermissions(getDefaultPermissions(user?.role || 'user'));
  };

  const handleSave = () => {
    if (user) {
      onSave(user.id, permissions);
      onClose();
    }
  };

  if (!user) return null;

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-destructive text-destructive-foreground';
      case 'manager': return 'bg-primary text-primary-foreground';
      case 'user': return 'bg-secondary text-secondary-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-sm font-medium text-primary">
                {user.name.split(' ').map(n => n[0]).join('')}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span>Manage Permissions - {user.name}</span>
                <Badge className={getRoleColor(user.role)}>
                  {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground font-normal">{user.email}</p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="modules" className="flex-1">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="modules">Module Access</TabsTrigger>
            <TabsTrigger value="brands">Brand Permissions</TabsTrigger>
            <TabsTrigger value="summary">Summary</TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[500px] mt-4">
            <TabsContent value="modules" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Application Modules</CardTitle>
                  <CardDescription>
                    Control access to main application modules and features
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {Object.entries(permissions.modules).map(([module, hasAccess]) => {
                    const Icon = ModuleIcons[module as keyof typeof ModuleIcons];
                    const moduleNames = {
                      dashboard: 'Dashboard',
                      taskHub: 'Task Hub',
                      reports: 'Reports',
                      settings: 'Settings',
                      adminPanel: 'Admin Panel',
                    };

                    return (
                      <div key={module} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Icon className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <Label className="text-base font-medium">
                              {moduleNames[module as keyof typeof moduleNames]}
                            </Label>
                            <p className="text-sm text-muted-foreground">
                              {module === 'dashboard' && 'Access to main dashboard and analytics'}
                              {module === 'taskHub' && 'Manage tasks and projects'}
                              {module === 'reports' && 'View and generate reports'}
                              {module === 'settings' && 'Modify user and system settings'}
                              {module === 'adminPanel' && 'Full administrative access'}
                            </p>
                          </div>
                        </div>
                        <Checkbox
                          checked={hasAccess}
                          onCheckedChange={(checked) => 
                            handleModulePermissionChange(module as keyof UserPermissions['modules'], Boolean(checked))
                          }
                        />
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="brands" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Brand Access & Permissions</CardTitle>
                  <CardDescription>
                    Configure brand-specific access levels and permissions
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {mockBrands.map((brand) => {
                    const brandPermission = permissions.brands[brand.id];
                    const hasAccess = brandPermission?.access || false;

                    return (
                      <div key={brand.id} className="border rounded-lg p-4 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Briefcase className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <Label className="text-base font-medium">{brand.name}</Label>
                              <p className="text-sm text-muted-foreground">{brand.description}</p>
                            </div>
                          </div>
                          <Checkbox
                            checked={hasAccess}
                            onCheckedChange={(checked) => 
                              handleBrandAccessChange(brand.id, Boolean(checked))
                            }
                          />
                        </div>

                        {hasAccess && (
                          <div className="ml-8 space-y-4 border-l pl-4">
                            <div className="flex items-center gap-4">
                              <Label className="text-sm font-medium min-w-[80px]">Access Level:</Label>
                              <Select
                                value={brandPermission?.level || 'viewer'}
                                onValueChange={(value) => 
                                  handleBrandLevelChange(brand.id, value as 'owner' | 'member' | 'viewer')
                                }
                              >
                                <SelectTrigger className="w-40">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="viewer">Viewer</SelectItem>
                                  <SelectItem value="member">Member</SelectItem>
                                  <SelectItem value="owner">Owner</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-3">
                              <Label className="text-sm font-medium">Specific Permissions:</Label>
                              <div className="grid grid-cols-2 gap-3">
                                {Object.entries(brandPermission?.permissions || {}).map(([perm, value]) => {
                                  const permissionNames = {
                                    viewKPIs: 'View KPIs',
                                    editKPIs: 'Edit KPIs',
                                    manageTeam: 'Manage Team',
                                    editSettings: 'Edit Settings',
                                  };

                                  const permissionIcons = {
                                    viewKPIs: Eye,
                                    editKPIs: Edit,
                                    manageTeam: Users,
                                    editSettings: Settings,
                                  };

                                  const Icon = permissionIcons[perm as keyof typeof permissionIcons];

                                  return (
                                    <div key={perm} className="flex items-center space-x-2">
                                      <Checkbox
                                        id={`${brand.id}-${perm}`}
                                        checked={value}
                                        onCheckedChange={(checked) =>
                                          handleBrandPermissionChange(
                                            brand.id,
                                            perm as keyof UserPermissions['brands'][string]['permissions'],
                                            Boolean(checked)
                                          )
                                        }
                                      />
                                      <Label
                                        htmlFor={`${brand.id}-${perm}`}
                                        className="text-sm flex items-center gap-2"
                                      >
                                        <Icon className="h-3 w-3" />
                                        {permissionNames[perm as keyof typeof permissionNames]}
                                      </Label>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="summary" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Permission Summary</CardTitle>
                  <CardDescription>
                    Review all permissions before saving changes
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h4 className="font-medium mb-3">Module Access</h4>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(permissions.modules)
                        .filter(([, hasAccess]) => hasAccess)
                        .map(([module]) => {
                          const moduleNames = {
                            dashboard: 'Dashboard',
                            taskHub: 'Task Hub',
                            reports: 'Reports',
                            settings: 'Settings',
                            adminPanel: 'Admin Panel',
                          };
                          return (
                            <Badge key={module} variant="secondary">
                              {moduleNames[module as keyof typeof moduleNames]}
                            </Badge>
                          );
                        })}
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-medium mb-3">Brand Access</h4>
                    <div className="space-y-2">
                      {Object.entries(permissions.brands)
                        .filter(([, brandPerm]) => brandPerm.access)
                        .map(([brandId, brandPerm]) => {
                          const brand = mockBrands.find(b => b.id === brandId);
                          if (!brand) return null;

                          return (
                            <div key={brandId} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                              <div>
                                <span className="font-medium">{brand.name}</span>
                                <span className="text-sm text-muted-foreground ml-2">
                                  ({brandPerm.level})
                                </span>
                              </div>
                              <div className="flex gap-1">
                                {Object.entries(brandPerm.permissions)
                                  .filter(([, hasPermission]) => hasPermission)
                                  .map(([perm]) => (
                                    <Badge key={perm} variant="outline" className="text-xs">
                                      {perm.replace(/([A-Z])/g, ' $1').toLowerCase()}
                                    </Badge>
                                  ))}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <div className="flex justify-between items-center mt-6 pt-4 border-t">
          <Button variant="outline" onClick={resetToDefaults}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset to Role Defaults
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button onClick={handleSave}>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};