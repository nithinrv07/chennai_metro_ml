import json
import unittest
from unittest.mock import patch
import numpy as np
from fastapi.testclient import TestClient
from metro_network import STATIONS, LINES, resolve_station_id, plan_route, get_candidate_trains

# Never load the serialized estimator or trigger training in this regression suite.
with patch('joblib.load'), patch('os.path.exists', return_value=False):
    import ml_service as service


class FakeModel:
    classes_ = np.array(['Green', 'Yellow', 'Red'])
    def predict_proba(self, frame):
        return np.array([[0.05, 0.15, 0.8]])
    def predict(self, frame):
        return np.array(['Red'])


class PredictionRegressionTests(unittest.TestCase):
    def setUp(self):
        self.previous_model = service.ml_model
        service.ml_model = FakeModel()
        self.client = TestClient(service.app)
        self.request = dict(station_name='Guindy Metro Station', destination='Egmore',
                            hour=9, minute=0, day_of_week='Monday', is_weekend=0, is_peak_hour=1)

    def tearDown(self):
        service.ml_model = self.previous_model

    def test_station_identity_and_unknown_destination(self):
        self.assertEqual(resolve_station_id('New Washermanpet'), 'stop-new-washermanpet')
        self.assertEqual(resolve_station_id('Sir Theagaraya College Station'), 'stop-sir-theagaraya')
        self.assertIsNone(resolve_station_id('unknown destination'))
        for name in ['unknown destination', '', None]:
            response = self.client.post('/api/ml/predict-trains', json={**self.request, 'destination': name})
            self.assertEqual(response.status_code, 400)

    def test_candidate_reachability_for_every_station_pair(self):
        for origin in STATIONS:
            for destination in STATIONS:
                candidates = get_candidate_trains(origin, destination, True)
                if origin == destination:
                    self.assertEqual(candidates, [])
                    continue
                route = plan_route(origin, destination)
                for train in candidates:
                    self.assertIn(origin, train['servedStationIds'])
                    self.assertGreater(train['servedStationIds'].index(route['targetId']), train['servedStationIds'].index(origin))
                    self.assertEqual(train['destination'], STATIONS[train['terminusId']]['name'])
                    self.assertIn(train['serviceDirection'], train['platformNumber'])

    def test_vadapalani_to_mount_has_no_koyambedu_candidate(self):
        trains = get_candidate_trains('Vadapalani', 'St. Thomas Mount', True)
        self.assertTrue(all(t['serviceDirection'] == 'Southbound' for t in trains))
        self.assertTrue(all(t['terminusId'] == 'stop-st-thomas-mount' for t in trains))

    def test_destination_changes_first_leg_and_payload_aliases(self):
        north = self.client.post('/api/ml/predict-trains', json=self.request).json()
        south = self.client.post('/api/ml/predict-trains', json={**self.request, 'destination': 'Airport'}).json()
        self.assertEqual(north['trains'][0]['serviceDirection'], 'Northbound')
        self.assertEqual(south['trains'][0]['serviceDirection'], 'Southbound')
        for data in [north, south]:
            self.assertEqual(data['source'], 'ml')
            self.assertTrue(data['model_loaded'])
            for train in data['trains']:
                self.assertEqual(train['crowdBreakdown'], train['coachBreakdown'])
                self.assertEqual(train['source'], 'ml')
        self.assertEqual(sum(t['isRecommended'] for t in north['trains']), 1)

    def test_model_unloaded_and_closed_are_distinct(self):
        service.ml_model = None
        health = self.client.get('/api/ml/health').json()
        self.assertFalse(health['model_loaded'])
        self.assertEqual(health['status'], 'unavailable')
        self.assertIsNone(health['accuracy_score'])
        self.assertEqual(self.client.post('/api/ml/predict-trains', json=self.request).status_code, 503)
        for hour in [0, 4, 23]:
            data = self.client.post('/api/ml/predict-trains', json={**self.request, 'hour': hour}).json()
            self.assertEqual(data['service_status'], 'Closed')
            self.assertEqual(data['trains'], [])
            self.assertFalse(data['model_loaded'])

    def test_invalid_flags_and_same_station(self):
        self.assertEqual(self.client.post('/api/ml/predict-trains', json={**self.request, 'is_peak_hour': 2}).status_code, 422)
        self.assertEqual(self.client.post('/api/ml/predict-trains', json={**self.request, 'destination': 'Guindy'}).status_code, 400)


if __name__ == '__main__':
    unittest.main()
