// services/authService.ts
import { useMutation } from "@apollo/client";
import { LOGIN_MUTATION, SIGNUP_MUTATION, SOCIAL_LOGIN_MUTATION } from "../graphql/mutations";

export const useLogin = () => {
  const [loginMutation, { data, error, loading }] = useMutation(LOGIN_MUTATION);
  const login = async (email: string, password: string) => {
    return await loginMutation({ variables: { email, password } });
  };
  return { login, data, error, loading };
};

export const useSignup = () => {
  const [signupMutation, { data, error, loading }] = useMutation(SIGNUP_MUTATION);
  const signup = async (username: string, email: string, password: string) => {
    return await signupMutation({ variables: { username, email, password } });
  };
  return { signup, data, error, loading };
};

export const useSocialLogin = () => {
  const [socialLoginMutation, { data, error, loading }] = useMutation(SOCIAL_LOGIN_MUTATION);
  const socialLogin = async (provider: string, token: string) => {
    return await socialLoginMutation({ variables: { provider, token } });
  };
  return { socialLogin, data, error, loading };
};
