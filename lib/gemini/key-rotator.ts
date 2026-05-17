interface KeyStatus {
  key: string
  index: number
  requestCount: number
  minuteStart: number
  isRateLimited: boolean
  rateLimitedUntil: number
  totalRequests: number
  errors: number
}

class GeminiKeyRotator {
  private keys: KeyStatus[]
  private currentIndex: number = 0
  private readonly REQUESTS_PER_MINUTE = 30
  private readonly RATE_LIMIT_COOLDOWN = 65000 // 65 seconds

  constructor() {
    const rawKeys = [
      process.env.GEMINI_API_KEY_1,
      process.env.GEMINI_API_KEY_2,
      process.env.GEMINI_API_KEY_3,
      process.env.GEMINI_API_KEY_4,
      process.env.GEMINI_API_KEY_5,
    ].filter((k): k is string => typeof k === 'string' && k.length > 0 && !k.includes('REPLACE_WITH'))

    if (rawKeys.length === 0) {
      console.warn('⚠️ No valid Gemini API keys configured. AI Guide will be unavailable.')
    } else {
      console.log(`✅ Gemini rotator initialized with ${rawKeys.length} key(s)`)
    }

    this.keys = rawKeys.map((key, index) => ({
      key,
      index,
      requestCount: 0,
      minuteStart: Date.now(),
      isRateLimited: false,
      rateLimitedUntil: 0,
      totalRequests: 0,
      errors: 0,
    }))
  }

  get hasKeys(): boolean {
    return this.keys.length > 0
  }

  getAvailableKey(): KeyStatus | null {
    if (!this.hasKeys) return null
    const now = Date.now()

    // Reset stale rate limits and per-minute counters
    this.keys.forEach(k => {
      if (k.isRateLimited && now > k.rateLimitedUntil) {
        k.isRateLimited = false
        k.requestCount = 0
        k.minuteStart = now
        console.log(`🔄 Key ${k.index + 1} rate limit lifted`)
      }
      if (now - k.minuteStart > 60000) {
        k.requestCount = 0
        k.minuteStart = now
      }
    })

    // Round-robin search for an available key
    for (let i = 0; i < this.keys.length; i++) {
      const idx = (this.currentIndex + i) % this.keys.length
      const key = this.keys[idx]
      if (!key.isRateLimited && key.requestCount < this.REQUESTS_PER_MINUTE) {
        return key
      }
    }

    return null // All keys exhausted
  }

  useKey(keyStatus: KeyStatus): void {
    keyStatus.requestCount++
    keyStatus.totalRequests++
    this.currentIndex = (keyStatus.index + 1) % this.keys.length
  }

  markRateLimited(keyStatus: KeyStatus): void {
    keyStatus.isRateLimited = true
    keyStatus.rateLimitedUntil = Date.now() + this.RATE_LIMIT_COOLDOWN
    keyStatus.errors++
    console.warn(
      `⚠️ Key ${keyStatus.index + 1} rate limited. ` +
      `Cooldown: 65s. ` +
      `Remaining available: ${this.getAvailableCount()}`
    )
  }

  markError(keyStatus: KeyStatus): void {
    keyStatus.errors++
  }

  getAvailableCount(): number {
    return this.keys.filter(k => !k.isRateLimited).length
  }

  getStats() {
    return this.keys.map(k => ({
      keyIndex: k.index + 1,
      requestsThisMinute: k.requestCount,
      totalRequests: k.totalRequests,
      isRateLimited: k.isRateLimited,
      errors: k.errors,
      status: k.isRateLimited ? '🔴 Limited' : '🟢 Active',
    }))
  }
}

// Singleton — shared across all server requests in the same process
export const keyRotator = new GeminiKeyRotator()
