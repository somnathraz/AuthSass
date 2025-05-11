"use client";

import { useRouter, useParams } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";
import { useUserAndOrg, useAppMembers } from "@/services/authService";

export function useAppAccessGuard() {
  const { orgId, appId } = useParams<{ orgId: string; appId: string }>();
  const router = useRouter();

  const {
    user: me,
    organizations: userOrgsList,
    loading: loadingUser,
  } = useUserAndOrg();

  const { members: appMembers, loading: loadingMembers } = useAppMembers(
    appId!,
    orgId
  );

  useEffect(() => {
    if (loadingUser || loadingMembers) return;
    if (!me || !appId || !orgId) return;

    // ✅ 1. Is user an app member?
    const isAppMember = appMembers.some((m) => m.id === me.id);

    // ✅ 2. Is user a member of the app's org?
    const isOrgMember = userOrgsList.some((org) => org.id === orgId);

    // ❌ Not allowed in either way → redirect
    if (!isAppMember && !isOrgMember) {
      toast.error("You don’t have access to that app.", { duration: 5000 });

      const personalOrg = userOrgsList.find((o) => o.type === "PERSONAL");
      const fallbackOrgId = personalOrg?.id ?? me.organizationId ?? "";
      router.replace(`/dashboard/${fallbackOrgId}`);
    }
  }, [
    me,
    appMembers,
    userOrgsList,
    loadingUser,
    loadingMembers,
    appId,
    orgId,
    router,
  ]);
}
