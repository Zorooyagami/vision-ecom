import React, { useMemo } from "react";
import "./CustomerJourneyFlow.css";

const STAGES = [
  "Home",
  "Products",
  "Product Detail",
  "Add to Cart",
  "View Cart",
  "Checkout",
];

const NODE_WIDTH = 150;
const NODE_HEIGHT = 64;

const NODE_Y = 220;

const NODE_X = {
  Home: 40,
  Products: 240,
  "Product Detail": 440,
  "Add to Cart": 640,
  "View Cart": 840,
  Checkout: 1040,
};

const normalizeStage = (stage) => {
  const value = stage.trim().toLowerCase();

  if (value === "home") return "Home";

  if (
    value === "products" ||
    value === "products page" ||
    value === "product page"
  ) {
    return "Products";
  }

  if (
    value === "product detail" ||
    value === "product details" ||
    value === "pdp"
  ) {
    return "Product Detail";
  }

  if (value === "add to cart") {
    return "Add to Cart";
  }

  if (value === "view cart") {
    return "View Cart";
  }

  if (value === "checkout" || value === "begin checkout") {
    return "Checkout";
  }

  return stage.trim();
};

const parseJourney = (label) => {
  return label
    .split("→")
    .map(normalizeStage)
    .filter(Boolean);
};

export default function CustomerJourneyFlow({ data }) {
  /*
   * Convert journeys into individual connections.
   *
   * Example:
   *
   * Home → Products → Product Detail → Add to Cart
   *
   * becomes:
   *
   * Home → Products
   * Products → Product Detail
   * Product Detail → Add to Cart
   */
  const edges = useMemo(() => {
    const edgeMap = new Map();

    Object.values(data.journeys || {}).forEach((journey) => {
      const stages = parseJourney(journey.label);

      for (let i = 0; i < stages.length - 1; i++) {
        const from = stages[i];
        const to = stages[i + 1];

        const key = `${from}|||${to}`;

        if (!edgeMap.has(key)) {
          edgeMap.set(key, {
            from,
            to,
            count: 0,
          });
        }

        edgeMap.get(key).count += journey.sessionCount;
      }
    });

    return Array.from(edgeMap.values());
  }, [data]);

  const maxTraffic = Math.max(
    ...edges.map((edge) => edge.count),
    1
  );

  /*
   * Calculate node traffic.
   */
  const nodeTraffic = useMemo(() => {
    const traffic = {};

    STAGES.forEach((stage) => {
      traffic[stage] = 0;
    });

    edges.forEach((edge) => {
      traffic[edge.from] += edge.count;
    });

    // For nodes that only receive traffic,
    // use incoming traffic.
    edges.forEach((edge) => {
      if (traffic[edge.to] === 0) {
        traffic[edge.to] += edge.count;
      }
    });

    return traffic;
  }, [edges]);

  /*
   * Get the thickness of a connection.
   *
   * 126 sessions = thickest
   * 2 sessions   = thinnest
   */
  const getStrokeWidth = (count) => {
    const ratio = count / maxTraffic;

    return 5 + Math.sqrt(ratio) * 28;
  };

  /*
   * Build properly routed SVG paths.
   */
  const getPath = (edge) => {
    const fromX = NODE_X[edge.from];
    const toX = NODE_X[edge.to];

    const startX = fromX + NODE_WIDTH;
    const endX = toX;

    const centerY = NODE_Y + NODE_HEIGHT / 2;

    const fromIndex = STAGES.indexOf(edge.from);
    const toIndex = STAGES.indexOf(edge.to);

    const gap = toIndex - fromIndex;

    /*
     * Adjacent nodes:
     *
     * Home → Products
     * Products → Product Detail
     * Product Detail → Add to Cart
     * Add to Cart → View Cart
     * View Cart → Checkout
     *
     * These should be simple horizontal curves.
     */
    if (gap === 1) {
      return `
        M ${startX} ${centerY}
        C
          ${startX + 45} ${centerY},
          ${endX - 45} ${centerY},
          ${endX} ${centerY}
      `;
    }

    /*
     * Home → Add to Cart
     *
     * Route ABOVE the intermediate nodes.
     */
    if (
      edge.from === "Home" &&
      edge.to === "Add to Cart"
    ) {
      const routeY = 110;

      return `
        M ${startX} ${centerY}
        C
          ${startX + 80} ${centerY},
          ${startX + 80} ${routeY},
          ${startX + 160} ${routeY}

        C
          ${endX - 160} ${routeY},
          ${endX - 80} ${routeY},
          ${endX} ${centerY}
      `;
    }

    /*
     * Products → Add to Cart
     *
     * Route BELOW Product Detail.
     */
    if (
      edge.from === "Products" &&
      edge.to === "Add to Cart"
    ) {
      const routeY = 380;

      return `
        M ${startX} ${centerY}
        C
          ${startX + 55} ${centerY},
          ${startX + 55} ${routeY},
          ${startX + 100} ${routeY}

        C
          ${endX - 100} ${routeY},
          ${endX - 55} ${routeY},
          ${endX} ${centerY}
      `;
    }

    /*
     * Generic fallback for future journeys.
     */
    const routeY =
      gap > 1
        ? centerY - 100
        : centerY + 100;

    return `
      M ${startX} ${centerY}
      C
        ${startX + 60} ${centerY},
        ${startX + 60} ${routeY},
        ${(startX + endX) / 2} ${routeY}

      C
        ${endX - 60} ${routeY},
        ${endX - 60} ${centerY},
        ${endX} ${centerY}
    `;
  };

  return (
    <div className="journey-card">

      {/* HEADER */}
      <div className="journey-header">
        <div>
          <h3>Customer Journey</h3>
          <p>
            How users move through your website
          </p>
        </div>

        <div className="journey-total">
          <span>Total Sessions</span>
          <strong>
            {data.totalSessions?.toLocaleString()}
          </strong>
        </div>
      </div>

      {/* GRAPH */}
      <div className="journey-graph">

        <svg
          viewBox="0 0 1230 500"
          preserveAspectRatio="xMidYMid meet"
        >

          {/* =========================
              CONNECTIONS
          ========================== */}

          {edges.map((edge) => {
            const strokeWidth =
              getStrokeWidth(edge.count);

            return (
              <g
                key={`${edge.from}-${edge.to}`}
                className="journey-edge"
              >

                {/* Soft outer glow */}
                <path
                  d={getPath(edge)}
                  className="journey-edge-shadow"
                  strokeWidth={strokeWidth + 12}
                />

                {/* Main line */}
                <path
                  d={getPath(edge)}
                  className="journey-edge-line"
                  strokeWidth={strokeWidth}
                />

                {/* Tooltip */}
                <title>
                  {edge.from} → {edge.to}
                  {"\n"}
                  {edge.count} sessions
                  {"\n"}
                  {(
                    (edge.count /
                      data.totalSessions) *
                    100
                  ).toFixed(2)}
                  % of all sessions
                </title>

              </g>
            );
          })}

          {/* =========================
              NODES
          ========================== */}

          {STAGES.map((stage) => {
            /*
             * Only show stages that actually
             * exist in the current data.
             */
            const exists =
              edges.some(
                (edge) =>
                  edge.from === stage ||
                  edge.to === stage
              );

            if (!exists) return null;

            const x = NODE_X[stage];
            const y = NODE_Y;

            const traffic =
              nodeTraffic[stage] || 0;

            return (
              <g
                key={stage}
                className="journey-node"
              >

                <rect
                  x={x}
                  y={y}
                  width={NODE_WIDTH}
                  height={NODE_HEIGHT}
                  rx="12"
                />

                <text
                  x={x + NODE_WIDTH / 2}
                  y={y + 27}
                  textAnchor="middle"
                  className="node-title"
                >
                  {stage}
                </text>

                <text
                  x={x + NODE_WIDTH / 2}
                  y={y + 48}
                  textAnchor="middle"
                  className="node-subtitle"
                >
                  {traffic} sessions
                </text>

                <title>
                  {stage}: {traffic} sessions
                </title>

              </g>
            );
          })}
        </svg>
      </div>

      {/* =========================
          JOURNEY LIST
      ========================== */}

      <div className="journey-list">

        {Object.entries(data.journeys || {}).map(
          ([key, journey]) => (
            <div
              className="journey-row"
              key={key}
            >

              <div className="journey-row-info">

                <div className="journey-row-label">
                  {journey.label}
                </div>

                <div className="journey-progress">
                  <div
                    style={{
                      width: `${Math.min(
                        journey.percentOfAllSessions,
                        100
                      )}%`,
                    }}
                  />
                </div>

              </div>

              <div className="journey-row-stats">
                <strong>
                  {journey.sessionCount}
                </strong>

                <span>
                  {journey.percentOfAllSessions}%
                </span>
              </div>

            </div>
          )
        )}

      </div>
    </div>
  );
}