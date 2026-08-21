// recorder.js
import { record } from 'rrweb'
import { compressSync, strToU8 } from 'fflate'

const ALLOWED_ROUTES = [
  /^\/$/,                  // homepage
  /^\/products\/?$/,       // PLP
  /^\/product\/[^/]+\/?$/, // PDP
  /^\/cart\/?$/,           // cart
]

const FLUSH_INTERVAL_MS = 5000
const API_URL = "http://localhost:4000/api/record/ingest";

class SessionRecorder {
  constructor() {
    this.stopFn = null
    this.buffer = []
    this.flushTimer = null
    this.sessionId = null   // no session until we know a user is logged in
    this.userId = null
  }

  // reads auth_user from localStorage fresh each time — don't cache in constructor,
  // since login/logout can happen without a full page reload
  _getLoggedInUserId() {
    try {
      const raw = localStorage.getItem('auth_user')
      if (!raw) return null
      const parsed = JSON.parse(raw)
      return parsed?.userId || null   // ⚠️ change `userId` here if your auth_user uses a different key (e.g. `id`, `_id`)
    } catch (err) {
      console.warn('[recorder] failed to parse auth_user:', err.message)
      return null
    }
  }

  _getOrCreateSessionId(userId) {
    // key the stored session id by user, so switching accounts in the same
    // browser tab (logout -> different login) doesn't reuse the wrong session
    const storageKey = `rr_session_id_${userId}`
    let id = sessionStorage.getItem(storageKey)
    if (!id) {
      id = crypto.randomUUID()
      sessionStorage.setItem(storageKey, id)
    }
    return id
  }

  isAllowed(pathname) {
    return ALLOWED_ROUTES.some((re) => re.test(pathname))
  }

  start(pathname) {
    if (this.stopFn) return // already recording
    if (!this.isAllowed(pathname)) return

    const userId = this._getLoggedInUserId()
    if (!userId) return // not logged in — don't record

    this.userId = userId
    this.sessionId = this._getOrCreateSessionId(userId)

    this.stopFn = record({
      emit: (event) => this.buffer.push(event),
      sampling: { mousemove: 50, scroll: 150 },
      checkoutEveryNms: 30000,
      blockClass: 'rr-block',   // exclude element entirely
      maskTextClass: 'rr-mask', // keep layout, mask text content
      maskAllInputs: true,      // default-safe: any stray input (e.g. coupon field) is masked
    })

    this.flushTimer = setInterval(() => this.flush(), FLUSH_INTERVAL_MS)
    window.addEventListener('beforeunload', this._onUnload)
  }

  stop() {
    if (!this.stopFn) return
    this.stopFn()
    this.stopFn = null
    clearInterval(this.flushTimer)
    window.removeEventListener('beforeunload', this._onUnload)
    this.flush() // send whatever's left before tearing down
    this.userId = null
  }

  _onUnload = () => this.flush(true)

  flush(isUnload = false) {
    if (this.buffer.length === 0) return
    if (!this.sessionId) return // safety net — never send data with no session/user context

    const events = this.buffer.splice(0, this.buffer.length)
    const json = JSON.stringify({
      sessionId: this.sessionId,
      userId: this.userId,
      page: location.pathname,
      events,
    })
    const compressed = compressSync(strToU8(json))
    const blob = new Blob([compressed], { type: 'application/octet-stream' })

    if (isUnload && navigator.sendBeacon) {
      navigator.sendBeacon(API_URL, blob)
    } else {
      fetch(API_URL, { method: 'POST', body: blob, keepalive: true })
    }
  }

  // called on every route change AND should also be called right after login/logout
  // (e.g. right after a successful login call sets auth_user in localStorage)
  onRouteChange(pathname) {
    const userId = this._getLoggedInUserId()
    const allowed = this.isAllowed(pathname) && !!userId

    if (allowed && !this.stopFn) {
      this.start(pathname)
    } else if (!allowed && this.stopFn) {
      this.stop()
    } else if (allowed && this.stopFn && userId !== this.userId) {
      // edge case: user switched accounts mid-session without a route change
      this.stop()
      this.start(pathname)
    }
  }
}

export const sessionRecorder = new SessionRecorder()