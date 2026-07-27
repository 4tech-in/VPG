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
import {
  Loader2,
  User,
  Mail,
  Phone,
  Shield,
  Building2,
  Server,
  CheckCircle2
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

  useEffect(() => {
    const fetchMe = async () => {
      try {
        setLoading(true);
        const res = await authService.me();
        if (res?.success && res?.data && token) {
          // Update the store with the fresh user data
          setAuth(token, res.data);
        } else {
          setError(res?.message || "Failed to fetch user data");
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
                {user?.profileImage && (
                  <AvatarImage
                    src={
                      user.profileImage.startsWith("http")
                        ? user.profileImage
                        : `${process.env.NEXT_PUBLIC_BASE_URL || ""}${user.profileImage}`
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
              <div>
                <CardTitle className="text-2xl font-bold">
                  {user?.name}
                </CardTitle>
                <CardDescription className="flex items-center gap-2 mt-1">
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
                <p className="font-medium text-sm">{user?.mobile || "N/A"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">
                  Emergency Contact
                </p>
                <p className="font-medium text-sm">
                  {(user as any)?.emergencyContactNumber || "N/A"}
                </p>
              </div>
              <div className="space-y-1 col-span-2">
                <p className="text-sm font-medium text-muted-foreground">
                  Aadhaar Number
                </p>
                <p className="font-medium text-sm">
                  {(user as any)?.aadhaarNumber || "N/A"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Work & Assigments Card */}
        </div>
      </div>
    </ContentLayout>
  );
}
