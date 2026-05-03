import { createHash, randomInt } from 'node:crypto'

import type { PayloadRequest } from 'payload'

import { generateRegistrationCodeEmailHTML, generateRegistrationCodeEmailSubject } from '@/lib/emailTemplates'

export type RegistrationVerificationMode = 'email-code' | 'email-link'

type AuthVerificationSettings = {
  registrationCodeExpiresMinutes: number
  registrationVerificationMode: RegistrationVerificationMode
}

const defaultSettings: AuthVerificationSettings = {
  registrationCodeExpiresMinutes: 10,
  registrationVerificationMode: 'email-code',
}

const normalizeEmail = (value: unknown) => String(value || '').trim().toLowerCase()
const normalizeCode = (value: unknown) => String(value || '').replace(/\D/g, '').slice(0, 6)
const registrationCodePurpose = 'register'
const sendCodeMessage = 'If this email can be registered, a verification code has been sent.'

const getSecretPepper = () =>
  process.env.EMAIL_CODE_SECRET || process.env.PAYLOAD_SECRET || 'local-email-code-development-secret'

const clampExpirationMinutes = (value: unknown) => {
  const minutes = Number(value)
  if (!Number.isFinite(minutes)) return defaultSettings.registrationCodeExpiresMinutes
  return Math.min(60, Math.max(3, Math.floor(minutes)))
}

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

export function hashRegistrationVerificationCode(args: { code: string; email: string }) {
  const email = normalizeEmail(args.email)
  const code = normalizeCode(args.code)

  return createHash('sha256')
    .update([getSecretPepper(), email, registrationCodePurpose, code].join(':'))
    .digest('hex')
}

export async function getAuthVerificationSettings(req: PayloadRequest): Promise<AuthVerificationSettings> {
  const securitySettings = await req.payload
    .findGlobal({
      slug: 'security-settings',
      overrideAccess: true,
      req,
    })
    .catch(() => null)

  const settings: Record<string, unknown> = isRecord(securitySettings) ? securitySettings : {}
  const mode =
    settings.registrationVerificationMode === 'email-link' || settings.registrationVerificationMode === 'email-code'
      ? settings.registrationVerificationMode
      : defaultSettings.registrationVerificationMode

  return {
    registrationCodeExpiresMinutes: clampExpirationMinutes(settings.registrationCodeExpiresMinutes),
    registrationVerificationMode: mode,
  }
}

async function findUserByEmail(args: { email: string; req: PayloadRequest }) {
  const result = await args.req.payload.find({
    collection: 'users',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    req: args.req,
    where: {
      email: {
        equals: args.email,
      },
    },
  })

  return result.docs[0] || null
}

export async function sendRegistrationVerificationCode(args: { email: string; req: PayloadRequest }) {
  const email = normalizeEmail(args.email)
  if (!email) {
    throw new Error('Email is required.')
  }

  const settings = await getAuthVerificationSettings(args.req)
  if (settings.registrationVerificationMode !== 'email-code') {
    return {
      email,
      message: 'Registration currently uses email verification links.',
    }
  }

  const existingUser = await findUserByEmail({ email, req: args.req })
  if (existingUser) {
    return {
      email,
      message: sendCodeMessage,
    }
  }

  const code = randomInt(0, 1_000_000).toString().padStart(6, '0')
  const expiresAt = new Date(Date.now() + settings.registrationCodeExpiresMinutes * 60_000).toISOString()

  await args.req.payload.create({
    collection: 'email-verification-codes',
    data: {
      attempts: 0,
      codeHash: hashRegistrationVerificationCode({ code, email }),
      email,
      expiresAt,
      purpose: registrationCodePurpose,
    },
    overrideAccess: true,
    req: args.req,
  })

  await args.req.payload.sendEmail({
    html: await generateRegistrationCodeEmailHTML({
      code,
      expiresMinutes: settings.registrationCodeExpiresMinutes,
      req: args.req,
    }),
    subject: await generateRegistrationCodeEmailSubject({
      req: args.req,
    }),
    to: email,
  })

  return {
    email,
    message: sendCodeMessage,
  }
}

export async function verifyRegistrationCode(args: { code: string; email: string; req: PayloadRequest }) {
  const email = normalizeEmail(args.email)
  const code = normalizeCode(args.code)

  if (!email || code.length !== 6) {
    throw new Error('Invalid or expired verification code.')
  }

  const now = new Date()
  const result = await args.req.payload.find({
    collection: 'email-verification-codes',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    req: args.req,
    sort: '-createdAt',
    where: {
      and: [
        {
          email: {
            equals: email,
          },
        },
        {
          purpose: {
            equals: registrationCodePurpose,
          },
        },
        {
          consumedAt: {
            exists: false,
          },
        },
        {
          expiresAt: {
            greater_than: now.toISOString(),
          },
        },
      ],
    },
  })

  const record = result.docs[0] as { attempts?: number | null; codeHash?: string | null; id: number | string } | undefined
  if (!record || Number(record.attempts || 0) >= 5) {
    throw new Error('Invalid or expired verification code.')
  }

  const expectedHash = hashRegistrationVerificationCode({ code, email })
  if (record.codeHash !== expectedHash) {
    await args.req.payload.update({
      collection: 'email-verification-codes',
      data: {
        attempts: Number(record.attempts || 0) + 1,
      },
      id: record.id,
      overrideAccess: true,
      req: args.req,
    })
    throw new Error('Invalid or expired verification code.')
  }

  await args.req.payload.update({
    collection: 'email-verification-codes',
    data: {
      consumedAt: now.toISOString(),
    },
    id: record.id,
    overrideAccess: true,
    req: args.req,
  })
}
