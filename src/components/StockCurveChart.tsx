import React, { useState } from "react";
import { extent, max, min } from "@visx/vendor/d3-array";
import * as allCurves from "@visx/curve";
import { Group } from "@visx/group";
import { LinePath } from "@visx/shape";
import { scaleTime, scaleLinear } from "@visx/scale";
import { StockDataPoint } from "../types/stock";
import { useFinnhubStock } from "../hooks/useFinnhubStock";

type CurveType = keyof typeof allCurves;

export interface StockCurveChartProps {
  width: number;
  height: number;
  showControls?: boolean;
}


// Data accessors for stock data points
const getX = (d: StockDataPoint) => new Date(d.timestamp);
const getY = (d: StockDataPoint) => d.price;

export const StockCurveChart: React.FC<StockCurveChartProps> = ({
  width,
  height,
  showControls = false,
}) => {
  const [curveType, setCurveType] = useState<CurveType>("curveLinear");
  const [showPoints, setShowPoints] = useState<boolean>(true);

  const { stockData, isLoading, error } = useFinnhubStock();


  const stockIsUp = () => {
    return stockData?.previousClose &&
      stockData?.current &&
      stockData?.previousClose < stockData?.current
  }

  const stockColor = () => {
    return stockIsUp() ? "#00E676" : "#FF5252";
  }

  

  const svgHeight = showControls ? height - 40 : height;
  const MARGIN = 40;
  const graphWidth = width - MARGIN * 2;
  const graphHeight = svgHeight - MARGIN * 2;

  // Get the minute data from stock data
  const minuteData = stockData?.minuteData || [];

  // Use all available data (no animation)
  const visibleData = minuteData;

  // Set up scales with proper domain handling
  const xScale = scaleTime<number>({
    domain:
      minuteData.length > 0
        ? (extent(minuteData, getX) as [Date, Date])
        : [new Date(Date.now() - 60000), new Date()],
    range: [0, graphWidth],
  });

  const yScale = scaleLinear<number>({
    domain:
      minuteData.length > 0
        ? [
            (min(minuteData, getY) as number) * 0.995, // Add small padding
            (max(minuteData, getY) as number) * 1.005,
          ]
        : [0, 100],
    range: [graphHeight, 0], // This is correct: higher values should be at the top
  });

  // No animation - points appear as data arrives

  if (isLoading) {
    return (
      <div
        style={{
          width,
          height,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div>Loading stock data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          width,
          height,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ color: "red" }}>Error: {error}</div>
      </div>
    );
  }

  if (!minuteData.length) {
    return (
      <div
        style={{
          width,
          height,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div>No data available</div>
      </div>
    );
  }

  return (
    <div className="stock-curve-chart">
      <svg
        width={width}
        height={svgHeight}
        style={{ border: "5px solid #ccc" }}
      >
        {/* Background */}
        <rect width={width} height={svgHeight} fill="#1B1F3B" />

        {/* Chart area background */}
        <rect
          x={MARGIN}
          y={MARGIN}
          width={graphWidth}
          height={graphHeight}
          fill="#1B1F3B"
          stroke="none"
        />

        {/* <Group>
          <text
            x={width / 2}
            y={MARGIN}
            textAnchor="middle"
            fontSize={20}
            fill="#EDEDED"
          >
            All-In-Dex
          </text>
        </Group> */}

        <Group>
          <text
            x={MARGIN + 50}
            y={MARGIN - 10}
            textAnchor="middle"
            fontSize={20}
            fill={stockColor()}
          >
            {stockData?.symbol} ({stockIsUp() ? "+" : ""}{stockData?.changeOverDayPercent.toFixed(2)}%)
          </text>

        </Group>

        {/* Grid lines */}
        <Group left={MARGIN} top={MARGIN}>
          {/* Horizontal grid lines */}
          {yScale.ticks(5).map((tick, i) => (
            <line
              key={`h-grid-${i}`}
              x1={0}
              x2={graphWidth}
              y1={yScale(tick)}
              y2={yScale(tick)}
              stroke="#3C3F51"
              strokeWidth={1}
            />
          ))}

          {/* Vertical grid lines */}
          {xScale.ticks(6).map((tick, i) => (
            <line
              key={`v-grid-${i}`}
              x1={xScale(tick)}
              x2={xScale(tick)}
              y1={0}
              y2={graphHeight}
              stroke="#3C3F51"
              strokeWidth={1}
            />
          ))}
        </Group>

        {/* Main chart group */}
        <Group left={MARGIN + 10} top={MARGIN}>
          {/* Draw the curve line */}
          {visibleData.length > 1 && (
            <LinePath<StockDataPoint>
              curve={allCurves[curveType]}
              data={visibleData}
              x={(d) => xScale(getX(d)) ?? 0}
              y={(d) => yScale(getY(d)) ?? 0}
              stroke={stockColor()}
              strokeWidth={2}
              fill="none"
              shapeRendering="geometricPrecision"
            />
          )}

          {/* Draw individual points */}
          {showPoints &&
            visibleData.map((d, i) => (
              <circle
                key={i}
                cx={xScale(getX(d))}
                cy={yScale(getY(d))}
                r={2}
                fill={stockColor()}
                stroke="white"
                strokeWidth={1}
              />
            ))}

          {/* Highlight the most recent point */}
          {visibleData.length > 0 && (
            <circle
              cx={xScale(getX(visibleData[visibleData.length - 1]))}
              cy={yScale(getY(visibleData[visibleData.length - 1]))}
              r={4}
              fill="#6e1bf2"
              stroke="white"
              strokeWidth={2}
            />
          )}
        </Group>

        {/* Y-axis labels */}
        <Group left={MARGIN} top={MARGIN}>
          {yScale.ticks(5).map((tick, i) => (
            <text
              key={`y-label-${i}`}
              x={0}
              y={yScale(tick)}
              textAnchor="end"
              fontSize={10}
              fill="#EDEDED"
            >
              ${tick.toFixed(2)}
            </text>
          ))}
        </Group>

        {/* X-axis labels */}
        <Group left={MARGIN} top={svgHeight - MARGIN + 15}>
          {xScale.ticks(6).map((tick, i) => (
            <text
              key={`x-label-${i}`}
              x={xScale(tick)}
              y={0}
              textAnchor="middle"
              fontSize={10}
              fill="#EDEDED"
            >
              {tick.toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              })}
            </text>
          ))}
        </Group>
      </svg>
    </div>
  );
};
