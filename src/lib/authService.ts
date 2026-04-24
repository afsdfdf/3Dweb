import { randomBytes } from 'node:crypto'

import type { PayloadRequest } from 'payload'
import { generateExpiredPayloadCookie, generatePayloadCookie, logoutOperation } from 'payload'

import { getAccountProfile } from '@/lib/accountService'
import { generateVerifyEmailHTML, generateVerifyEmailSubject } from '@/lib/emailTemplates'
import { registrationPrivacyMessage } from '@/lib/registrationPrivacy'
import { extractRequestToken } from '@/lib/requestSecurity'
import { revokeToken } from '@/lib/tokenRevocation'

type RegisterAccountInput = {
  email: string
  fullName?: string
  password: string
  phone?: string
}

type LoginAccountInput = {
  email: string
  password: string
}

type ForgotPasswordInput = {
  email: string
}

type ResetPasswordInput = {
  password: string
  token: string
}

type VerifyEmailInput = {
  token: string
}

type ResendVerificationInput = {
  email: string
}

const normalizeEmail = (value: unknown) => String(value || '').trim().toLowerCase()
const registrationSuccessMessage = 'If this email is not already registered, a verification email has been sent.'
const normalizeText = (value: unknown) => {
  const trimmed = String(value || '').trim()
  return trimmed.length > 0 ? trimmed : ''
}

function getUserCollection(req: PayloadRequest) {
  return req.payload.collections.users
}

function buildAuthCookie(args: { req: PayloadRequest; token: string }) {
  return generatePayloadCookie({
    collectionAuthConfig: getUserCollection(args.req).config.auth,
    cookiePrefix: args.req.payload.config.cookiePrefix,
    token: args.token,
  })
}

function buildExpiredAuthCookie(req: PayloadRequest) {
  return generateExpiredPayloadCookie({
    collectionAuthConfig: getUserCollection(req).config.auth,
    config: req.payload.config,
    cookiePrefix: req.payload.config.cookiePrefix,
  })
}

function authHeaders(args: { req: PayloadRequest; setCookie?: string }) {
  const headers = new Headers()
  headers.set('Cache-Control', 'no-store')
  if (args.setCookie) {
    headers.set('Set-Cookie', args.setCookie)
  }
  return headers
}

export async function registerAccount(args: {
  input: RegisterAccountInput
  req: PayloadRequest
}) {
  const { input, req } = args
  const email = normalizeEmail(input.email)
  const password = String(input.password || '')

  if (!email || !password) {
    throw new Error('Email and password are required.')
  }

  try {
    await req.payload.create({
      collection: 'users',
      data: {
        email,
        fullName: normalizeText(input.fullName) || undefined,
        password,
        phone: normalizeText(input.phone) || undefined,
        role: 'customer',
      },
      overrideAccess: true,
      req,
    })

    return {
      message: registrationSuccessMessage,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : registrationPrivacyMessage
    const lower = message.toLowerCase()
    if (lower.includes('exist') || lower.includes('duplicate') || lower.includes('already')) {
      return {
        message: registrationSuccessMessage,
      }
    }

    throw error
  }
}

export async function loginAccount(args: {
  input: LoginAccountInput
  req: PayloadRequest
}) {
  const result = await args.req.payload.login({
    collection: 'users',
    data: {
      email: normalizeEmail(args.input.email),
      password: String(args.input.password || ''),
    },
    overrideAccess: true,
    req: args.req,
  })

  if (!result.token) {
    throw new Error('Login did not return an authentication token.')
  }

  const cookie = buildAuthCookie({
    req: args.req,
    token: result.token,
  })

  return {
    headers: authHeaders({
      req: args.req,
      setCookie: cookie,
    }),
    result,
  }
}

export async function logoutAccount(req: PayloadRequest) {
  const headers = authHeaders({
    req,
    setCookie: buildExpiredAuthCookie(req),
  })

  const collection = getUserCollection(req)
  if (!req.user || req.user.collection !== collection.config.slug) {
    return { headers }
  }

  const token = extractRequestToken(req.headers)
  if (token) {
    await revokeToken(token)
  }

  await logoutOperation({
    allSessions: String(req.query?.allSessions || '') === 'true',
    collection,
    req,
  })

  return { headers }
}

export async function getCurrentAuthAccount(req: PayloadRequest) {
  if (!req.user) {
    return {
      authenticated: false,
      profile: null,
      user: null,
    }
  }

  const profile = await getAccountProfile(req)

  return {
    authenticated: true,
    profile,
    user: {
      email: req.user.email || null,
      id: Number(req.user.id),
      role: req.user.role || 'customer',
    },
  }
}

export async function startForgotPassword(args: {
  input: ForgotPasswordInput
  req: PayloadRequest
}) {
  const email = normalizeEmail(args.input.email)
  if (!email) {
    throw new Error('Email is required.')
  }

  await args.req.payload.forgotPassword({
    collection: 'users',
    data: {
      email,
    },
    overrideAccess: true,
    req: args.req,
  })

  return {
    email,
    message: 'If the account exists, a password reset email has been sent.',
  }
}

export async function completeResetPassword(args: {
  input: ResetPasswordInput
  req: PayloadRequest
}) {
  const result = await args.req.payload.resetPassword({
    collection: 'users',
    data: {
      password: String(args.input.password || ''),
      token: String(args.input.token || ''),
    },
    overrideAccess: true,
    req: args.req,
  })

  if (!result.token) {
    throw new Error('Password reset did not return an authentication token.')
  }

  const cookie = buildAuthCookie({
    req: args.req,
    token: result.token,
  })

  return {
    headers: authHeaders({
      req: args.req,
      setCookie: cookie,
    }),
    result,
  }
}

export async function verifyAccountEmail(args: {
  input: VerifyEmailInput
  req: PayloadRequest
}) {
  const ok = await args.req.payload.verifyEmail({
    collection: 'users',
    req: args.req,
    token: String(args.input.token || ''),
  })

  return { verified: ok }
}

export async function resendVerificationEmail(args: {
  input: ResendVerificationInput
  req: PayloadRequest
}) {
  const email = normalizeEmail(args.input.email)
  if (!email) {
    throw new Error('Email is required.')
  }

  const users = await args.req.payload.find({
    collection: 'users',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    req: args.req,
    where: {
      email: {
        equals: email,
      },
    },
  })

  const user = users.docs[0]
  if (!user || user._verified) {
    return {
      email,
      message: 'If the account exists and still needs verification, a verification email has been sent.',
    }
  }

  const token = randomBytes(20).toString('hex')
  const updatedUser = await args.req.payload.update({
    collection: 'users',
    data: {
      _verificationToken: token,
    },
    id: user.id,
    overrideAccess: true,
    req: args.req,
  })

  const html = await generateVerifyEmailHTML({
    req: args.req,
    token,
    user: updatedUser,
  })
  const subject = await generateVerifyEmailSubject({
    req: args.req,
    token,
    user: updatedUser,
  })

  await args.req.payload.sendEmail({
    html,
    subject,
    to: email,
  })

  return {
    email,
    message: 'If the account exists and still needs verification, a verification email has been sent.',
  }
}
