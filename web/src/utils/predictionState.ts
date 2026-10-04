import type { BusTransit } from '../types';

export class LatestRequest {
  private sequence = 0;
  private controller?: AbortController;
  begin() {
    this.cancel();
    this.controller = new AbortController();
    return { id: this.sequence, signal: this.controller.signal };
  }
  cancel() { this.controller?.abort(); this.sequence++; }
  isCurrent(request: { id: number; signal: AbortSignal }) {
    return request.id === this.sequence && !request.signal.aborted;
  }
}

export function normalizeTrain(train: BusTransit, source: 'ml' | 'gateway_fallback'): BusTransit {
  const percent = (value: unknown, fallback: number) => typeof value === 'number' && Number.isFinite(value)
    ? Math.min(100, Math.max(0, value)) : fallback;
  if (!train || typeof train.id !== 'string' || typeof train.boardingProbability !== 'number' ||
      !Number.isFinite(train.boardingProbability) || typeof train.arrivalMinutes !== 'number' ||
      !Number.isFinite(train.arrivalMinutes) || train.arrivalMinutes < 0) throw new Error('Malformed train data');
  const density = percent(train.capacityPercentage, 50);
  const old = train.crowdBreakdown || train.coachBreakdown;
  const breakdown = { front: percent(old?.front, density * 0.85),
    middle: percent(old?.middle, Math.min(99, density * 1.12)), rear: percent(old?.rear, density * 0.68) };
  return { ...train, source, boardingProbability: percent(train.boardingProbability, 0),
    confidenceScore: source === 'ml' && typeof train.confidenceScore === 'number' && Number.isFinite(train.confidenceScore)
      ? percent(train.confidenceScore, 0) : null,
    crowdBreakdown: breakdown, coachBreakdown: breakdown, factors: Array.isArray(train.factors) ? train.factors : [] };
}
