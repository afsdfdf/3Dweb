/**
 * M-01: 注册反枚举 — 统一注册失败消息
 *
 * 前端 AuthForm 和后端 afterOperation hook 都使用此常量，
 * 确保直接调用 API 的客户端也无法通过错误消息差异枚举用户。
 */
export const registrationPrivacyMessage =
  'This email cannot be used for registration. Please try signing in or use password recovery.'
