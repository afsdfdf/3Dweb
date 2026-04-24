import type { PayloadRequest } from 'payload'

import {
  completeResetPassword,
  getCurrentAuthAccount,
  loginAccount,
  logoutAccount,
  registerAccount,
  resendVerificationEmail,
  startForgotPassword,
  verifyAccountEmail,
} from '@/lib/authService'
import { ensurePayloadRequestUser } from '@/lib/payloadAuthFallback'
import { rejectDisallowedMutationOrigin } from '@/lib/requestSecurity'

const getErrorMessage = (error: unknown) => {
  return error instanceof Error ? error.message : 'Authentication request failed.'
}

export const registerAccountEndpoint = {
  path: '/account/auth/register',
  method: 'post' as const,
  handler: async (req: PayloadRequest) => {
    const blocked = await rejectDisallowedMutationOrigin(req)
    if (blocked) return blocked

    try {
      const body = req.json ? await req.json() : {}
      const result = await registerAccount({
        input: {
          email: String(body.email || ''),
          fullName: String(body.fullName || ''),
          password: String(body.password || ''),
          phone: String(body.phone || ''),
        },
        req,
      })

      return Response.json(result)
    } catch (error) {
      return Response.json({ message: getErrorMessage(error) }, { status: 400 })
    }
  },
}

export const loginAccountEndpoint = {
  path: '/account/auth/login',
  method: 'post' as const,
  handler: async (req: PayloadRequest) => {
    const blocked = await rejectDisallowedMutationOrigin(req)
    if (blocked) return blocked

    try {
      const body = req.json ? await req.json() : {}
      const { headers, result } = await loginAccount({
        input: {
          email: String(body.email || ''),
          password: String(body.password || ''),
        },
        req,
      })

      return Response.json(
        {
          message: 'Login successful.',
          user: result.user,
        },
        {
          headers,
        },
      )
    } catch (error) {
      return Response.json({ message: getErrorMessage(error) }, { status: 400 })
    }
  },
}

export const logoutAccountEndpoint = {
  path: '/account/auth/logout',
  method: 'post' as const,
  handler: async (req: PayloadRequest) => {
    const blocked = await rejectDisallowedMutationOrigin(req)
    if (blocked) return blocked

    const { headers } = await logoutAccount(req)

    return Response.json(
      {
        message: 'Session cleared.',
      },
      {
        headers,
      },
    )
  },
}

export const getCurrentAuthAccountEndpoint = {
  path: '/account/auth/me',
  method: 'get' as const,
  handler: async (req: PayloadRequest) => {
    await ensurePayloadRequestUser(req)

    try {
      const result = await getCurrentAuthAccount(req)
      return Response.json(result)
    } catch (error) {
      return Response.json({ message: getErrorMessage(error) }, { status: 400 })
    }
  },
}

export const forgotPasswordEndpoint = {
  path: '/account/auth/forgot-password',
  method: 'post' as const,
  handler: async (req: PayloadRequest) => {
    const blocked = await rejectDisallowedMutationOrigin(req)
    if (blocked) return blocked

    try {
      const body = req.json ? await req.json() : {}
      const result = await startForgotPassword({
        input: {
          email: String(body.email || ''),
        },
        req,
      })

      return Response.json(result)
    } catch (error) {
      return Response.json({ message: getErrorMessage(error) }, { status: 400 })
    }
  },
}

export const resetPasswordEndpoint = {
  path: '/account/auth/reset-password',
  method: 'post' as const,
  handler: async (req: PayloadRequest) => {
    const blocked = await rejectDisallowedMutationOrigin(req)
    if (blocked) return blocked

    try {
      const body = req.json ? await req.json() : {}
      const { headers, result } = await completeResetPassword({
        input: {
          password: String(body.password || ''),
          token: String(body.token || ''),
        },
        req,
      })

      return Response.json(
        {
          message: 'Password reset successfully.',
          user: result.user,
        },
        {
          headers,
        },
      )
    } catch (error) {
      return Response.json({ message: getErrorMessage(error) }, { status: 400 })
    }
  },
}

export const verifyEmailEndpoint = {
  path: '/account/auth/verify-email',
  method: 'post' as const,
  handler: async (req: PayloadRequest) => {
    try {
      const body = req.json ? await req.json() : {}
      const result = await verifyAccountEmail({
        input: {
          token: String(body.token || ''),
        },
        req,
      })

      return Response.json({
        message: 'Email verification completed.',
        ...result,
      })
    } catch (error) {
      return Response.json({ message: getErrorMessage(error) }, { status: 400 })
    }
  },
}

export const resendVerificationEndpoint = {
  path: '/account/auth/resend-verification',
  method: 'post' as const,
  handler: async (req: PayloadRequest) => {
    const blocked = await rejectDisallowedMutationOrigin(req)
    if (blocked) return blocked

    try {
      const body = req.json ? await req.json() : {}
      const result = await resendVerificationEmail({
        input: {
          email: String(body.email || ''),
        },
        req,
      })

      return Response.json(result)
    } catch (error) {
      return Response.json({ message: getErrorMessage(error) }, { status: 400 })
    }
  },
}
