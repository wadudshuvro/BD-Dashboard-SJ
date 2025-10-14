import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAdminUsers } from "@/hooks/useAdminUsers";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export default function People() {
  const { users, fetchUsers, loading } = useAdminUsers();
  const { user: currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentUserBrands, setCurrentUserBrands] = useState<string[]>([]);

  useEffect(() => {
    fetchUsers({ limit: 200, isMarketing: true }).catch(() => {
      // errors are surfaced by the hook toast handler
    });
  }, [fetchUsers]);

  useEffect(() => {
    if (currentUser?.id) {
      fetchCurrentUserBrands();
    }
  }, [currentUser]);

  const fetchCurrentUserBrands = async () => {
    if (!currentUser?.id) return;
    
    const { data } = await supabase
      .from('user_brands')
      .select('brand_id')
      .eq('user_id', currentUser.id);
    
    if (data) {
      setCurrentUserBrands(data.map(ub => ub.brand_id));
    }
  };

  const marketingMembers = useMemo(() => {
    const allMarketingUsers = users.filter((user) => user.is_marketing);
    
    // Super admins and managers see all marketing members
    if (currentUser?.role === 'super_admin' || currentUser?.role === 'manager') {
      return allMarketingUsers;
    }
    
    // Regular users only see marketing members from their assigned brands
    if (currentUserBrands.length === 0) {
      return [];
    }
    
    return allMarketingUsers.filter((user) => {
      const userBrandIds = user.user_brands?.map(ub => ub.brand_id) || [];
      return userBrandIds.some(brandId => currentUserBrands.includes(brandId));
    });
  }, [users, currentUser, currentUserBrands]);

  const filteredMembers = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return marketingMembers;

    return marketingMembers.filter((member) => {
      const fullName = [member.first_name, member.last_name]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const title = (member.title || "").toLowerCase();
      return fullName.includes(term) || title.includes(term);
    });
  }, [marketingMembers, searchTerm]);

  const totalBrandsManaged = useMemo(
    () =>
      marketingMembers.reduce((count, member) => {
        return count + (member.user_brands?.length || 0);
      }, 0),
    [marketingMembers]
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">People</h1>
        <p className="text-muted-foreground">
          Business Development team directory sourced from admin user profiles.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Business Development team members</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{marketingMembers.length}</div>
            <p className="text-xs text-muted-foreground">Active profiles</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Assigned brands</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalBrandsManaged}</div>
            <p className="text-xs text-muted-foreground">Across business development users</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Search</CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <Input
              placeholder="Search by name or title"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <p className="text-sm text-muted-foreground">Loading business development team…</p>
        </div>
      ) : filteredMembers.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <h3 className="text-lg font-semibold">No business development members found</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Try adjusting your search or add business development members from the admin panel.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredMembers.map((member) => {
            const name = [member.first_name, member.last_name].filter(Boolean).join(" ") || member.email;
            const initials = (member.first_name?.[0] || "") + (member.last_name?.[0] || "");
            const brandNames = member.user_brands?.map((brand) => brand.brand_name).filter(Boolean) || [];

            return (
              <Card key={member.id} className="flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>{initials || "MM"}</AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-base leading-tight">{name}</CardTitle>
                      {member.title && (
                        <p className="text-sm text-muted-foreground">{member.title}</p>
                      )}
                      <p className="text-xs text-muted-foreground">{member.email}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="text-xs">Business Development Team</Badge>
                    {member.department && (
                      <Badge variant="secondary" className="text-xs">{member.department}</Badge>
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Brands</p>
                    {brandNames.length > 0 ? (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {brandNames.map((brandName) => (
                          <Badge key={brandName} variant="outline" className="text-xs">
                            {brandName}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No brand assignments yet</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
