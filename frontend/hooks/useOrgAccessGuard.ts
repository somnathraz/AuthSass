// hooks/useOrgAccessGuard.ts
import { useRouter, useParams } from "next/navigation";
import { useEffect } from "react";
import { useUserAndOrg } from "@/services/authService";
import { toast } from "sonner";

export function useOrgAccessGuard() {
  const { orgId } = useParams<{ orgId: string }>();
  const router = useRouter();
  const { user: me, organizations: userOrgsList, loading } = useUserAndOrg();

  useEffect(() => {
    if (!loading && me && orgId) {
      const userOrgIds = userOrgsList.map((o) => o.id);
      if (!userOrgIds.includes(orgId)) {
        toast.error("You are no longer a member of this organization.", {
          duration: 5000,
        });

        // find the personal org by its type
        const personal = userOrgsList.find((o) => o.type === "PERSONAL");
        if (personal) {
          router.replace(`/dashboard/${personal.id}`);
        } else if (me.organizationId) {
          // fallback if somehow personal isn't in the list
          router.replace(`/dashboard/${me.organizationId}`);
        } else {
          router.replace("/dashboard");
        }
      }
    }
  }, [orgId, me, userOrgsList, loading, router]);
}
