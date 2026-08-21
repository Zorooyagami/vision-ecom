/**
 * Vision Tracker SDK
 * ------------------
 *
 * Responsibilities:
 *
 *   1. Persistent userId from auth_user
 *   2. Per-session sessionId
 *   3. Event tracking
 *   4. Event batching
 *   5. Backend delivery
 *   6. Automatic page_view tracking
 *   7. SPA route-change detection
 *
 * Framework agnostic:
 *   - React
 *   - Vue
 *   - Nuxt
 *   - Plain HTML
 *
 * API:
 *
 *   window.vision.track('add_to_cart', {...})
 *   window.vision.getUserId()
 *   window.vision.getSessionId()
 *   window.vision.flush()
 */

(function () {
  "use strict";

  // =====================================================================
  // CONFIG
  // =====================================================================

  const API_URL =
    "https://vision-engine.onrender.com/api/events";

  // Send queued events every 5 seconds.
  const FLUSH_INTERVAL_MS = 5000;

  // Send immediately if queue reaches this size.
  const MAX_BATCH_SIZE = 20;

  // Check URL periodically as a fallback for SPA navigation.
  const ROUTE_CHECK_INTERVAL_MS = 250;


  // =====================================================================
  // ID GENERATION
  // =====================================================================

  function generateId() {
    return (
      Date.now().toString(36) +
      Math.random().toString(36).substring(2, 10)
    );
  }


  // =====================================================================
  // USER ID
  // =====================================================================
  //
  // The backend uses SHA-256(email).slice(0, 16)
  //
  // This MUST remain consistent with:
  //
  // authController.js
  //
  // generateUserId(email)
  //
  // =====================================================================

  async function generateUserId(email) {
    const normalizedEmail =
      String(email || "")
        .trim()
        .toLowerCase();

    if (!normalizedEmail) {
      return null;
    }

    // Browser crypto API
    if (
      window.crypto &&
      window.crypto.subtle &&
      window.TextEncoder
    ) {
      try {
        const data =
          new TextEncoder().encode(normalizedEmail);

        const hashBuffer =
          await window.crypto.subtle.digest(
            "SHA-256",
            data
          );

        const hashArray =
          Array.from(new Uint8Array(hashBuffer));

        const hashHex =
          hashArray
            .map((byte) =>
              byte.toString(16).padStart(2, "0")
            )
            .join("");

        return hashHex.slice(0, 16);
      } catch (error) {
        console.error(
          "[Vision Tracker] failed to generate userId:",
          error
        );
      }
    }

    return null;
  }


  // =====================================================================
  // SESSION ID
  // =====================================================================

  function getSessionId() {
    let sessionId =
      sessionStorage.getItem(
        "vision_session_id"
      );

    if (!sessionId) {
      sessionId = generateId();

      sessionStorage.setItem(
        "vision_session_id",
        sessionId
      );
    }

    return sessionId;
  }


  // =====================================================================
  // USER ID
  // =====================================================================

  let cachedUserId = null;
  let userIdPromise = null;

  function getUserId() {
    // Return cached ID if available.
    if (cachedUserId) {
      return cachedUserId;
    }

    const storedAuthData =
      localStorage.getItem("auth_user");

    if (!storedAuthData) {
      return null;
    }

    let authData;

    try {
      authData =
        JSON.parse(storedAuthData);
    } catch (error) {
      console.error(
        "[Vision Tracker] invalid auth_user JSON:",
        error
      );

      return null;
    }

    const email =
      authData?.email;

    if (!email) {
      return null;
    }

    /*
     * User ID generation is asynchronous because
     * browser crypto.subtle is asynchronous.
     *
     * We therefore use the existing userId from
     * auth_user if available.
     */

    if (authData.userId) {
      cachedUserId =
        authData.userId;

      return cachedUserId;
    }

    /*
     * If the auth context doesn't currently store
     * userId, return null for this event.
     *
     * The auth context should ideally save the
     * backend returned userId into auth_user.
     */

    return null;
  }


  // =====================================================================
  // EVENT QUEUE
  // =====================================================================

  let eventQueue = [];


  // =====================================================================
  // CREATE EVENT
  // =====================================================================

  function createEvent(
    eventName,
    properties
  ) {
    return {
      event: eventName,

      userId:
        getUserId(),

      sessionId:
        getSessionId(),

      timestamp:
        new Date().toISOString(),

      url:
        window.location.href,

      path:
        window.location.pathname,

      referrer:
        document.referrer || null,

      properties:
        properties || {},
    };
  }


  // =====================================================================
  // TRACK
  // =====================================================================

  function track(
    eventName,
    properties
  ) {
    if (!eventName) {
      console.warn(
        "[Vision Tracker] event name is required"
      );

      return;
    }

    const eventObject =
      createEvent(
        eventName,
        properties
      );

    console.log(
      "[Vision Tracker] queued:",
      eventObject
    );

    eventQueue.push(
      eventObject
    );

    /*
     * Flush immediately when queue
     * reaches maximum size.
     */

    if (
      eventQueue.length >=
      MAX_BATCH_SIZE
    ) {
      flush(false);
    }
  }


  // =====================================================================
  // SEND EVENTS
  // =====================================================================

  function flush(useBeacon = false) {
    if (
      eventQueue.length === 0
    ) {
      return;
    }

    /*
     * Take current queue and clear it
     * immediately.
     */

    const eventsToSend =
      eventQueue;

    eventQueue = [];

    const payload =
      JSON.stringify({
        events:
          eventsToSend,
      });


    // ---------------------------------------------------------------
    // SEND BEACON
    // ---------------------------------------------------------------

    if (
      useBeacon &&
      navigator.sendBeacon
    ) {
      try {
        const blob =
          new Blob(
            [payload],
            {
              type:
                "application/json",
            }
          );

        const success =
          navigator.sendBeacon(
            API_URL,
            blob
          );

        if (!success) {
          console.warn(
            "[Vision Tracker] sendBeacon failed"
          );

          /*
           * Put events back into queue
           * if browser rejected beacon.
           */

          eventQueue.unshift(
            ...eventsToSend
          );
        }

        return;
      } catch (error) {
        console.warn(
          "[Vision Tracker] beacon error:",
          error
        );

        eventQueue.unshift(
          ...eventsToSend
        );

        return;
      }
    }


    // ---------------------------------------------------------------
    // NORMAL FETCH
    // ---------------------------------------------------------------

    fetch(API_URL, {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",
      },

      body: payload,

      keepalive: true,
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(
            `HTTP ${response.status}`
          );
        }

        console.log(
          `[Vision Tracker] sent ${eventsToSend.length} events`
        );
      })
      .catch((error) => {
        console.warn(
          "[Vision Tracker] failed to send events:",
          error.message
        );

        /*
         * Put events back into queue so
         * they aren't immediately lost.
         */

        eventQueue.unshift(
          ...eventsToSend
        );
      });
  }


  // =====================================================================
  // PERIODIC FLUSH
  // =====================================================================

  setInterval(
    () => {
      flush(false);
    },
    FLUSH_INTERVAL_MS
  );


  // =====================================================================
  // PAGE UNLOAD
  // =====================================================================

  window.addEventListener(
    "visibilitychange",
    () => {
      if (
        document.visibilityState ===
        "hidden"
      ) {
        flush(true);
      }
    }
  );


  window.addEventListener(
    "pagehide",
    () => {
      flush(true);
    }
  );


  // =====================================================================
  // PAGE VIEW
  // =====================================================================

  function trackPageView() {
    track(
      "page_view",
      {
        title:
          document.title,

        path:
          window.location.pathname,

        url:
          window.location.href,

        screenWidth:
          window.innerWidth,

        screenHeight:
          window.innerHeight,
      }
    );
  }


  // =====================================================================
  // SPA ROUTE DETECTION
  // =====================================================================
  //
  // This supports:
  //
  // React Router
  // Vue Router
  // Nuxt
  // Plain history API
  //
  // We detect:
  //
  // pushState
  // replaceState
  // popstate
  // URL changes as a fallback
  //
  // =====================================================================

  let currentUrl =
    window.location.href;


  function handleRouteChange() {
    const newUrl =
      window.location.href;

    /*
     * Nothing changed.
     */

    if (
      newUrl === currentUrl
    ) {
      return;
    }

    /*
     * URL actually changed.
     */

    const previousUrl =
      currentUrl;

    currentUrl =
      newUrl;

    console.log(
      "[Vision Tracker] route changed:",
      {
        from:
          previousUrl,

        to:
          newUrl,
      }
    );

    /*
     * Wait one tick so React/Vue has
     * a chance to update document.title.
     */

    setTimeout(
      () => {
        trackPageView();
      },
      0
    );
  }


  // =====================================================================
  // PATCH pushState
  // =====================================================================

  const originalPushState =
    history.pushState;

  history.pushState =
    function (...args) {
      originalPushState.apply(
        this,
        args
      );

      setTimeout(
        handleRouteChange,
        0
      );
    };


  // =====================================================================
  // PATCH replaceState
  // =====================================================================

  const originalReplaceState =
    history.replaceState;

  history.replaceState =
    function (...args) {
      originalReplaceState.apply(
        this,
        args
      );

      setTimeout(
        handleRouteChange,
        0
      );
    };


  // =====================================================================
  // BACK / FORWARD
  // =====================================================================

  window.addEventListener(
    "popstate",
    () => {
      handleRouteChange();
    }
  );


  // =====================================================================
  // URL FALLBACK WATCHER
  // =====================================================================
  //
  // Some frameworks/router implementations
  // may change the URL without triggering
  // the hooks above.
  //
  // This catches those cases.
  //
  // =====================================================================

  setInterval(
    () => {
      handleRouteChange();
    },
    ROUTE_CHECK_INTERVAL_MS
  );


  // =====================================================================
  // INITIAL PAGE VIEW
  // =====================================================================

  function init() {
    console.log(
      "[Vision Tracker] initialized"
    );

    console.log(
      "[Vision Tracker] sessionId:",
      getSessionId()
    );

    console.log(
      "[Vision Tracker] userId:",
      getUserId()
    );

    /*
     * Initial page view.
     */

    trackPageView();
  }


  // =====================================================================
  // PUBLIC API
  // =====================================================================

  window.vision = {

    /*
     * Track custom event.
     *
     * Example:
     *
     * window.vision.track(
     *   "add_to_cart",
     *   {
     *     productId: "p1",
     *     price: 1999,
     *     quantity: 1
     *   }
     * );
     */

    track:


      track,


    /*
     * Get current session.
     */

    getSessionId:


      getSessionId,


    /*
     * Get current user.
     */

    getUserId:


      getUserId,


    /*
     * Force flush.
     */

    flush:
      () => flush(false),
  };


  // =====================================================================
  // START SDK
  // =====================================================================

  init();

})();


// ========================================================================
// EXAMPLE EVENTS
// ========================================================================
//
// Product listing
//
// window.vision?.track(
//   "view_item_list",
//   {
//     listId: "cat_shoes",
//     listName: "Footwear",
//     itemIds: ["p1", "p2", "p3"]
//   }
// );
//
//
// Product selection
//
// window.vision?.track(
//   "select_item",
//   {
//     productId: "p1",
//     listId: "cat_shoes",
//     position: 0
//   }
// );
//
//
// Product detail
//
// window.vision?.track(
//   "product_view",
//   {
//     productId: "p1",
//     name: "Running Shoes",
//     price: 1999,
//     category: "Footwear"
//   }
// );
//
//
// Add to cart
//
// window.vision?.track(
//   "add_to_cart",
//   {
//     productId: "p1",
//     price: 1999,
//     quantity: 1,
//     source: "product_page"
//   }
// );
//
//
// Remove from cart
//
// window.vision?.track(
//   "remove_from_cart",
//   {
//     productId: "p1",
//     price: 1999,
//     quantity: 1
//   }
// );
//
//
// View cart
//
// window.vision?.track(
//   "view_cart",
//   {
//     itemCount: 2,
//     cartValue: 3998
//   }
// );
//
//
// Checkout
//
// window.vision?.track(
//   "checkout_start",
//   {
//     itemCount: 2,
//     cartValue: 3998
//   }
// );
//
//
// Payment
//
// window.vision?.track(
//   "add_payment_info",
//   {
//     paymentMethod: "card"
//   }
// );
//
//
// Purchase
//
// window.vision?.track(
//   "purchase",
//   {
//     orderId: "ord_abc123",
//     orderValue: 3998,
//     items: [
//       {
//         productId: "p1",
//         quantity: 1,
//         price: 1999
//       },
//       {
//         productId: "p2",
//         quantity: 1,
//         price: 1999
//       }
//     ],
//     paymentMethod: "card"
//   }
// );
//
//
// Order confirmation
//
// window.vision?.track(
//   "order_confirmation",
//   {
//     orderId: "ord_abc123"
//   }
// );