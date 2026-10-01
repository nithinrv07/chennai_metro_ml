import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Activity, Layers, MapPin, Users, CheckCircle2, 
  AlertTriangle, TrendingUp, Info, Sparkles, Filter,
  TrainFront, Eye
} from 'lucide-react';
import { RouteStop } from '../types';
import { ALL_METRO_STATIONS } from '../data/transitData';

interface StationPoint {
  id: string;
  name: string;
  shortName: string;
  tamilName?: string;
  line: 'blue' | 'green';
  lineLabel: string;
  index: number;
  crowdPercent: number;
  crowdLevel: 'Low' | 'Moderate' | 'High' | 'Peak';
  queueLength: number;
  boardingClearance: number;
  isInterchange: boolean;
  isCurrentStop: boolean;
  originalStop?: RouteStop;
}

interface LineStatusChartProps {
  currentStop: RouteStop;
  isPeak?: boolean;
  onSelectStation?: (station: RouteStop) => void;
}

export const LineStatusChart: React.FC<LineStatusChartProps> = ({
  currentStop,
  isPeak = true,
  onSelectStation,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [activeFilter, setActiveFilter] = useState<'both' | 'blue' | 'green'>('both');
  const [hoveredStation, setHoveredStation] = useState<StationPoint | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);

  // Separate and prepare data for Blue Line and Green Line stations
  const { blueLineStations, greenLineStations, avgBlueCrowd, avgGreenCrowd } = useMemo(() => {
    // Helper to calculate realistic crowd percentage based on base station data & peak multiplier
    const getCrowdValue = (st: RouteStop, isGreen: boolean) => {
      let base = 40;
      if (st.stationCrowd === 'High') base = 82;
      else if (st.stationCrowd === 'Moderate') base = 58;
      else base = 28;

      // Add station specific characteristics
      if (st.interchange) base += 8;
      if (st.name.includes('Guindy') || st.name.includes('Central') || st.name.includes('Ekkattuthangal') || st.name.includes('Koyambedu')) {
        base += isPeak ? 10 : -5;
      }
      if (st.name.includes('Airport')) {
        base += 5;
      }
      if (st.name.includes('Wimco') || st.name.includes('Nehru Park')) {
        base -= 10;
      }
      
      const val = Math.min(96, Math.max(18, base));
      let level: 'Low' | 'Moderate' | 'High' | 'Peak' = 'Low';
      if (val >= 80) level = 'Peak';
      else if (val >= 65) level = 'High';
      else if (val >= 40) level = 'Moderate';
      else level = 'Low';

      return { val, level };
    };

    // Filter Blue Line (Corridor 1)
    const blueRaw = ALL_METRO_STATIONS.filter(s => 
      s.linesServing.some(l => l.includes('Blue') || l.includes('Grand'))
    );
    
    // Filter Green Line (Corridor 2)
    const greenRaw = ALL_METRO_STATIONS.filter(s => 
      s.linesServing.some(l => l.includes('Green') || l.includes('Grand'))
    );

    const blue: StationPoint[] = blueRaw.map((st, idx) => {
      const { val, level } = getCrowdValue(st, false);
      return {
        id: `blue-${st.id}`,
        name: st.name,
        shortName: st.name.replace(' Metro Station', '').replace(' Station', '').replace('Puratchi Thalaivar Dr. M.G.R ', ''),
        tamilName: st.tamilName,
        line: 'blue',
        lineLabel: 'Blue Line (Corridor 1)',
        index: idx,
        crowdPercent: val,
        crowdLevel: level,
        queueLength: st.queueLength,
        boardingClearance: st.boardingRateHistorical,
        isInterchange: !!st.interchange,
        isCurrentStop: currentStop.id === st.id,
        originalStop: st,
      };
    });

    const green: StationPoint[] = greenRaw.map((st, idx) => {
      const { val, level } = getCrowdValue(st, true);
      return {
        id: `green-${st.id}`,
        name: st.name,
        shortName: st.name.replace(' Metro Station', '').replace(' Station', '').replace('Puratchi Thalaivar Dr. M.G.R ', ''),
        tamilName: st.tamilName,
        line: 'green',
        lineLabel: 'Green Line (Corridor 2)',
        index: idx,
        crowdPercent: val,
        crowdLevel: level,
        queueLength: st.queueLength,
        boardingClearance: st.boardingRateHistorical,
        isInterchange: !!st.interchange,
        isCurrentStop: currentStop.id === st.id,
        originalStop: st,
      };
    });

    const avgB = Math.round(blue.reduce((acc, s) => acc + s.crowdPercent, 0) / (blue.length || 1));
    const avgG = Math.round(green.reduce((acc, s) => acc + s.crowdPercent, 0) / (green.length || 1));

    return {
      blueLineStations: blue,
      greenLineStations: green,
      avgBlueCrowd: avgB,
      avgGreenCrowd: avgG,
    };
  }, [currentStop.id, isPeak]);

  // Render D3 Color-Coded Line Chart
  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // Clear previous render

    const containerWidth = containerRef.current.clientWidth || 700;
    const height = 240;
    const margin = { top: 28, right: 36, bottom: 44, left: 44 };
    const width = containerWidth - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    svg
      .attr('viewBox', `0 0 ${containerWidth} ${height}`)
      .attr('width', '100%')
      .attr('height', height);

    // Defs for gradients & filters
    const defs = svg.append('defs');

    // Blue Line Area Gradient
    const blueGradient = defs
      .append('linearGradient')
      .attr('id', 'blue-line-gradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');
    blueGradient.append('stop').attr('offset', '0%').attr('stop-color', '#0066B2').attr('stop-opacity', 0.28);
    blueGradient.append('stop').attr('offset', '100%').attr('stop-color', '#0066B2').attr('stop-opacity', 0.0);

    // Green Line Area Gradient
    const greenGradient = defs
      .append('linearGradient')
      .attr('id', 'green-line-gradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');
    greenGradient.append('stop').attr('offset', '0%').attr('stop-color', '#10B981').attr('stop-opacity', 0.28);
    greenGradient.append('stop').attr('offset', '100%').attr('stop-color', '#10B981').attr('stop-opacity', 0.0);

    // Drop shadow filter for dots
    const filter = defs.append('filter').attr('id', 'dot-shadow').attr('height', '150%');
    filter.append('feDropShadow').attr('dx', '0').attr('dy', '1.5').attr('stdDeviation', '2').attr('flood-opacity', '0.25');

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    // Y Scale: Crowding 0% to 100%
    const yScale = d3.scaleLinear().domain([0, 100]).range([chartHeight, 0]);

    // X Scale: Normalized 0 to 1 domain across stations count
    const maxBlueIdx = Math.max(1, blueLineStations.length - 1);
    const maxGreenIdx = Math.max(1, greenLineStations.length - 1);

    const xBlueScale = d3.scaleLinear().domain([0, maxBlueIdx]).range([0, width]);
    const xGreenScale = d3.scaleLinear().domain([0, maxGreenIdx]).range([0, width]);

    // Threshold zones (Color bands: Low <40%, Moderate 40-70%, High/Peak >70%)
    const thresholds = [
      { y1: 0, y2: 40, label: 'Low (<40%)', color: '#ecfdf5', line: '#10b981' },
      { y1: 40, y2: 70, label: 'Moderate (40-70%)', color: '#fffbeb', line: '#f59e0b' },
      { y1: 70, y2: 100, label: 'Peak Surge (>70%)', color: '#fef2f2', line: '#ef4444' },
    ];

    thresholds.forEach((th) => {
      g.append('rect')
        .attr('x', 0)
        .attr('y', yScale(th.y2))
        .attr('width', width)
        .attr('height', yScale(th.y1) - yScale(th.y2))
        .attr('fill', th.color)
        .attr('opacity', 0.55);
    });

    // Horizontal Grid Lines
    const yTicks = [25, 50, 75, 100];
    yTicks.forEach((tick) => {
      g.append('line')
        .attr('x1', 0)
        .attr('x2', width)
        .attr('y1', yScale(tick))
        .attr('y2', yScale(tick))
        .attr('stroke', '#e2e8f0')
        .attr('stroke-dasharray', '3,3')
        .attr('stroke-width', 1);

      // Y-axis label
      g.append('text')
        .attr('x', -8)
        .attr('y', yScale(tick) + 3)
        .attr('text-anchor', 'end')
        .attr('font-size', '9px')
        .attr('font-family', 'ui-monospace, monospace')
        .attr('font-weight', 'bold')
        .attr('fill', '#94a3b8')
        .text(`${tick}%`);
    });

    // D3 Line Generators with smooth Monotone Curves
    const blueLineGen = d3
      .line<StationPoint>()
      .x((d) => xBlueScale(d.index))
      .y((d) => yScale(d.crowdPercent))
      .curve(d3.curveMonotoneX);

    const greenLineGen = d3
      .line<StationPoint>()
      .x((d) => xGreenScale(d.index))
      .y((d) => yScale(d.crowdPercent))
      .curve(d3.curveMonotoneX);

    const blueAreaGen = d3
      .area<StationPoint>()
      .x((d) => xBlueScale(d.index))
      .y0(chartHeight)
      .y1((d) => yScale(d.crowdPercent))
      .curve(d3.curveMonotoneX);

    const greenAreaGen = d3
      .area<StationPoint>()
      .x((d) => xGreenScale(d.index))
      .y0(chartHeight)
      .y1((d) => yScale(d.crowdPercent))
      .curve(d3.curveMonotoneX);

    // Render Blue Line if active
    if (activeFilter === 'both' || activeFilter === 'blue') {
      // Area Fill
      g.append('path')
        .datum(blueLineStations)
        .attr('fill', 'url(#blue-line-gradient)')
        .attr('d', blueAreaGen);

      // Main Stroke Line
      const bluePath = g
        .append('path')
        .datum(blueLineStations)
        .attr('fill', 'none')
        .attr('stroke', '#0066B2')
        .attr('stroke-width', 3)
        .attr('stroke-linecap', 'round')
        .attr('stroke-linejoin', 'round')
        .attr('d', blueLineGen);

      // Smooth entrance transition
      const totalLength = bluePath.node()?.getTotalLength() || 0;
      bluePath
        .attr('stroke-dasharray', `${totalLength} ${totalLength}`)
        .attr('stroke-dashoffset', totalLength)
        .transition()
        .duration(750)
        .ease(d3.easeCubicOut)
        .attr('stroke-dashoffset', 0);
    }

    // Render Green Line if active
    if (activeFilter === 'both' || activeFilter === 'green') {
      // Area Fill
      g.append('path')
        .datum(greenLineStations)
        .attr('fill', 'url(#green-line-gradient)')
        .attr('d', greenAreaGen);

      // Main Stroke Line
      const greenPath = g
        .append('path')
        .datum(greenLineStations)
        .attr('fill', 'none')
        .attr('stroke', '#10B981')
        .attr('stroke-width', 3)
        .attr('stroke-linecap', 'round')
        .attr('stroke-linejoin', 'round')
        .attr('d', greenLineGen);

      const totalLength = greenPath.node()?.getTotalLength() || 0;
      greenPath
        .attr('stroke-dasharray', `${totalLength} ${totalLength}`)
        .attr('stroke-dashoffset', totalLength)
        .transition()
        .duration(750)
        .ease(d3.easeCubicOut)
        .attr('stroke-dashoffset', 0);
    }

    // Station Nodes & Interactive Target Rings
    const renderDots = (stations: StationPoint[], xScale: d3.ScaleLinear<number, number>, lineType: 'blue' | 'green') => {
      stations.forEach((st) => {
        const cx = xScale(st.index);
        const cy = yScale(st.crowdPercent);
        const dotColor = st.crowdPercent >= 80 ? '#ef4444' : st.crowdPercent >= 65 ? '#f59e0b' : '#10b981';
        const strokeColor = lineType === 'blue' ? '#0066B2' : '#10B981';

        // Outer glow/ring if current user station
        if (st.isCurrentStop) {
          g.append('circle')
            .attr('cx', cx)
            .attr('cy', cy)
            .attr('r', 10)
            .attr('fill', strokeColor)
            .attr('fill-opacity', 0.25)
            .attr('stroke', strokeColor)
            .attr('stroke-width', 1.5)
            .attr('stroke-dasharray', '2,2');

          // Pulse dot
          g.append('circle')
            .attr('cx', cx)
            .attr('cy', cy)
            .attr('r', 6)
            .attr('fill', '#ffffff')
            .attr('stroke', strokeColor)
            .attr('stroke-width', 2.5);
        } else {
          // Standard station point
          g.append('circle')
            .attr('cx', cx)
            .attr('cy', cy)
            .attr('r', st.isInterchange ? 4.5 : 3.5)
            .attr('fill', dotColor)
            .attr('stroke', '#ffffff')
            .attr('stroke-width', 1.5)
            .attr('filter', 'url(#dot-shadow)')
            .attr('cursor', 'pointer');
        }

        // Invisible large hit-box for smooth hovering
        g.append('circle')
          .attr('cx', cx)
          .attr('cy', cy)
          .attr('r', 14)
          .attr('fill', 'transparent')
          .attr('cursor', 'pointer')
          .on('mouseenter', (event) => {
            const rect = containerRef.current?.getBoundingClientRect();
            if (rect) {
              setHoverPos({
                x: event.clientX - rect.left,
                y: event.clientY - rect.top,
              });
            }
            setHoveredStation(st);
          })
          .on('mouseleave', () => {
            setHoveredStation(null);
          })
          .on('click', () => {
            if (st.originalStop && onSelectStation) {
              onSelectStation(st.originalStop);
            }
          });
      });
    };

    if (activeFilter === 'both' || activeFilter === 'blue') {
      renderDots(blueLineStations, xBlueScale, 'blue');
    }
    if (activeFilter === 'both' || activeFilter === 'green') {
      renderDots(greenLineStations, xGreenScale, 'green');
    }

    // X Axis Track Indicators (Bottom Station Terminals)
    const bottomY = chartHeight + 20;

    // Start / End Labels for Blue Line
    if (activeFilter === 'both' || activeFilter === 'blue') {
      g.append('text')
        .attr('x', 0)
        .attr('y', bottomY)
        .attr('text-anchor', 'start')
        .attr('font-size', '10px')
        .attr('font-weight', 'bold')
        .attr('fill', '#0066B2')
        .text('Airport (MAA)');

      g.append('text')
        .attr('x', width)
        .attr('y', bottomY)
        .attr('text-anchor', 'end')
        .attr('font-size', '10px')
        .attr('font-weight', 'bold')
        .attr('fill', '#0066B2')
        .text('Wimco Nagar');
    }

    // Green Line Terminal Labels
    if (activeFilter === 'green') {
      g.append('text')
        .attr('x', 0)
        .attr('y', bottomY)
        .attr('text-anchor', 'start')
        .attr('font-size', '10px')
        .attr('font-weight', 'bold')
        .attr('fill', '#059669')
        .text('Central (MGR)');

      g.append('text')
        .attr('x', width)
        .attr('y', bottomY)
        .attr('text-anchor', 'end')
        .attr('font-size', '10px')
        .attr('font-weight', 'bold')
        .attr('fill', '#059669')
        .text('St. Thomas Mount');
    }

    // Center interchange marker on axis
    if (activeFilter === 'both') {
      g.append('text')
        .attr('x', width / 2)
        .attr('y', bottomY)
        .attr('text-anchor', 'middle')
        .attr('font-size', '9px')
        .attr('font-weight', '600')
        .attr('fill', '#64748b')
        .text('Alandur & Central Interchanges');
    }
  }, [blueLineStations, greenLineStations, activeFilter, currentStop.id]);

  return (
    <div id="line-status-visual-component" className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-7 shadow-xs relative">
      {/* Header with Title and Toggle Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-blue-50 text-[#0066B2] shadow-xs">
              <TrendingUp className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight font-heading">
                Chennai Metro Network Crowding Level
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Simultaneous real-time station congestion tracking via D3 platform sensors
              </p>
            </div>
          </div>
        </div>

        {/* Line Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-2xl border border-slate-200/80 shrink-0 self-start sm:self-auto">
          <button
            type="button"
            id="filter-both-lines"
            onClick={() => setActiveFilter('both')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeFilter === 'both'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Both Lines ({blueLineStations.length + greenLineStations.length})
          </button>
          <button
            type="button"
            id="filter-blue-line"
            onClick={() => setActiveFilter('blue')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeFilter === 'blue'
                ? 'bg-[#0066B2] text-white shadow-xs'
                : 'text-slate-600 hover:text-[#0066B2]'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-blue-400" />
            Blue Line ({blueLineStations.length})
          </button>
          <button
            type="button"
            id="filter-green-line"
            onClick={() => setActiveFilter('green')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeFilter === 'green'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-emerald-700'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-300" />
            Green Line ({greenLineStations.length})
          </button>
        </div>
      </div>

      {/* Corridor Summary Pill Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        <div className="p-3 rounded-2xl bg-blue-50/60 border border-blue-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-3 h-3 rounded-full bg-[#0066B2] ring-4 ring-blue-200" />
            <div>
              <div className="text-[11px] font-bold text-[#0066B2]">Blue Line Fleet Average</div>
              <div className="text-[10px] text-slate-500 font-medium">Airport ↔ Wimco Nagar (26 Stn)</div>
            </div>
          </div>
          <span className="text-sm font-black font-mono text-[#0066B2]">{avgBlueCrowd}% Load</span>
        </div>

        <div className="p-3 rounded-2xl bg-emerald-50/60 border border-emerald-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-3 h-3 rounded-full bg-emerald-500 ring-4 ring-emerald-200" />
            <div>
              <div className="text-[11px] font-bold text-emerald-700">Green Line Fleet Average</div>
              <div className="text-[10px] text-slate-500 font-medium">Central ↔ St. Thomas Mount (16 Stn)</div>
            </div>
          </div>
          <span className="text-sm font-black font-mono text-emerald-700">{avgGreenCrowd}% Load</span>
        </div>

        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#0066B2]" />
            <div>
              <div className="text-[11px] font-bold text-slate-900 truncate max-w-[140px]">
                {currentStop.name.split(' ')[0]}
              </div>
              <div className="text-[10px] text-slate-500">Your Current Station</div>
            </div>
          </div>
          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
            Active Pin
          </span>
        </div>
      </div>

      {/* D3 Chart Canvas Container */}
      <div 
        ref={containerRef} 
        className="w-full relative overflow-hidden bg-slate-50/50 rounded-2xl p-2 border border-slate-100"
      >
        <svg ref={svgRef} className="w-full overflow-visible" />

        {/* Hover Tooltip Popup */}
        <AnimatePresence>
          {hoveredStation && hoverPos && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 5 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              style={{
                left: Math.min(hoverPos.x + 10, (containerRef.current?.clientWidth || 300) - 180),
                top: Math.max(10, hoverPos.y - 85),
              }}
              className="absolute z-30 pointer-events-none bg-slate-900 text-white rounded-2xl p-3 shadow-xl border border-slate-700 min-w-[170px]"
            >
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className="text-xs font-black truncate">{hoveredStation.shortName}</span>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                  hoveredStation.line === 'blue' ? 'bg-[#0066B2] text-white' : 'bg-emerald-600 text-white'
                }`}>
                  {hoveredStation.line === 'blue' ? 'Blue' : 'Green'}
                </span>
              </div>
              <div className="text-[10px] text-slate-300 font-mono flex items-center justify-between">
                <span>Congestion:</span>
                <strong className={
                  hoveredStation.crowdPercent >= 80 ? 'text-rose-400 font-black' :
                  hoveredStation.crowdPercent >= 65 ? 'text-amber-300 font-black' : 'text-emerald-400 font-black'
                }>
                  {hoveredStation.crowdPercent}% ({hoveredStation.crowdLevel})
                </strong>
              </div>
              <div className="text-[10px] text-slate-400 font-mono flex items-center justify-between mt-0.5">
                <span>Historical Clearance:</span>
                <strong className="text-white font-bold">{hoveredStation.boardingClearance}%</strong>
              </div>
              <div className="text-[9px] text-blue-200 mt-1.5 pt-1.5 border-t border-slate-800 text-center font-bold">
                Click to Switch Departure Station ➔
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Color Code Legend */}
      <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="text-[10px] uppercase font-bold text-slate-400 font-mono">Zones:</span>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-[11px] font-medium text-slate-700">Low Crowding (&lt;40%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span className="text-[11px] font-medium text-slate-700">Moderate Surge (40–70%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span className="text-[11px] font-medium text-slate-700">Peak Rush (&gt;70%)</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
          <span className="inline-block w-2 h-2 rounded-full bg-[#0066B2]" /> Blue Line
          <span className="inline-block w-2 h-2 rounded-full bg-[#10B981] ml-2" /> Green Line
        </div>
      </div>
    </div>
  );
};
