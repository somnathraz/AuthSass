// hooks/useOrgAccessGuard.ts
import { useRouter, useParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { useUserAndOrg } from "@/services/authService";
import { toast } from "sonner";

export function useOrgAccessGuard() {
  const { orgId } = useParams<{ orgId: string }>();
  const router = useRouter();
  const { user: me, organizations: userOrgsList, loading, error } = useUserAndOrg();
  const hasRedirected = useRef(false);
  const lastCheckedOrgId = useRef<string | null>(null);

  useEffect(() => {
    // Reset redirect flag when orgId changes
    if (lastCheckedOrgId.current !== orgId) {
      hasRedirected.current = false;
      lastCheckedOrgId.current = orgId;
    }

    // Don't check access if:
    // 1. Still loading
    // 2. No user data
    // 3. No orgId in URL
    // 4. Already redirected for this orgId
    // 5. GraphQL error (let it be handled elsewhere)
    if (loading || !me || !orgId || hasRedirected.current || error) {
      return;
    }

    // If we have user data but no organizations, it might be a GraphQL error
    if (userOrgsList.length === 0) {
      console.warn("User has no organizations - this might indicate a GraphQL error");
      return;
    }

    const userOrgIds = userOrgsList.map((o) => o.id);
    
    if (!userOrgIds.includes(orgId)) {
      console.error("Access denied - user not member of organization:", {
        requestedOrgId: orgId,
        userOrganizations: userOrgIds
      });
      
      hasRedirected.current = true;
      
      toast.error("You are no longer a member of this organization.", {
        duration: 5000,
      });

      // find the personal org by its type
      const personal = userOrgsList.find((o) => o.type === "PERSONAL");
      if (personal && personal.id !== orgId) {
        router.replace(`/dashboard/${personal.id}`);
      } else if (me.organizationId && me.organizationId !== orgId) {
        // fallback if somehow personal isn't in the list
        router.replace(`/dashboard/${me.organizationId}`);
      } else {
        router.replace("/dashboard");
      }
    }
  }, [orgId, me, userOrgsList, loading, error, router]);
}
