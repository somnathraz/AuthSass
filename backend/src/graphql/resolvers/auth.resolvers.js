const { AuthenticationError, ForbiddenError, UserInputError } = require('apollo-server-express');
const { withFilter } = require('graphql-subscriptions');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const zxcvbn = require('zxcvbn');

// Services
const AuthService = require('../../services/auth.service');
const UserService = require('../../services/user.service');
const TokenService = require('../../services/token.service');
const EmailService = require('../../services/email.service');

// Utils
const { validateInput } = require('../../utils/validation');
const { rateLimitCheck } = require('../../middleware/rateLimiter');
const { auditLog } = require('../../utils/audit');

// Validation schemas
const {
  loginSchema,
  signupSchema,
  socialLoginSchema,
} = require('../../validators/auth.validators');

const authResolvers = {
  Query: {
    async me(parent, args, context) {
      const { user, req } = context;
      
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      // Update last seen timestamp
      await UserService.updateLastSeen(user.id);
      
      return await UserService.findById(user.id);
    },

    async validateToken(parent, { token }, context) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await UserService.findById(decoded.userId);
        
        if (!user || user.status !== 'ACTIVE') {
          return {
            valid: false,
            user: null,
            expiresAt: null,
            error: 'User not found or inactive'
          };
        }

        return {
          valid: true,
          user,
          expiresAt: new Date(decoded.exp * 1000),
          error: null
        };
      } catch (error) {
        return {
          valid: false,
          user: null,
          expiresAt: null,
          error: error.message
        };
      }
    },

    async checkPasswordStrength(parent, { password }, context) {
      const result = zxcvbn(password);
      
      const requirements = [
        {
          rule: 'Minimum 8 characters',
          satisfied: password.length >= 8,
          message: 'Password must be at least 8 characters long'
        },
        {
          rule: 'Contains uppercase letter',
          satisfied: /[A-Z]/.test(password),
          message: 'Password must contain at least one uppercase letter'
        },
        {
          rule: 'Contains lowercase letter',
          satisfied: /[a-z]/.test(password),
          message: 'Password must contain at least one lowercase letter'
        },
        {
          rule: 'Contains number',
          satisfied: /\d/.test(password),
          message: 'Password must contain at least one number'
        },
        {
          rule: 'Contains special character',
          satisfied: /[!@#$%^&*(),.?":{}|<>]/.test(password),
          message: 'Password must contain at least one special character'
        }
      ];

      return {
        score: result.score,
        feedback: result.feedback.suggestions.join(' '),
        isValid: result.score >= 3 && requirements.every(req => req.satisfied),
        requirements
      };
    },

    // Health check query
    async healthCheck() {
      return {
        status: 'OK',
        timestamp: new Date().toISOString(),
        googleClientConfigured: !!process.env.GOOGLE_CLIENT_ID,
        message: 'Auth service is running'
      };
    }
  },

  Mutation: {
    async login(parent, { input }, context) {
      const { req, res, pubsub } = context;
      
      try {
        // Rate limiting
        await rateLimitCheck(req, 'login', 5, 900); // 5 attempts per 15 minutes
        
        // Validate input
        const { error, value } = validateInput(loginSchema, input);
        if (error) {
          throw new UserInputError('Validation failed', { 
            errors: error.details.map(detail => ({
              field: detail.path.join('.'),
              message: detail.message,
              code: 'VALIDATION_ERROR'
            }))
          });
        }

        const { email, password, rememberMe } = value;
        
        // Find user
        const user = await UserService.findByEmail(email);
        if (!user) {
          await auditLog('LOGIN_FAILED', null, { email, reason: 'USER_NOT_FOUND' });
          throw new AuthenticationError('Invalid credentials');
        }

        // Check if user is active
        if (user.status !== 'ACTIVE') {
          await auditLog('LOGIN_FAILED', user.id, { reason: 'ACCOUNT_INACTIVE' });
          throw new ForbiddenError('Account is not active');
        }

        // Verify password
        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) {
          await auditLog('LOGIN_FAILED', user.id, { reason: 'INVALID_PASSWORD' });
          await UserService.incrementFailedLoginAttempts(user.id);
          throw new AuthenticationError('Invalid credentials');
        }

        // Check for account lockout
        if (user.failedLoginAttempts >= 5) {
          const lockoutExpired = new Date() > new Date(user.lockoutUntil);
          if (!lockoutExpired) {
            throw new ForbiddenError('Account temporarily locked due to too many failed attempts');
          }
        }

        // Generate tokens
        const tokenExpiry = rememberMe ? '30d' : '24h';
        const { accessToken, refreshToken, expiresIn } = await TokenService.generateTokens(
          user, 
          { expiresIn: tokenExpiry }
        );

        // Set secure cookies
        res.cookie('token', accessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          domain: 'localhost',
          maxAge: rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000,
          sameSite: 'lax',
          path: '/',
        });
        res.cookie('refreshToken', refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          domain: 'localhost',
          maxAge: 30 * 24 * 60 * 60 * 1000, // Refresh token always 30 days
          sameSite: 'lax',
          path: '/',
        });

        // Update user login info
        await UserService.updateLoginInfo(user.id, req.ip, req.get('User-Agent'));

        // Reset failed attempts
        await UserService.resetFailedLoginAttempts(user.id);

        // Audit log
        await auditLog('LOGIN_SUCCESS', user.id, {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          rememberMe
        });

        // Publish auth event
        pubsub.publish('AUTH_STATUS_CHANGED', {
          authStatusChanged: {
            userId: user.id,
            action: 'LOGIN',
            timestamp: new Date(),
            metadata: { ip: req.ip }
          }
        });

        return {
          success: true,
          accessToken,
          refreshToken,
          user: await UserService.findById(user.id),
          requirePasswordReset: user.requirePasswordReset,
          expiresIn,
          tokenType: 'Bearer',
          errors: []
        };

      } catch (error) {
        if (error instanceof AuthenticationError || error instanceof ForbiddenError || error instanceof UserInputError) {
          throw error;
        }
        
        console.error('Login error:', error);
        throw new Error('Internal server error during login');
      }
    },

    async signup(parent, { input }, context) {
      const { req, res, pubsub } = context;
      
      try {
        // Rate limiting
        await rateLimitCheck(req, 'signup', 3, 3600); // 3 attempts per hour
        
        // Validate input
        const { error, value } = validateInput(signupSchema, input);
        if (error) {
          throw new UserInputError('Validation failed', { 
            errors: error.details.map(detail => ({
              field: detail.path.join('.'),
              message: detail.message,
              code: 'VALIDATION_ERROR'
            }))
          });
        }

        const { username, email, password, confirmPassword, acceptTerms } = value;

        // Check if passwords match
        if (password !== confirmPassword) {
          throw new UserInputError('Passwords do not match');
        }

        // Check if terms accepted
        if (!acceptTerms) {
          throw new UserInputError('You must accept the terms and conditions');
        }

        // Check password strength
        const passwordCheck = await authResolvers.Query.checkPasswordStrength(null, { password });
        if (!passwordCheck.isValid) {
          throw new UserInputError('Password does not meet requirements', {
            passwordRequirements: passwordCheck.requirements
          });
        }

        // Check if user already exists
        const existingUser = await UserService.findByEmail(email);
        if (existingUser) {
          throw new UserInputError('User with this email already exists');
        }

        // Check username availability
        const existingUsername = await UserService.findByUsername(username);
        if (existingUsername) {
          throw new UserInputError('Username is already taken');
        }

        // Create user
        const userData = {
          username,
          email,
          password,
          accountType: 'PERSONAL',
          role: 'MEMBER',
          status: 'PENDING', // Requires email verification
          createdBy: null,
          preferences: AuthService.getDefaultUserPreferences()
        };

        const user = await AuthService.createUserWithOrganization(userData);
        
        // Generate tokens
        const { accessToken, refreshToken } = await TokenService.generateTokens(user);

        // Set secure cookies
        const cookieOptions = {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 24 * 60 * 60 * 1000
        };

        res.cookie('accessToken', accessToken, cookieOptions);
        res.cookie('refreshToken', refreshToken, {
          ...cookieOptions,
          maxAge: 30 * 24 * 60 * 60 * 1000
        });

        // Send verification email
        const verificationToken = await TokenService.generateVerificationToken(user.id);
        await EmailService.sendVerificationEmail(user.email, verificationToken);

        // Audit log
        await auditLog('USER_SIGNUP', user.id, {
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });

        // Publish auth event
        pubsub.publish('AUTH_STATUS_CHANGED', {
          authStatusChanged: {
            userId: user.id,
            action: 'SIGNUP',
            timestamp: new Date(),
            metadata: { requiresVerification: true }
          }
        });

        return {
          success: true,
          accessToken,
          refreshToken,
          user,
          requiresEmailVerification: true,
          errors: []
        };

      } catch (error) {
        if (error instanceof UserInputError) {
          throw error;
        }
        
        console.error('Signup error:', error);
        throw new Error('Internal server error during signup');
      }
    },

    async socialLogin(parent, { input }, context) {
      const { req, res, pubsub } = context;
      
      try {
        // Rate limiting
        await rateLimitCheck(req, 'social_login', 10, 900); // 10 attempts per 15 minutes
        
        // Validate input
        const { error, value } = validateInput(socialLoginSchema, input);
        if (error) {
          console.error('Social login validation error:', error.details);
          throw new UserInputError('Validation failed', { 
            errors: error.details.map(detail => ({
              field: detail.path.join('.'),
              message: detail.message,
              code: 'VALIDATION_ERROR'
            }))
          });
        }

        const { provider, token, redirectUri } = value;
        console.log('Social login attempt:', { provider, tokenLength: token?.length });
        
        // Validate social token and get user info
        let socialUserInfo;
        try {
          socialUserInfo = await AuthService.validateSocialToken(provider, token);
          console.log('Social user info received:', { email: socialUserInfo.email, provider });
        } catch (tokenError) {
          console.error('Token validation failed:', tokenError);
          throw new AuthenticationError(`Invalid ${provider} token: ${tokenError.message}`);
        }
        
        // Find or create user
        let user;
        try {
          user = await UserService.findByEmail(socialUserInfo.email);
        } catch (userFindError) {
          console.error('Error finding user by email:', userFindError);
          throw new Error(`Database error while finding user: ${userFindError.message}`);
        }
        
        let isNewUser = false;
        
        if (!user) {
          console.log('Creating new user from social login');
          // Create new user from social login
          const userData = {
            username: socialUserInfo.username || socialUserInfo.email.split('@')[0],
            email: socialUserInfo.email,
            firstName: socialUserInfo.firstName,
            lastName: socialUserInfo.lastName,
            profileImage: socialUserInfo.picture,
            accountType: 'personal', // Use lowercase to match User model enum
            role: 'MEMBER',
            status: 'ACTIVE',
            isVerified: true, // Social accounts are pre-verified
            socialProviders: [provider],
            preferences: AuthService.getDefaultUserPreferences(),
            // For social login users, we'll set a dummy password hash since it's required by the model
            // but they'll authenticate via social providers
            password: process.env.DUMMY_PASSWORD || 'Social_Login_Dummy_Password_123!'
          };

          try {
            user = await AuthService.createUserWithOrganization(userData);
            isNewUser = true;
            console.log('New user created successfully:', user.id);
          } catch (createUserError) {
            console.error('Error creating user:', createUserError);
            throw new Error(`Failed to create user account: ${createUserError.message}`);
          }
        } else {
          console.log('Updating existing user with social info');
          // Update existing user with social info if needed
          try {
            await UserService.updateSocialInfo(user.id, provider, socialUserInfo);
          } catch (updateError) {
            console.error('Error updating user social info:', updateError);
            // Don't throw here, just log - this is not critical
          }
        }

        // Generate tokens
        let tokenData;
        try {
          tokenData = await TokenService.generateTokens(user);
          console.log('Tokens generated successfully');
        } catch (tokenError) {
          console.error('Error generating tokens:', tokenError);
          throw new Error(`Failed to generate authentication tokens: ${tokenError.message}`);
        }

        const { accessToken, refreshToken, expiresIn } = tokenData;

        // Set cookies using the same format as the old resolver for compatibility
        try {
          res.cookie('token', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            domain: 'localhost',
            maxAge: 30 * 24 * 60 * 60 * 1000,
            sameSite: 'lax',
            path: '/',
          });
          res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            domain: 'localhost',
            maxAge: 30 * 24 * 60 * 60 * 1000,
            sameSite: 'lax',
            path: '/',
          });
          console.log('Cookies set successfully');
        } catch (cookieError) {
          console.error('Error setting cookies:', cookieError);
          // Don't throw here, cookies are not critical for the API response
        }

        // Update login info
        try {
          await UserService.updateLoginInfo(user.id, req.ip, req.get('User-Agent'));
        } catch (loginInfoError) {
          console.error('Error updating login info:', loginInfoError);
          // Don't throw here, this is not critical
        }

        // Audit log
        try {
          await auditLog(isNewUser ? 'SOCIAL_SIGNUP' : 'SOCIAL_LOGIN', user.id, {
            provider,
            ip: req.ip,
            userAgent: req.get('User-Agent')
          });
        } catch (auditError) {
          console.error('Error writing audit log:', auditError);
          // Don't throw here, audit logging is not critical
        }

        // Publish auth event
        try {
          pubsub.publish('AUTH_STATUS_CHANGED', {
            authStatusChanged: {
              userId: user.id,
              action: isNewUser ? 'SOCIAL_SIGNUP' : 'SOCIAL_LOGIN',
              timestamp: new Date(),
              metadata: { provider }
            }
          });
        } catch (pubsubError) {
          console.error('Error publishing auth event:', pubsubError);
          // Don't throw here, pubsub is not critical
        }

        console.log('Social login successful for user:', user.id);
        
        // Get the user data for response
        let responseUser;
        try {
          responseUser = await UserService.findById(user.id || user._id);
          if (!responseUser) {
            console.error('Could not find user by ID after social login:', user.id || user._id);
            // Use the existing user object if we can't fetch the updated one
            responseUser = { ...user };
            // Ensure ID is properly set for GraphQL
            if (!responseUser.id && responseUser._id) {
              responseUser.id = responseUser._id.toString();
            }
          }
        } catch (userResponseError) {
          console.error('Error fetching user for response:', userResponseError);
          // Use the existing user object if we can't fetch the updated one
          responseUser = { ...user };
          // Ensure ID is properly set for GraphQL
          if (!responseUser.id && responseUser._id) {
            responseUser.id = responseUser._id.toString();
          }
        }
        
        return {
          success: true,
          accessToken,
          refreshToken,
          user: responseUser,
          requirePasswordReset: false,
          expiresIn,
          tokenType: 'Bearer',
          errors: []
        };

      } catch (error) {
        console.error('Social login error details:', {
          message: error.message,
          name: error.name,
          stack: error.stack,
          provider: input?.provider,
          inputData: { ...input, token: input?.token ? `${input.token.substring(0, 10)}...` : 'none' }
        });
        
        // Re-throw GraphQL errors as-is
        if (error instanceof AuthenticationError || error instanceof UserInputError || error instanceof ForbiddenError) {
          throw error;
        }
        
        // For other errors, throw a generic error
        throw new Error(`Social authentication failed: ${error.message}`);
      }
    },

    async logout(parent, args, context) {
      const { user, req, res, pubsub } = context;
      
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      try {
        // Invalidate refresh tokens
        await TokenService.revokeUserTokens(user.id);

        // Clear cookies
        res.clearCookie('accessToken');
        res.clearCookie('refreshToken');

        // Audit log
        await auditLog('LOGOUT', user.id, {
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });

        // Publish auth event
        pubsub.publish('AUTH_STATUS_CHANGED', {
          authStatusChanged: {
            userId: user.id,
            action: 'LOGOUT',
            timestamp: new Date(),
            metadata: {}
          }
        });

        return {
          success: true,
          message: 'Successfully logged out',
          errors: []
        };

      } catch (error) {
        console.error('Logout error:', error);
        throw new Error('Error during logout');
      }
    },

    async refreshToken(parent, { refreshToken }, context) {
      const { req, res } = context;
      
      try {
        // Get refresh token from cookie if not provided
        const token = refreshToken || req.cookies?.refreshToken;
        
        if (!token) {
          throw new AuthenticationError('No refresh token provided');
        }

        // Validate and refresh token
        const result = await TokenService.refreshAccessToken(token);
        
        // Set new access token cookie
        res.cookie('accessToken', result.accessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: result.expiresIn * 1000
        });

        return {
          success: true,
          accessToken: result.accessToken,
          expiresIn: result.expiresIn,
          errors: []
        };

      } catch (error) {
        console.error('Token refresh error:', error);
        throw new AuthenticationError('Invalid refresh token');
      }
    },

    // Additional auth mutations would be implemented here...
    // requestPasswordReset, resetPassword, changePassword, etc.
  },

  Subscription: {
    authStatusChanged: {
      subscribe: withFilter(
        (parent, args, context) => context.pubsub.asyncIterator(['AUTH_STATUS_CHANGED']),
        (payload, variables, context) => {
          // Only send to authenticated users
          return !!context.user;
        }
      )
    }
  }
};

module.exports = authResolvers; 