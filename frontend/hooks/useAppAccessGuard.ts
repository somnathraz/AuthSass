// hooks/useAppAccessGuard.ts
"use client";

import { useRouter, useParams } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";
import { useUserAndOrg, useAppMembers } from "@/services/authService";

export function useAppAccessGuard() {
  const { appId } = useParams<{ orgId: string; appId: string }>();
  const router = useRouter();

  // get current user & their orgs (so we can find personal)
  const {
    user: me,
    organizations: userOrgsList,
    loading: loadingUser,
  } = useUserAndOrg();

  // get all members of this app
  const { members: appMembers, loading: loadingMembers } = useAppMembers(
    appId! /* orgId not needed here */
  );

  useEffect(() => {
    if (loadingUser || loadingMembers) return;
    if (!me || !appId) return;

    // Only check app membership
    const isMember = appMembers.some((m) => m.id === me.id);
    if (!isMember) {
      toast.error("You don’t have access to that app.", { duration: 5000 });

      // Redirect to personal org’s apps list
      const personal = userOrgsList.find((o) => o.type === "PERSONAL");
      const fallback = personal?.id ?? me.organizationId ?? "";
      router.replace(`/dashboard/${fallback}/apps`);
    }
  }, [
    me,
    userOrgsList,
    appMembers,
    loadingUser,
    loadingMembers,
    appId,
    router,
  ]);
}
