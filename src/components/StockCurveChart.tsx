import React, { useState, useEffect } from "react";
import { extent, max, min } from "@visx/vendor/d3-array";
import * as allCurves from "@visx/curve";
import { Group } from "@visx/group";
import { LinePath } from "@visx/shape";
import { scaleTime, scaleLinear } from "@visx/scale";
import { StockDataPoint } from "../types/stock";
import { useFinnhubStock } from "../hooks/useFinnhubStock";
import { Workman } from "./Workman";
import { currentCharacterStockData } from "../utils/CharacterStockData";

type CurveType = keyof typeof allCurves;

// Poker chip colors
const CHIP_COLORS = ["Blue", "Burgundy", "Pink", "Purple", "Red"] as const;
type ChipColor = (typeof CHIP_COLORS)[number];

export interface StockCurveChartProps {
  width?: number;
  height?: number;
  showControls?: boolean;
}

// Data accessors for stock data points
const getX = (d: StockDataPoint) => new Date(d.timestamp);
const getY = (d: StockDataPoint) => d.price;

// Function to get a consistent chip color for a data point
const getChipColor = (dataPoint: StockDataPoint, index: number): ChipColor => {
  // Use a combination of timestamp and index to create consistent but varied colors
  const seed = dataPoint.timestamp + index;
  return CHIP_COLORS[seed % CHIP_COLORS.length];
};

// Poker Chip SVG Component
interface PokerChipProps {
  color: ChipColor;
  x: number;
  y: number;
  size?: number;
}

const PokerChip: React.FC<PokerChipProps> = ({ color, x, y, size = 16 }) => {
  const chipPath = `/images/chips/${color}.svg`;

  return (
    <image
      href={chipPath}
      x={x - size / 2}
      y={y - size / 2}
      width={size}
      height={size}
    />
  );
};

export const StockCurveChart: React.FC<StockCurveChartProps> = ({
  width: propWidth,
  height: propHeight,
  showControls = false,
}) => {
  const [curveType, setCurveType] = useState<CurveType>("curveLinear");
  const [showPoints, setShowPoints] = useState<boolean>(true);
  const [lastSegmentTime, setLastSegmentTime] = useState<number | null>(null);
  const [newDataPoint, setNewDataPoint] = useState<StockDataPoint | null>(null);
  const [isBuilding, setIsBuilding] = useState<boolean>(false);
  const [currentChipColor, setCurrentChipColor] = useState<string | null>(null);
  const [currentChipIndex, setCurrentChipIndex] = useState<number | null>(null);
  const [dimensions, setDimensions] = useState({
    width: propWidth || window.innerWidth,
    height: propHeight || window.innerHeight,
  });

  const [currentStock, setCurrentStock] = useState<string | undefined>(
    currentCharacterStockData()?.stock
  );
  
  // Add this effect to update the stock periodically:
  useEffect(() => {
    const updateStock = () => {
      const newStock = currentCharacterStockData()?.stock;
      if (newStock !== currentStock) {
        setCurrentStock(newStock);
      }
    };
  
    // Check every second if we should switch stocks
    const interval = setInterval(updateStock, 1000);
    return () => clearInterval(interval);
  }, [currentStock]);
  
  // Then update the hook call to use the state:
  const { stockData, isLoading, error } = useFinnhubStock(currentStock);


  // Handle window resize
  useEffect(() => {
    if (propWidth && propHeight) return; // Don't resize if dimensions are provided

    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [propWidth, propHeight]);

  const width = propWidth || dimensions.width;
  const height = propHeight || dimensions.height;

  const stockIsUp = () => {
    return (
      stockData?.previousClose &&
      stockData?.current &&
      stockData?.previousClose < stockData?.current
    );
  };

  const handleBuildingComplete = () => {
    setNewDataPoint(null);
    setIsBuilding(false);
    setCurrentChipColor(null);
    setCurrentChipIndex(null);
  };

  const stockColor = () => {
    return stockIsUp() ? "#00E676" : "#FF5252";
  };

  const svgHeight = showControls ? height - 40 : height;
  const MARGIN = 40;
  const graphWidth = width - MARGIN * 2;
  const graphHeight = svgHeight - MARGIN * 2;

  // Get the minute data from stock data
  const minuteData = stockData?.minuteData || [];

  // Effect to track when new segments are added
  useEffect(() => {
    if (minuteData.length > 0) {
      const lastDataPoint = minuteData[minuteData.length - 1];
      const lastTimestamp = lastDataPoint?.timestamp;

      if (lastTimestamp && lastTimestamp !== lastSegmentTime) {
        setLastSegmentTime(lastTimestamp);
        setNewDataPoint(lastDataPoint); // Trigger Workman animation
        setIsBuilding(true);

        // Set the chip color and index for the workman to carry
        const chipIndex = minuteData.length - 1;
        const chipColor = getChipColor(lastDataPoint, chipIndex);
        setCurrentChipColor(chipColor);
        setCurrentChipIndex(chipIndex);
      }
    }
  }, [minuteData, lastSegmentTime]);

  // Helper function to check if a data point is old enough to be visible
  const isDataPointVisible = (timestamp: number) => {
    if (!lastSegmentTime) {
      return true;
    }

    const age = Date.now() - timestamp;
    const visible = age >= 5000;

    if (timestamp === lastSegmentTime) {
      if (isBuilding) {
        return false;
      }
      return true;
    }

    return visible;
  };

  // Get visible segments for rendering
  const getVisibleSegments = () => {
    if (minuteData.length <= 1) return [];

    const segments = [];
    for (let i = 1; i < minuteData.length; i++) {
      const prevPoint = minuteData[i - 1];
      const currentPoint = minuteData[i];

      const prevVisible = isDataPointVisible(prevPoint.timestamp);
      const currentVisible = isDataPointVisible(currentPoint.timestamp);

      if (prevVisible && currentVisible) {
        segments.push([prevPoint, currentPoint]);
      }
    }

    return segments;
  };


  // Use all available data (no animation)
  const visibleData = minuteData;

  // Set up scales with proper domain handling
  const xScale = scaleTime<number>({
    domain:
      minuteData.length > 0
        ? (() => {
            const [minDate, maxDate] = extent(minuteData, getX) as [Date, Date];
            const timeRange = maxDate.getTime() - minDate.getTime();
            const padding = timeRange * 0.1; // 10% padding
            const paddedMaxDate = new Date(maxDate.getTime() + padding);
            return [minDate, paddedMaxDate];
          })()
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
    <div
      className="stock-curve-chart"
      style={{ width: "100%", height: "100%" }}
    >
      <svg
        width={width}
        height={svgHeight}
        style={{ border: "none", display: "block" }}
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

        {/* Subtle "ALL-IN" watermark behind all content */}
        <text
          x={width / 2}
          y={svgHeight / 2}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={120}
          fontWeight="bold"
          fill="#ffffff"
          opacity={1}
          letterSpacing="0.1em"
        >
          ALL-IN
        </text>

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
            {stockData?.symbol} ({stockIsUp() ? "+" : ""}
            {stockData?.changeOverDayPercent.toFixed(2)}%)
          </text>

          <text
            x={MARGIN + graphWidth - 50}
            y={MARGIN - 10}
            textAnchor="middle"
            fontSize={20}
            fill="gray"
          >
            {new Intl.DateTimeFormat("en-US", {
              timeZone: "America/New_York",
              hour: "numeric",
              minute: "numeric",
              hour12: true,
            }).format(new Date())}
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
          {/* Draw visible curve segments */}
          {getVisibleSegments().map((segment, segmentIndex) => (
            <LinePath<StockDataPoint>
              key={`segment-${segmentIndex}`}
              curve={allCurves[curveType]}
              data={segment}
              x={(d) => xScale(getX(d)) ?? 0}
              y={(d) => yScale(getY(d)) ?? 0}
              stroke={stockColor()}
              strokeWidth={2}
              fill="none"
              shapeRendering="geometricPrecision"
            />
          ))}

          {/* Draw individual points as poker chips */}
          {showPoints &&
            visibleData
              .filter((d) => isDataPointVisible(d.timestamp))
              .map((d, i) => (
                <PokerChip
                  key={i}
                  color={getChipColor(d, i)}
                  x={xScale(getX(d))}
                  y={yScale(getY(d))}
                  size={16}
                />
              ))}

          {/* Highlight the most recent point with a larger poker chip */}
          {visibleData.length > 0 &&
            isDataPointVisible(
              visibleData[visibleData.length - 1].timestamp
            ) && (
              <>
                <PokerChip
                  color={getChipColor(
                    visibleData[visibleData.length - 1],
                    visibleData.length - 1
                  )}
                  x={xScale(getX(visibleData[visibleData.length - 1]))}
                  y={yScale(getY(visibleData[visibleData.length - 1]))}
                  size={24}
                />
                {/* Add a subtle glow effect around the most recent chip */}
                {/* <circle
                cx={xScale(getX(visibleData[visibleData.length - 1]))}
                cy={yScale(getY(visibleData[visibleData.length - 1]))}
                r={14}
                fill="none"
                stroke="#FFD524"
                strokeWidth={2}
                opacity={0.6}
              /> */}
              </>
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
              {new Intl.DateTimeFormat("en-US", {
                timeZone: "America/New_York",
                hour: "numeric",
                minute: "numeric",
                hour12: true,
              }).format(tick)}
            </text>
          ))}
        </Group>

        {/* Workman overlay */}
        <Workman
          width={width}
          height={svgHeight}
          margin={MARGIN}
          graphWidth={graphWidth}
          graphHeight={graphHeight}
          xScale={xScale}
          yScale={yScale}
          newDataPoint={newDataPoint}
          chipColor={currentChipColor ?? undefined}
          chipIndex={currentChipIndex ?? undefined}
          onBuildingComplete={handleBuildingComplete}
        />
      </svg>
    </div>
  );
};
