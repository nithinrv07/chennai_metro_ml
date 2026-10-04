"""Canonical station resolution and first-leg service selection (no ML dependencies)."""
import json
import re
from pathlib import Path

NETWORK = json.loads((Path(__file__).parent / 'data/processed/metro_network.json').read_text())
STATIONS = {s['id']: s for s in NETWORK['stations']}
LINES = NETWORK['lines']


def normalize_station(value):
    return re.sub(r'\s+', ' ', str(value or '').lower().replace(' metro station', '').replace(' station', '').replace(' interchange', '')).strip()


def resolve_station_id(query):
    if query in STATIONS:
        return query
    q = normalize_station(query)
    if not q:
        return None
    return next((s['id'] for s in STATIONS.values()
                 if q in [normalize_station(s['name']), *map(normalize_station, s['aliases'])]), None)


def resolve_station(query):
    sid = resolve_station_id(query)
    return STATIONS[sid]['name'] if sid else None


def plan_route(origin, destination):
    o, d = resolve_station_id(origin), resolve_station_id(destination)
    if not o or not d:
        raise ValueError('Origin and destination must be valid Chennai Metro stations.')
    if o == d:
        return None
    choices = []
    for line, ids in LINES.items():
        if o not in ids:
            continue
        oi = ids.index(o)
        if d in ids:
            choices.append((abs(oi - ids.index(d)), line, d, None))
        for other, other_ids in LINES.items():
            if other == line or d not in other_ids:
                continue
            for hub in ('stop-central', 'stop-alandur'):
                if hub == o or hub == d:
                    continue
                count = abs(oi - ids.index(hub)) + abs(other_ids.index(hub) - other_ids.index(d))
                choices.append((count, line, hub, hub))
    _, line, target, transfer = min(choices, key=lambda c: (c[0], c[3] is not None))
    ids = LINES[line]
    step = 1 if ids.index(target) > ids.index(o) else -1
    served = ids[ids.index(o):] if step == 1 else list(reversed(ids[:ids.index(o) + 1]))
    return {'line': line, 'direction': 'Southbound' if step == 1 else 'Northbound',
            'originId': o, 'destinationId': d, 'targetId': target,
            'transferId': transfer, 'terminusId': served[-1], 'servedStationIds': served}


def get_candidate_trains(origin, destination, is_peak_hour):
    route = plan_route(origin, destination)
    if not route:
        return []
    line, direction = route['line'], route['direction']
    terminus = STATIONS[route['terminusId']]['name']
    target = STATIONS[route['targetId']]['name']
    dest = STATIONS[route['destinationId']]['name']
    routes = {('blue', 'Southbound'): ['BL-101', 'BL-103'], ('blue', 'Northbound'): ['BL-104', 'BL-112'],
              ('green', 'Southbound'): ['GL-214', 'GL-216'], ('green', 'Northbound'): ['GL-201', 'GL-202']}
    return [{
        'id': 'train-' + number.lower(), 'routeNumber': number,
        'name': f'{line.title()} Line • {terminus} ({direction})',
        'lineType': f'{line.title()} Line', 'lineColor': line, 'destination': terminus,
        'currentLocation': f'Estimated approach to {STATIONS[route["originId"]]["name"]}',
        'nextStop': STATIONS[route['originId']]['name'],
        'arrivalMinutes': (2 if is_peak_hour else 4) + i * (6 if is_peak_hour else 7),
        'historicalSuccessRate': 93, 'fare': '₹40', 'acStatus': 'Full AC', 'doorsCount': 4,
        'platformNumber': f'Platform {1 if direction == "Southbound" else 2} ({direction} towards {terminus})',
        'wheelchairAccessible': True, 'coachCoachType': 'electric_rapid',
        'base_modifier': 1.0 if i == 0 else 0.8,
        'coachReason': f'Board {direction} towards {target}.' + (f' Transfer at {target} for {dest}.' if route['transferId'] else ''),
        'serviceDirection': direction, 'servedStationIds': route['servedStationIds'],
        'firstLegTargetId': route['targetId'], 'terminusId': route['terminusId']
    } for i, number in enumerate(routes[(line, direction)])]
