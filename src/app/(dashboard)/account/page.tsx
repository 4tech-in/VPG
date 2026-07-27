"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/use-auth-store";
import { authService } from "@/service/auth.api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { userService } from "@/service/userService";
import {
  Loader2,
  User,
  Mail,
  Phone,
  Shield,
  Building2,
  Server,
  CheckCircle2,
  Edit2,
  X,
  Save
} from "lucide-react";
import { ContentLayout } from "@/components/admin-panel/content-layout";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from "@/components/ui/breadcrumb";
import Link from "next/link";

export default function AccountPage() {
  const { user, setAuth, token } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
    emergencyContactNumber: "",
    aadhaarNumber: ""
  });

  useEffect(() => {
    if (user && !isEditing) {
      setFormData({
        name: user.name || "",
        mobile: user.mobile || "",
        emergencyContactNumber: (user as any).emergencyContactNumber || "",
        aadhaarNumber: (user as any).aadhaarNumber || ""
      });
    }
  }, [user, isEditing]);

  const handleSave = async () => {
    const userId = user?._id || (user as any)?.id;
    if (!userId) {
      toast.error("User ID is missing, cannot update.");
      return;
    }
    try {
      setIsSaving(true);
      
      const u = user as any;
      const updateData: any = {
        name: formData.name,
        mobile: formData.mobile,
        emergencyContactNumber: formData.emergencyContactNumber,
        aadhaarNumber: formData.aadhaarNumber,
      };
      
      await userService.updateUser(userId, updateData);
      toast.success("Profile updated successfully!");
      setIsEditing(false);
      // Re-fetch user to update store
      const meRes = await authService.me();
      if (meRes && (meRes._id || meRes.id) && token) {
        setAuth(token, meRes);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to update profile");
      alert("API Error: " + (err.message || "Unknown error"));
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    const fetchMe = async () => {
      try {
        setLoading(true);
        const res = await authService.me();
        // apiClient extracts data.data, so res is the user object itself
        if (res && (res._id || res.id) && token) {
          // Update the store with the fresh user data
          setAuth(token, res);
        } else if (!res) {
          setError("Failed to fetch user data");
        }
      } catch (err: any) {
        setError(
          err.message || "Something went wrong while fetching account info."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchMe();
  }, [setAuth, token]);

  if (loading && !user) {
    return (
      <ContentLayout title="Account">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </ContentLayout>
    );
  }

  if (error && !user) {
    return (
      <ContentLayout title="Account">
        <div className="flex items-center justify-center min-h-[400px] text-destructive">
          {error}
        </div>
      </ContentLayout>
    );
  }

  return (
    <ContentLayout title="Account">
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/dashboard">Home</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Account</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="max-w-4xl mx-auto space-y-6">
        <Card className="border-none shadow-md overflow-hidden">
          <div className="h-32 bg-gradient-to-r from-primary/80 to-primary/40 relative">
            <div className="absolute -bottom-12 left-8">
              <Avatar className="h-24 w-24 border-4 border-background shadow-sm bg-background">
                {(user as any)?.profileImage && (
                  <AvatarImage
                    src={
                      (user as any).profileImage.startsWith("http")
                        ? (user as any).profileImage
                        : `${process.env.NEXT_PUBLIC_BASE_URL || ""}${(user as any).profileImage}`
                    }
                    alt="Profile"
                    className="object-cover"
                  />
                )}
                <AvatarFallback className="text-2xl font-bold bg-primary/10 text-primary">
                  {user?.name?.charAt(0)?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>

          <CardHeader className="pt-16 pb-4 px-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-4">
                  {isEditing ? (
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="max-w-[250px] font-bold text-xl"
                      placeholder="Your Name"
                    />
                  ) : (
                    <CardTitle className="text-2xl font-bold">
                      {user?.name}
                    </CardTitle>
                  )}
                  {isEditing ? (
                    <div className="flex items-center gap-2">
                      <Button size="sm" onClick={handleSave} disabled={isSaving}>
                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                        Save
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setIsEditing(false)} disabled={isSaving}>
                        <X className="h-4 w-4 mr-2" /> Cancel
                      </Button>
                    </div>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                      <Edit2 className="h-4 w-4 mr-2" /> Edit Profile
                    </Button>
                  )}
                </div>
                <CardDescription className="flex items-center gap-2 mt-2">
                  <Mail className="h-4 w-4" /> {user?.email}
                </CardDescription>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Badge
                  variant={user?.isActive ? "default" : "secondary"}
                  className="gap-1 px-3 py-1"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {user?.isActive ? "Active" : "Inactive"}
                </Badge>
                {user?.createdAt && (
                  <span className="text-xs text-muted-foreground">
                    Joined {new Date(user.createdAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Role Card */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Role Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">
                  Assigned Role
                </p>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-lg">
                    {user?.roleId?.name || "N/A"}
                  </span>
                  {user?.roleId?.scope && (
                    <Badge variant="outline" className="text-xs">
                      Scope: {user.roleId.scope}
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Details Card */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Contact Details
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">
                  Mobile
                </p>
                {isEditing ? (
                  <Input
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                    placeholder="Enter mobile number"
                  />
                ) : (
                  <p className="font-medium text-sm">{user?.mobile || "N/A"}</p>
                )}
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">
                  Emergency Contact
                </p>
                {isEditing ? (
                  <Input
                    value={formData.emergencyContactNumber}
                    onChange={(e) => setFormData({ ...formData, emergencyContactNumber: e.target.value })}
                    placeholder="Enter emergency contact"
                  />
                ) : (
                  <p className="font-medium text-sm">
                    {(user as any)?.emergencyContactNumber || "N/A"}
                  </p>
                )}
              </div>
              <div className="space-y-1 col-span-2">
                <p className="text-sm font-medium text-muted-foreground">
                  Aadhaar Number
                </p>
                {isEditing ? (
                  <Input
                    value={formData.aadhaarNumber}
                    onChange={(e) => setFormData({ ...formData, aadhaarNumber: e.target.value })}
                    placeholder="Enter Aadhaar number"
                  />
                ) : (
                  <p className="font-medium text-sm">
                    {(user as any)?.aadhaarNumber || "N/A"}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Work & Assigments Card */}
        </div>
      </div>
    </ContentLayout>
  );
}
