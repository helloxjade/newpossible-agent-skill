import json
import os
import time

import cudf
import numpy as np
import pandas as pd


ROWS = int(os.environ.get("BENCHMARK_ROWS", "5000000"))
ROUNDS = int(os.environ.get("BENCHMARK_ROUNDS", "3"))


def workload(frame):
    selected = frame[frame["amount"] > 0.35]
    return selected.groupby("segment").agg({"amount": "sum", "units": "mean"}).sort_index()


def median(values):
    return float(np.median(np.asarray(values, dtype=np.float64)))


rng = np.random.default_rng(20260928)
pdf = pd.DataFrame({
    "segment": rng.integers(0, 4096, ROWS, dtype=np.int32),
    "amount": rng.random(ROWS, dtype=np.float32),
    "units": rng.integers(1, 100, ROWS, dtype=np.int32),
})

cpu_times = []
cpu_result = None
for _ in range(ROUNDS):
    started = time.perf_counter()
    cpu_result = workload(pdf)
    cpu_times.append((time.perf_counter() - started) * 1000)

transfer_started = time.perf_counter()
gdf = cudf.from_pandas(pdf)
transfer_ms = (time.perf_counter() - transfer_started) * 1000

workload(gdf).to_pandas()
gpu_times = []
gpu_result = None
for _ in range(ROUNDS):
    started = time.perf_counter()
    gpu_result = workload(gdf).to_pandas()
    gpu_times.append((time.perf_counter() - started) * 1000)

cpu_values = cpu_result.to_numpy(dtype=np.float64)
gpu_values = gpu_result.to_numpy(dtype=np.float64)
parity = cpu_result.index.equals(gpu_result.index) and np.allclose(cpu_values, gpu_values, rtol=1e-5, atol=1e-5)
cpu_ms = median(cpu_times)
gpu_ms = median(gpu_times)

print(json.dumps({
    "rows": ROWS,
    "rounds": ROUNDS,
    "cpuMs": round(cpu_ms, 2),
    "gpuMs": round(gpu_ms, 2),
    "transferMs": round(transfer_ms, 2),
    "speedup": round(cpu_ms / gpu_ms, 2) if gpu_ms else None,
    "parity": bool(parity),
    "groups": int(len(cpu_result)),
}))
