// lib/recorder.js
import { record } from 'rrweb'
import { compressSync, strToU8 } from 'fflate'

const ALLOWED_ROUTES = [
  /^\/$/,
  /^\/products\/?$/,
  /^\/products-detail\/[^/]+\/?$/,
  /^\/cart\/?$/,
  /^\/payment\/?$/,
  /^\/confirmation\/?$/,
]

const FLUSH_INTERVAL_MS = 5000
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')
const API_URL = `${API_BASE_URL}/api/record/ingest`

// The analytics SDK (vision.js) keeps its session id in this sessionStorage key and
// stamps it on every live event. The recorder reads and writes the SAME key, so a live
// feed row and its recording share one session id. That is the only link the dashboard
// has for guests, whose analytics events carry no user id.
const SDK_SESSION_KEY = 'vision_session_id'

function resolveProjectId() {
  return document.querySelector('script[data-project-id]')
    ?.getAttribute('data-project-id')?.trim() || null
}

class SessionRecorder {
  constructor() {
    this.stopFn = null
    this.buffer = []
    this.flushTimer = null
    this.sessionId = null
    this.userId = null
    this.projectId = null
    this.context = null
    this.page = null
  }

  _getLoggedInUserId() {
    try {
      const user = JSON.parse(localStorage.getItem('auth_user') || 'null')
      // Change this key if your auth object uses id or _id instead.
      return user?.userId ? String(user.userId) : null
    } catch {
      return null
    }
  }

  _saveContext() {
    try {
      sessionStorage.setItem(`rr_context_${this.projectId}`, JSON.stringify(this.context))
    } catch {
      // Recording still works in memory when browser storage is unavailable.
    }
  }

  _readSdkSessionId() {
    try {
      return sessionStorage.getItem(SDK_SESSION_KEY) || null
    } catch {
      return null
    }
  }

  // The SDK reads this key on every event, so after a reset its events follow the new session.
  _publishSessionId() {
    try {
      sessionStorage.setItem(SDK_SESSION_KEY, this.sessionId)
    } catch {
      // Without storage the ids simply can't be linked; recording still works.
    }
  }

  _syncIdentity() {
    const authUserId = this._getLoggedInUserId()
    if (!this.context) {
      try {
        const stored = JSON.parse(sessionStorage.getItem(`rr_context_${this.projectId}`))
        if (stored?.sessionId && stored?.anonymousId &&
            (stored.authUserId === null || typeof stored.authUserId === 'string')) {
          this.context = stored
        }
      } catch { /* Use a new session if storage is unavailable or invalid. */ }
    }

    // Logout or switching accounts starts a fresh session. A guest login does not.
    const reset = !this.context ||
      (this.context.authUserId !== null && this.context.authUserId !== authUserId)
    if (reset) {
      const firstInTab = !this.context
      this.context = {
        // First recording in this tab adopts the id the SDK already issued, so events
        // sent before recording started still belong to it. After a logout a new id is made.
        sessionId: (firstInTab && this._readSdkSessionId()) || crypto.randomUUID(),
        anonymousId: `guest_${crypto.randomUUID()}`,
        authUserId,
      }
    } else {
      this.context.authUserId = authUserId
    }

    this.sessionId = this.context.sessionId
    this.userId = authUserId || this.context.anonymousId
    this._publishSessionId()
    this._saveContext()
  }

  isAllowed(pathname) {
    return ALLOWED_ROUTES.some((re) => re.test(pathname))
  }

  start(pathname = location.pathname) {
    if (this.stopFn || !this.isAllowed(pathname)) return
    this.projectId ||= resolveProjectId()
    if (!this.projectId) {
      console.error('[recorder] Missing data-project-id on the SDK script')
      return
    }

    this._syncIdentity()
    this.page = pathname
    this.stopFn = record({
      emit: (event) => this.buffer.push(event),
      sampling: { mousemove: 50, scroll: 150 },
      checkoutEveryNms: 30000,
      blockClass: 'rr-block',
      maskTextClass: 'rr-mask',
      maskAllInputs: true,
    })

    if (!this.stopFn) return
    this.flushTimer = setInterval(() => this.flush(), FLUSH_INTERVAL_MS)
    window.addEventListener('pagehide', this._onUnload)
  }

  stop() {
    this.stopFn?.()
    this.stopFn = null
    clearInterval(this.flushTimer)
    this.flushTimer = null
    window.removeEventListener('pagehide', this._onUnload)
    this.flush()
    // Keep the context for returning to an allowed route in this tab.
  }

  _onUnload = () => this.flush(true)

  flush(isUnload = false) {
    if (!this.buffer.length || !this.sessionId || !this.projectId) return

    const events = this.buffer.splice(0)
    let blob
    try {
      blob = new Blob([compressSync(strToU8(JSON.stringify({
        projectId: this.projectId,
        sessionId: this.sessionId,
        userId: this.userId,
        anonymousId: this.context.anonymousId,
        isGuest: this.context.authUserId === null,
        page: this.page,
        events,
      })))], { type: 'application/octet-stream' })
    } catch (error) {
      this.buffer.unshift(...events)
      console.error('[recorder] Failed to encode recording:', error)
      return
    }

    const url = `${API_URL}?projectId=${encodeURIComponent(this.projectId)}`
    if (isUnload && navigator.sendBeacon) {
      try {
        if (navigator.sendBeacon(url, blob)) return
      } catch { /* Try fetch when beacon is unavailable or rejected. */ }
    }

    // Keep the payload's original identity even if login/logout happens in flight.
    // Retry/deduplication requires support from the ingest API; don't silently
    // requeue an old user's events under the next user's identity.
    fetch(url, { method: 'POST', body: blob, keepalive: isUnload })
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
      })
      .catch((error) => console.error('[recorder] Recording upload failed:', error))
  }

  // Call on every route change AND immediately after updating auth_user at login/logout.
  onRouteChange(pathname = location.pathname) {
    this.projectId ||= resolveProjectId()
    if (!this.projectId) return

    const authUserId = this._getLoggedInUserId()
    const identityChanged = this.context && this.context.authUserId !== authUserId

    // Flush the previous page/identity before changing metadata. Starting rrweb
    // again creates a full snapshot when crossing an authentication boundary.
    if (this.stopFn && (identityChanged || !this.isAllowed(pathname))) {
      this.stop()
    } else if (this.stopFn && this.page !== pathname) {
      this.flush()
    }

    this._syncIdentity()
    this.page = pathname
    if (this.isAllowed(pathname) && !this.stopFn) this.start(pathname)
  }
}

export const sessionRecorder = new SessionRecorder()
