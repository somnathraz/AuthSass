import { useMutation, useQuery } from "@apollo/client";
import { useCallback } from "react";
import { useAppStore } from "@/store/appStore";
import { 
  UPDATE_PROFILE_MUTATION,
  UPDATE_AVATAR_MUTATION,
  UPDATE_PASSWORD_MUTATION,
  UPDATE_EMAIL_MUTATION,
  UPDATE_USER_SETTINGS_MUTATION,
  DELETE_ACCOUNT_MUTATION,
  EXPORT_USER_DATA_MUTATION,
  type UpdateProfileInput,
  type UpdateAvatarInput,
  type UpdatePasswordInput,
  type UpdateEmailInput,
  type UpdateUserSettingsInput,
  type DeleteAccountInput
} from "@/graphql/profile.mutations";
import { GET_ME } from "@/graphql/auth.queries";

// Profile Update Hook
export const useUpdateProfile = () => {
  const [updateProfileMutation, { loading, error }] = useMutation(UPDATE_PROFILE_MUTATION);
  const { setUser } = useAppStore();

  const updateProfile = useCallback(async (input: UpdateProfileInput) => {
    try {
      const response = await updateProfileMutation({
        variables: input,
        refetchQueries: [{ query: GET_ME }],
      });

      if (response.data?.updateProfile) {
        const user = response.data.updateProfile;
        // Update store with new user data
        setUser({
          id: user.id,
          name: user.username,
          email: user.email,
          image: user.profileImage,
          role: user.role,
        });
        return user;
      }
    } catch (err) {
      console.error("Update profile error:", err);
      throw err;
    }
  }, [updateProfileMutation, setUser]);

  return { updateProfile, loading, error };
};

// Avatar Update Hook
export const useUpdateAvatar = () => {
  const [updateAvatarMutation, { loading, error }] = useMutation(UPDATE_AVATAR_MUTATION);
  const { setUser } = useAppStore();

  const updateAvatar = useCallback(async (input: UpdateAvatarInput) => {
    try {
      const response = await updateAvatarMutation({
        variables: input,
        refetchQueries: [{ query: GET_ME }],
      });

      if (response.data?.updateAvatar) {
        const user = response.data.updateAvatar;
        // Update store with new user data
        setUser({
          id: user.id,
          name: user.username,
          email: user.email,
          image: user.profileImage,
          role: user.role,
        });
        return user;
      }
    } catch (err) {
      console.error("Update avatar error:", err);
      throw err;
    }
  }, [updateAvatarMutation, setUser]);

  return { updateAvatar, loading, error };
};

// Password Update Hook
export const useUpdatePassword = () => {
  const [updatePasswordMutation, { loading, error }] = useMutation(UPDATE_PASSWORD_MUTATION);

  const updatePassword = useCallback(async (input: UpdatePasswordInput) => {
    try {
      const response = await updatePasswordMutation({
        variables: input,
      });

      return response.data?.updatePassword;
    } catch (err) {
      console.error("Update password error:", err);
      throw err;
    }
  }, [updatePasswordMutation]);

  return { updatePassword, loading, error };
};

// Email Update Hook
export const useUpdateEmail = () => {
  const [updateEmailMutation, { loading, error }] = useMutation(UPDATE_EMAIL_MUTATION);
  const { setUser } = useAppStore();

  const updateEmail = useCallback(async (input: UpdateEmailInput) => {
    try {
      const response = await updateEmailMutation({
        variables: input,
        refetchQueries: [{ query: GET_ME }],
      });

      if (response.data?.updateEmail) {
        const user = response.data.updateEmail;
        // Update store with new user data
        setUser({
          id: user.id,
          name: user.username,
          email: user.email,
          image: user.profileImage,
          role: user.role,
        });
        return user;
      }
    } catch (err) {
      console.error("Update email error:", err);
      throw err;
    }
  }, [updateEmailMutation, setUser]);

  return { updateEmail, loading, error };
};

// User Settings Update Hook
export const useUpdateUserSettings = () => {
  const [updateUserSettingsMutation, { loading, error }] = useMutation(UPDATE_USER_SETTINGS_MUTATION);

  const updateUserSettings = useCallback(async (input: UpdateUserSettingsInput) => {
    try {
      const response = await updateUserSettingsMutation({
        variables: input,
        refetchQueries: [{ query: GET_ME }],
      });

      return response.data?.updateUserSettings;
    } catch (err) {
      console.error("Update user settings error:", err);
      throw err;
    }
  }, [updateUserSettingsMutation]);

  return { updateUserSettings, loading, error };
};

// Account Deletion Hook
export const useDeleteAccount = () => {
  const [deleteAccountMutation, { loading, error }] = useMutation(DELETE_ACCOUNT_MUTATION);
  const { clearUser } = useAppStore();

  const deleteAccount = useCallback(async (input: DeleteAccountInput) => {
    try {
      const response = await deleteAccountMutation({
        variables: input,
      });

      if (response.data?.deleteAccount) {
        // Clear user from store and redirect
        clearUser();
        // Redirect to a goodbye page or login
        window.location.href = '/login?deleted=true';
        return response.data.deleteAccount;
      }
    } catch (err) {
      console.error("Delete account error:", err);
      throw err;
    }
  }, [deleteAccountMutation, clearUser]);

  return { deleteAccount, loading, error };
};

// Data Export Hook
export const useExportUserData = () => {
  const [exportUserDataMutation, { loading, error }] = useMutation(EXPORT_USER_DATA_MUTATION);

  const exportUserData = useCallback(async () => {
    try {
      const response = await exportUserDataMutation();

      if (response.data?.exportUserData) {
        // Create and download the file
        const dataStr = response.data.exportUserData;
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `account-data-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        return dataStr;
      }
    } catch (err) {
      console.error("Export user data error:", err);
      throw err;
    }
  }, [exportUserDataMutation]);

  return { exportUserData, loading, error };
};

// Enhanced Current User Hook with Profile Data
export const useCurrentUser = () => {
  const { data, loading, error, refetch } = useQuery(GET_ME, {
    errorPolicy: 'all',
  });

  return {
    user: data?.me,
    loading,
    error,
    refetch,
  };
}; 