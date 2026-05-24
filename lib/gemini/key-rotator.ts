import { Redis } from '@upstash/redis'

export interface KeyStatus {
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
  private redis: Redis | null = null

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

    // Initialize Upstash Redis if coordinates are present
    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
      try {
        this.redis = new Redis({
          url: process.env.UPSTASH_REDIS_REST_URL,
          token: process.env.UPSTASH_REDIS_REST_TOKEN,
        })
        console.log('📶 Upstash Redis connection established. AI key-rotation synchronization is ACTIVE.')
      } catch (err) {
        console.error('🔴 Failed to initialize Upstash Redis. Falling back to in-memory state tracking:', err)
      }
    } else {
      console.log('ℹ️ Upstash Redis env credentials missing. Tracking AI rate-limiting in memory.')
    }
  }

  get hasKeys(): boolean {
    return this.keys.length > 0
  }

  async getAvailableKey(): Promise<KeyStatus | null> {
    if (!this.hasKeys) return null
    const now = Date.now()

    // 1. Synchronize state from Upstash Redis if available
    if (this.redis) {
      try {
        const storedIndex = await this.redis.get<number>('gemini_rotator:current_index')
        if (storedIndex !== null) {
          this.currentIndex = Number(storedIndex)
        }

        const syncPromises = this.keys.map(async (k) => {
          const isLimitedKey = `gemini_rotator:rate_limited:${k.index}`
          const reqCountKey = `gemini_rotator:requests:${k.index}`
          const errCountKey = `gemini_rotator:errors:${k.index}`
          const totReqKey = `gemini_rotator:total_requests:${k.index}`

          const [isLimited, reqCount, errs, totReqs] = await Promise.all([
            this.redis!.exists(isLimitedKey),
            this.redis!.get<string | number>(reqCountKey),
            this.redis!.get<string | number>(errCountKey),
            this.redis!.get<string | number>(totReqKey),
          ])

          k.isRateLimited = isLimited === 1
          k.requestCount = reqCount ? Number(reqCount) : 0
          k.errors = errs ? Number(errs) : 0
          k.totalRequests = totReqs ? Number(totReqs) : 0
        })

        await Promise.all(syncPromises)
      } catch (redisError) {
        console.error('🔴 Redis communication error in getAvailableKey(). Falling back to in-memory state tracking:', redisError)
      }
    } else {
      // Local fallback logic: Reset stale rate limits and per-minute counters
      this.keys.forEach(k => {
        if (k.isRateLimited && now > k.rateLimitedUntil) {
          k.isRateLimited = false
          k.requestCount = 0
          k.minuteStart = now
          console.log(`🔄 Key ${k.index + 1} rate limit lifted (in-memory)`)
        }
        if (now - k.minuteStart > 60000) {
          k.requestCount = 0
          k.minuteStart = now
        }
      })
    }

    // 2. Perform Round-robin search for the next valid non-rate-limited key
    for (let i = 0; i < this.keys.length; i++) {
      const idx = (this.currentIndex + i) % this.keys.length
      const key = this.keys[idx]
      if (!key.isRateLimited && key.requestCount < this.REQUESTS_PER_MINUTE) {
        return key
      }
    }

    return null // All configured keys are exhausted or rate limited
  }

  async useKey(keyStatus: KeyStatus): Promise<void> {
    const nextIndex = (keyStatus.index + 1) % this.keys.length
    this.currentIndex = nextIndex
    keyStatus.requestCount++
    keyStatus.totalRequests++

    if (this.redis) {
      try {
        const reqCountKey = `gemini_rotator:requests:${keyStatus.index}`
        const totReqKey = `gemini_rotator:total_requests:${keyStatus.index}`

        await Promise.all([
          this.redis.set('gemini_rotator:current_index', nextIndex),
          this.redis.incr(totReqKey),
          (async () => {
            const count = await this.redis!.incr(reqCountKey)
            if (Number(count) === 1) {
              await this.redis!.expire(reqCountKey, 60)
            }
          })(),
        ])
      } catch (redisError) {
        console.error('🔴 Redis execution error in useKey():', redisError)
      }
    }
  }

  async markRateLimited(keyStatus: KeyStatus): Promise<void> {
    keyStatus.isRateLimited = true
    keyStatus.rateLimitedUntil = Date.now() + this.RATE_LIMIT_COOLDOWN
    keyStatus.errors++

    console.warn(`⚠️ Key index ${keyStatus.index + 1} rate limited. Setting cooldown of 65 seconds.`)

    if (this.redis) {
      try {
        const isLimitedKey = `gemini_rotator:rate_limited:${keyStatus.index}`
        const errCountKey = `gemini_rotator:errors:${keyStatus.index}`

        await Promise.all([
          this.redis.set(isLimitedKey, 'true', { px: this.RATE_LIMIT_COOLDOWN }),
          this.redis.incr(errCountKey),
        ])
      } catch (redisError) {
        console.error('🔴 Redis execution error in markRateLimited():', redisError)
      }
    }
  }

  async disableKey(keyStatus: KeyStatus, durationMs = 24 * 60 * 60 * 1000): Promise<void> {
    keyStatus.isRateLimited = true
    keyStatus.rateLimitedUntil = Date.now() + durationMs
    keyStatus.errors++

    console.warn(`⚠️ Key index ${keyStatus.index + 1} has been disabled for ${durationMs / 1000} seconds due to severe error.`)

    if (this.redis) {
      try {
        const isLimitedKey = `gemini_rotator:rate_limited:${keyStatus.index}`
        const errCountKey = `gemini_rotator:errors:${keyStatus.index}`

        await Promise.all([
          this.redis.set(isLimitedKey, 'true', { px: durationMs }),
          this.redis.incr(errCountKey),
        ])
      } catch (redisError) {
        console.error('🔴 Redis execution error in disableKey():', redisError)
      }
    }
  }

  async markError(keyStatus: KeyStatus): Promise<void> {
    keyStatus.errors++
    if (this.redis) {
      try {
        const errCountKey = `gemini_rotator:errors:${keyStatus.index}`
        await this.redis.incr(errCountKey)
      } catch (redisError) {
        console.error('🔴 Redis execution error in markError():', redisError)
      }
    }
  }

  async getStats() {
    if (this.redis) {
      try {
        const syncPromises = this.keys.map(async (k) => {
          const isLimitedKey = `gemini_rotator:rate_limited:${k.index}`
          const reqCountKey = `gemini_rotator:requests:${k.index}`
          const errCountKey = `gemini_rotator:errors:${k.index}`
          const totReqKey = `gemini_rotator:total_requests:${k.index}`

          const [isLimited, reqCount, errs, totReqs] = await Promise.all([
            this.redis!.exists(isLimitedKey),
            this.redis!.get<string | number>(reqCountKey),
            this.redis!.get<string | number>(errCountKey),
            this.redis!.get<string | number>(totReqKey),
          ])

          k.isRateLimited = isLimited === 1
          k.requestCount = reqCount ? Number(reqCount) : 0
          k.errors = errs ? Number(errs) : 0
          k.totalRequests = totReqs ? Number(totReqs) : 0
        })
        await Promise.all(syncPromises)
      } catch (e) {
        // Fall back gracefully to cache stats
      }
    }

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

export const keyRotator = new GeminiKeyRotator()
