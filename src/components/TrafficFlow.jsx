// src/components/TrafficFlow.jsx

import React, { useState, useEffect } from 'react';
import './TrafficFlow.css';

const TrafficFlow = () => {
  const [flowData, setFlowData] = useState({
    nodes: [
      { id: 'home', label: 'Home Page', x: 50, y: 250, icon: '🏠' },
      { id: 'products', label: 'Products List', x: 250, y: 100, icon: '📋' },
      { id: 'productDetail', label: 'Product Detail', x: 450, y: 50, icon: '📱' },
      { id: 'cart', label: 'View Cart', x: 650, y: 100, icon: '🛒' },
      { id: 'checkout', label: 'Checkout', x: 850, y: 250, icon: '💳' },
    ],
    edges: [
      { from: 'home', to: 'products', count: 1500, label: 'Browse' },
      { from: 'products', to: 'productDetail', count: 850, label: 'Click Product' },
      { from: 'productDetail', to: 'cart', count: 320, label: 'Add to Cart' },
      { from: 'cart', to: 'checkout', count: 180, label: 'Proceed to Checkout' },
      { from: 'home', to: 'productDetail', count: 200, label: 'Direct Search' },
      { from: 'products', to: 'cart', count: 120, label: 'Quick Add' },
      { from: 'productDetail', to: 'products', count: 280, label: 'Back to Browse' },
      { from: 'cart', to: 'products', count: 65, label: 'Continue Shopping' },
      { from: 'checkout', to: 'home', count: 30, label: 'Return Home' },
    ]
  });

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setFlowData(prev => {
        const newEdges = prev.edges.map(edge => ({
          ...edge,
          count: Math.max(10, edge.count + Math.floor(Math.random() * 20) - 10)
        }));
        return { ...prev, edges: newEdges };
      });
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Calculate max count for arrow thickness scaling
  const maxCount = Math.max(...flowData.edges.map(e => e.count));

  // Get arrow thickness based on count
  const getArrowThickness = (count) => {
    const minThickness = 2;
    const maxThickness = 12;
    const ratio = count / maxCount;
    return minThickness + (maxThickness - minThickness) * ratio;
  };

  // Get arrow color based on count
  const getArrowColor = (count) => {
    const ratio = count / maxCount;
    if (ratio > 0.7) return '#dc2626'; // Red - high traffic
    if (ratio > 0.4) return '#f59e0b'; // Yellow - medium traffic
    return '#3b82f6'; // Blue - low traffic
  };

  // Calculate arrow path between two points
  const getArrowPath = (fromX, fromY, toX, toY) => {
    const dx = toX - fromX;
    const dy = toY - fromY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const midX = (fromX + toX) / 2;
    const midY = (fromY + toY) / 2;
    const offset = 20; // Curve offset
    
    // Create curved path
    return `M ${fromX} ${fromY} Q ${midX} ${midY - offset * (dy > 0 ? 1 : -1)} ${toX} ${toY}`;
  };

  // Calculate arrowhead position
  const getArrowheadPosition = (fromX, fromY, toX, toY) => {
    const dx = toX - fromX;
    const dy = toY - fromY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const ratio = 0.85; // Position arrowhead at 85% of the path
    return {
      x: fromX + dx * ratio,
      y: fromY + dy * ratio,
      angle: Math.atan2(dy, dx) * 180 / Math.PI
    };
  };

  return (
    <div className="traffic-flow-container">
      <div className="flow-header">
        <h2>User Traffic Flow</h2>
        <div className="flow-stats">
          <div className="stat-item">
            <span className="stat-dot high"></span>
            <span>High Traffic</span>
          </div>
          <div className="stat-item">
            <span className="stat-dot medium"></span>
            <span>Medium Traffic</span>
          </div>
          <div className="stat-item">
            <span className="stat-dot low"></span>
            <span>Low Traffic</span>
          </div>
        </div>
      </div>

      <svg className="flow-svg" viewBox="0 0 1000 400">
        {/* Draw edges */}
        {flowData.edges.map((edge, index) => {
          const fromNode = flowData.nodes.find(n => n.id === edge.from);
          const toNode = flowData.nodes.find(n => n.id === edge.to);
          if (!fromNode || !toNode) return null;

          const thickness = getArrowThickness(edge.count);
          const color = getArrowColor(edge.count);
          const path = getArrowPath(fromNode.x, fromNode.y, toNode.x, toNode.y);
          
          // Get arrowhead position (at the end of the curve)
          const endPos = getArrowheadPosition(fromNode.x, fromNode.y, toNode.x, toNode.y);

          return (
            <g key={index}>
              {/* Path line */}
              <path
                d={path}
                fill="none"
                stroke={color}
                strokeWidth={thickness}
                strokeLinecap="round"
                strokeDasharray={edge.count > maxCount * 0.6 ? 'none' : '5,5'}
                opacity={0.7 + (edge.count / maxCount) * 0.3}
                className="flow-path"
              >
                <animate
                  attributeName="stroke-dashoffset"
                  from="0"
                  to="20"
                  dur="2s"
                  repeatCount="indefinite"
                />
              </path>

              {/* Arrowhead */}
              <polygon
                points={`0,0 -8,-6 -8,6`}
                fill={color}
                transform={`translate(${endPos.x}, ${endPos.y}) rotate(${endPos.angle + 90})`}
              />

              {/* Count label */}
              <rect
                x={fromNode.x + (toNode.x - fromNode.x) / 2 - 25}
                y={fromNode.y + (toNode.y - fromNode.y) / 2 - 15}
                width="50"
                height="20"
                rx="10"
                fill="white"
                stroke={color}
                strokeWidth="1"
                opacity="0.9"
              />
              <text
                x={fromNode.x + (toNode.x - fromNode.x) / 2}
                y={fromNode.y + (toNode.y - fromNode.y) / 2 + 5}
                textAnchor="middle"
                fontSize="10"
                fill="#1e293b"
                fontWeight="bold"
              >
                {edge.count}
              </text>

              {/* Label */}
              <text
                x={fromNode.x + (toNode.x - fromNode.x) / 2}
                y={fromNode.y + (toNode.y - fromNode.y) / 2 + 35}
                textAnchor="middle"
                fontSize="10"
                fill="#64748b"
              >
                {edge.label}
              </text>
            </g>
          );
        })}

        {/* Draw nodes */}
        {flowData.nodes.map((node) => (
          <g key={node.id}>
            <circle
              cx={node.x}
              cy={node.y}
              r="40"
              fill="white"
              stroke="#2563eb"
              strokeWidth="3"
              filter="url(#shadow)"
            >
              <animate
                attributeName="r"
                values="38;42;38"
                dur="3s"
                repeatCount="indefinite"
              />
            </circle>
            <text
              x={node.x}
              y={node.y - 10}
              textAnchor="middle"
              fontSize="24"
            >
              {node.icon}
            </text>
            <text
              x={node.x}
              y={node.y + 25}
              textAnchor="middle"
              fontSize="10"
              fill="#1e293b"
              fontWeight="600"
            >
              {node.label}
            </text>
          </g>
        ))}

        {/* Shadow filter */}
        <defs>
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="4" floodOpacity="0.15" />
          </filter>
        </defs>
      </svg>

      <div className="flow-footer">
        <div className="conversion-metrics">
          <div className="metric">
            <span className="metric-label">Total Visitors</span>
            <span className="metric-value">
              {flowData.edges.find(e => e.from === 'home' && e.to === 'products')?.count || 0}
            </span>
          </div>
          <div className="metric">
            <span className="metric-label">Add to Cart Rate</span>
            <span className="metric-value">
              {Math.round(
                (flowData.edges.find(e => e.from === 'productDetail' && e.to === 'cart')?.count || 0) /
                (flowData.edges.find(e => e.from === 'products' && e.to === 'productDetail')?.count || 1) * 100
              )}%
            </span>
          </div>
          <div className="metric">
            <span className="metric-label">Checkout Rate</span>
            <span className="metric-value">
              {Math.round(
                (flowData.edges.find(e => e.from === 'cart' && e.to === 'checkout')?.count || 0) /
                (flowData.edges.find(e => e.from === 'productDetail' && e.to === 'cart')?.count || 1) * 100
              )}%
            </span>
          </div>
          <div className="metric">
            <span className="metric-label">Conversion Rate</span>
            <span className="metric-value">
              {Math.round(
                (flowData.edges.find(e => e.from === 'cart' && e.to === 'checkout')?.count || 0) /
                (flowData.edges.find(e => e.from === 'home' && e.to === 'products')?.count || 1) * 100
              )}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrafficFlow;