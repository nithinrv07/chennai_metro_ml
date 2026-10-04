# Prediction regression checks

Run with Node 20+ and Python 3.10+. Install the app dependencies in `web` (`npm ci`), and install the Python test dependencies in a virtual environment:

```sh
python -m pip install fastapi pandas numpy scikit-learn joblib httpx
python -m unittest discover -s tests -v
cd web
npm test
npm run lint
npm run build
```

The TypeScript suite uses `python3` for the cross-language route comparison. Set `METRO_TEST_PYTHON` to your Python executable if it has another name or location (for example, `python` on Windows).

The tests cover all 1,600 origin/destination pairs in the existing 40-station catalog, validation errors versus closure, model-unloaded behavior, gateway fallback provenance, coach payload aliases, partial payload normalization, bounded requests, stale-response exclusion, and frontend closed-state rendering.

Python endpoint tests use a deterministic fake estimator and explicitly prevent model loading/training. Gateway tests call the actual Express handlers with mocked upstream responses. These checks do not validate the serialized estimator's accuracy, live train availability, station platform assignments, or real-time sensors.

The shared station catalog preserves the project's existing modeled network and landmark mappings. Generated services, arrival times, fares, and platform assignments remain estimates; they are not an official CMRL timetable.
