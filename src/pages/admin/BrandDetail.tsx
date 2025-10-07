import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Check, Edit3, Loader2, X } from "lucide-react";
import { toast } from "sonner";

import axiosPrivate from "@/lib/axiosPrivate";
import { useAuth } from "@/hooks/useAuth";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ApiBrand {
  id: string;
  name?: string | null;
  description?: string | null;
  type?: string | null;
  status?: string | null;
  ownerId?: string | null;
  owner_id?: string | null;
  ownerName?: string | null;
  owner_name?: string | null;
  ownerInitials?: string | null;
  owner_initials?: string | null;
  createdAt?: string | null;
  created_at?: string | null;
  updatedAt?: string | null;
  updated_at?: string | null;
  last_updated_at?: string | null;
}

interface ApiBrandOwner {
  id: string;
  name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  initials?: string | null;
  email?: string | null;
}

interface BrandFormState {
  name: string;
  description: string;
  type: string;
  status: string;
  ownerId: string;
}

interface NormalizedBrand {
  id: string;
  name: string;
  description: string;
  type: string;
  status: string;
  ownerId: string;
  ownerName: string;
  ownerInitials: string;
  createdAt?: string;
  updatedAt?: string;
}

interface NormalizedOwner {
  id: string;
  name: string;
  initials: string;
}

interface UpdateBrandPayload {
  name: string;
  description: string;
  type: string;
  status: string;
  ownerId: string;
}

const STATUS_OPTIONS = ["active", "inactive", "pending", "archived"];
const TYPE_OPTIONS = ["internal", "external", "client"];
const DESCRIPTION_LIMIT = 300;

const formatDate = (value?: string) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  }).format(date);
};

const formatDateTime = (value?: string) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  const datePart = new Intl.DateTimeFormat("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  }).format(date);
  const timePart = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);

  return `${datePart} at ${timePart}`;
};

const toTitleCase = (value?: string) => {
  if (!value) return "";
  return value
    .replace(/_/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const buildInitials = (value?: string | null) => {
  if (!value) return "";
  const matches = value
    .split(" ")
    .filter(Boolean)
    .map((segment) => segment[0]?.toUpperCase())
    .filter(Boolean);

  return matches.slice(0, 2).join("");
};

const BrandDetail = () => {
  const { brandId } = useParams<{ brandId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const canEdit = useMemo(() => {
    if (!user) return false;
    const role = user.role as string;
    return role === "super_admin" || role === "manager" || role === "brand_manager";
  }, [user]);

  const [isEditing, setIsEditing] = useState(false);
  const [formState, setFormState] = useState<BrandFormState | null>(null);

  const {
    data: brand,
    isLoading: brandLoading,
    isError: brandError,
    error,
  } = useQuery<ApiBrand>({
    queryKey: ["brand", brandId],
    enabled: Boolean(brandId),
    queryFn: async () => {
      const response = await axiosPrivate.get<ApiBrand>(`/api/admin/brands/${brandId}`);
      return response.data;
    },
  });

  const { data: owners, isLoading: ownersLoading } = useQuery<ApiBrandOwner[]>({
    queryKey: ["brand-owners"],
    queryFn: async () => {
      const response = await axiosPrivate.get<ApiBrandOwner[]>("/api/admin/users", {
        params: { role: "brand_owner" },
      });
      return response.data;
    },
  });

  const normalizedBrand = useMemo<NormalizedBrand | null>(() => {
    if (!brand) return null;

    const ownerId = brand.ownerId ?? brand.owner_id ?? "";
    const ownerName = brand.ownerName ?? brand.owner_name ?? "";
    const ownerInitials =
      brand.ownerInitials ?? brand.owner_initials ?? buildInitials(ownerName);

    return {
      id: brand.id,
      name: brand.name?.trim() ?? "",
      description: brand.description?.trim() ?? "",
      type: brand.type?.toLowerCase() ?? "internal",
      status: brand.status?.toLowerCase() ?? "active",
      ownerId,
      ownerName: ownerName.trim(),
      ownerInitials,
      createdAt: brand.createdAt ?? brand.created_at ?? undefined,
      updatedAt: brand.updatedAt ?? brand.updated_at ?? brand.last_updated_at ?? undefined,
    };
  }, [brand]);

  useEffect(() => {
    if (normalizedBrand) {
      setFormState({
        name: normalizedBrand.name,
        description: normalizedBrand.description,
        type: normalizedBrand.type,
        status: normalizedBrand.status,
        ownerId: normalizedBrand.ownerId,
      });
    }
  }, [normalizedBrand]);

  const normalizedOwners = useMemo<NormalizedOwner[]>(() => {
    const mapped = (owners ?? []).map<NormalizedOwner>((owner) => {
      const fullName = owner.name?.trim()
        || `${owner.first_name ?? ""} ${owner.last_name ?? ""}`.trim()
        || owner.email?.trim()
        || "Unnamed Owner";
      const initials = owner.initials?.trim() || buildInitials(fullName);

      return {
        id: owner.id,
        name: fullName,
        initials,
      };
    });

    if (normalizedBrand?.ownerId) {
      const exists = mapped.some((owner) => owner.id === normalizedBrand.ownerId);
      if (!exists) {
        const fallbackName =
          normalizedBrand.ownerName || "Current Owner";
        mapped.push({
          id: normalizedBrand.ownerId,
          name: fallbackName,
          initials: normalizedBrand.ownerInitials || buildInitials(fallbackName),
        });
      }
    }

    return mapped.sort((a, b) => a.name.localeCompare(b.name));
  }, [owners, normalizedBrand]);

  const updateBrandMutation = useMutation({
    mutationFn: async (payload: UpdateBrandPayload) => {
      const response = await axiosPrivate.put<ApiBrand>(
        `/api/admin/brands/${brandId}`,
        payload
      );
      return response.data;
    },
    onSuccess: (updatedBrand) => {
      queryClient.setQueryData(["brand", brandId], updatedBrand);
      setIsEditing(false);
      toast.success("Brand updated successfully");
    },
    onError: (mutationError: unknown) => {
      const message =
        mutationError instanceof Error
          ? mutationError.message
          : "Failed to update brand";
      toast.error(message);
    },
  });

  const handleFieldChange = <Key extends keyof BrandFormState>(
    key: Key,
    value: BrandFormState[Key]
  ) => {
    setFormState((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const handleCancel = () => {
    if (normalizedBrand) {
      setFormState({
        name: normalizedBrand.name,
        description: normalizedBrand.description,
        type: normalizedBrand.type,
        status: normalizedBrand.status,
        ownerId: normalizedBrand.ownerId,
      });
    }
    setIsEditing(false);
  };

  const handleSave = () => {
    if (!formState || !normalizedBrand) {
      return;
    }

    const trimmedName = formState.name.trim();
    const trimmedDescription = formState.description.trim();

    if (!trimmedName) {
      toast.error("Brand name is required");
      return;
    }

    if (!formState.ownerId) {
      toast.error("Brand owner is required");
      return;
    }

    if (trimmedDescription.length > DESCRIPTION_LIMIT) {
      toast.error(`Description must be ${DESCRIPTION_LIMIT} characters or less`);
      return;
    }

    const payload: UpdateBrandPayload = {
      name: trimmedName,
      description: trimmedDescription,
      type: formState.type,
      status: formState.status,
      ownerId: formState.ownerId,
    };

    const hasChanges =
      trimmedName !== normalizedBrand.name ||
      trimmedDescription !== normalizedBrand.description ||
      formState.type !== normalizedBrand.type ||
      formState.status !== normalizedBrand.status ||
      formState.ownerId !== normalizedBrand.ownerId;

    if (!hasChanges) {
      toast.info("No changes to save");
      setIsEditing(false);
      return;
    }

    updateBrandMutation.mutate(payload);
  };

  useEffect(() => {
    if (!canEdit && isEditing) {
      setIsEditing(false);
    }
  }, [canEdit, isEditing]);

  if (brandLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (brandError) {
    const errorMessage =
      error instanceof Error ? error.message : "Unable to load brand details";
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Brand not available</CardTitle>
            <CardDescription>{errorMessage}</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => navigate("/adminpanel/brands")}>Back to Brands</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (!normalizedBrand) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Brand not found</CardTitle>
            <CardDescription>
              We couldn't locate the requested brand. It may have been removed.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => navigate("/adminpanel/brands")}>Back to Brands</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  const statusVariant =
    normalizedBrand.status === "active"
      ? "default"
      : normalizedBrand.status === "inactive"
        ? "destructive"
        : "secondary";

  const descriptionLength = formState?.description.length ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              {normalizedBrand.name || "Brand details"}
            </h1>
            <p className="text-sm text-muted-foreground">
              View and manage core brand information.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="capitalize">
            {toTitleCase(normalizedBrand.type)}
          </Badge>
          <Badge variant={statusVariant} className="capitalize">
            {toTitleCase(normalizedBrand.status)}
          </Badge>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Brand information</CardTitle>
          <CardDescription>
            Keep the brand profile up to date for your team.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="brand-name">Brand Name</Label>
              <Input
                id="brand-name"
                value={formState?.name ?? ""}
                onChange={(event) => handleFieldChange("name", event.target.value)}
                disabled={!isEditing || !canEdit || updateBrandMutation.isPending}
                placeholder="Enter brand name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="brand-type">Type</Label>
              <Select
                value={formState?.type || undefined}
                onValueChange={(value) => handleFieldChange("type", value)}
                disabled={!isEditing || !canEdit || updateBrandMutation.isPending}
              >
                <SelectTrigger id="brand-type">
                  <SelectValue placeholder="Select brand type" />
                </SelectTrigger>
                <SelectContent>
                  {TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {toTitleCase(option)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="brand-status">Status</Label>
              <Select
                value={formState?.status || undefined}
                onValueChange={(value) => handleFieldChange("status", value)}
                disabled={!isEditing || !canEdit || updateBrandMutation.isPending}
              >
                <SelectTrigger id="brand-status">
                  <SelectValue placeholder="Select brand status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {toTitleCase(option)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="brand-owner">Brand Owner</Label>
              <Select
                value={formState?.ownerId || undefined}
                onValueChange={(value) => handleFieldChange("ownerId", value)}
                disabled={
                  !isEditing ||
                  !canEdit ||
                  ownersLoading ||
                  updateBrandMutation.isPending
                }
              >
                <SelectTrigger id="brand-owner">
                  <SelectValue placeholder="Select brand owner" />
                </SelectTrigger>
                <SelectContent>
                  {normalizedOwners.map((owner) => (
                    <SelectItem key={owner.id} value={owner.id}>
                      {owner.initials ? `${owner.initials} · ${owner.name}` : owner.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!canEdit && (
                <p className="text-xs text-muted-foreground">
                  Editing requires admin or brand manager access.
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="brand-description">Description</Label>
            <Textarea
              id="brand-description"
              value={formState?.description ?? ""}
              onChange={(event) => handleFieldChange("description", event.target.value)}
              disabled={!isEditing || !canEdit || updateBrandMutation.isPending}
              placeholder="Provide a concise brand overview"
              maxLength={DESCRIPTION_LIMIT}
              rows={5}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Maximum {DESCRIPTION_LIMIT} characters.</span>
              <span>{descriptionLength}/{DESCRIPTION_LIMIT}</span>
            </div>
          </div>

          <Separator />

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-1">
              <Label>Created</Label>
              <p className="text-sm text-muted-foreground">
                {formatDate(normalizedBrand.createdAt)}
              </p>
            </div>
            <div className="space-y-1">
              <Label>Owner</Label>
              <p className="text-sm text-muted-foreground">
                {normalizedBrand.ownerInitials
                  ? `${normalizedBrand.ownerInitials} · ${normalizedBrand.ownerName || "Unassigned"}`
                  : normalizedBrand.ownerName || "Unassigned"}
              </p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4 border-t border-border bg-muted/30 py-6 md:flex-row md:items-center md:justify-between">
          <div className="text-sm text-muted-foreground">
            Last updated {formatDateTime(normalizedBrand.updatedAt)}
          </div>
          {canEdit && (
            <div className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <Button
                    onClick={handleSave}
                    disabled={updateBrandMutation.isPending}
                  >
                    {updateBrandMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="mr-2 h-4 w-4" />
                    )}
                    Save
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleCancel}
                    disabled={updateBrandMutation.isPending}
                  >
                    <X className="mr-2 h-4 w-4" />
                    Cancel
                  </Button>
                </>
              ) : (
                <Button onClick={() => setIsEditing(true)}>
                  <Edit3 className="mr-2 h-4 w-4" />
                  Edit brand
                </Button>
              )}
            </div>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default BrandDetail;
