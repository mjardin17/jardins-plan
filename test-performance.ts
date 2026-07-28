// test-performance.ts
import http from "http";

const TARGET_URL = "http://localhost:3000/api/business/apex-plumbing";

function makeRequest(): Promise<{ success: boolean; latency: number }> {
  return new Promise((resolve) => {
    const start = Date.now();
    const req = http.get(TARGET_URL, (res) => {
      let data = "";
      res.on("data", (chunk) => { data += chunk; });
      res.on("end", () => {
        const latency = Date.now() - start;
        const success = res.statusCode === 200 && data.includes("Apex Plumbing Solutions");
        resolve({ success, latency });
      });
    });

    req.on("error", () => {
      resolve({ success: false, latency: Date.now() - start });
    });
  });
}

async function runConcurrencyTest(concurrency: number) {
  console.log(`\n🚀 Starting Load Test with ${concurrency} concurrent HTTP requests...`);
  
  const start = Date.now();
  const promises = Array.from({ length: concurrency }).map(() => makeRequest());
  const results = await Promise.all(promises);
  const totalDuration = Date.now() - start;

  const successful = results.filter((r) => r.success);
  const latencies = results.map((r) => r.latency).sort((a, b) => a - b);
  const minLatency = latencies[0];
  const maxLatency = latencies[latencies.length - 1];
  const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;

  const p50 = latencies[Math.floor(latencies.length * 0.5)];
  const p95 = latencies[Math.floor(latencies.length * 0.95)] || maxLatency;
  const p99 = latencies[Math.floor(latencies.length * 0.99)] || maxLatency;
  const rps = (successful.length / (totalDuration / 1000)).toFixed(1);

  console.log(`--------------------------------------------------`);
  console.log(`📊 Concurrency Level: ${concurrency}`);
  console.log(`⚡ Success Rate:      ${successful.length} / ${concurrency} (${((successful.length / concurrency) * 100).toFixed(1)}%)`);
  console.log(`⏱️  Total Duration:    ${totalDuration}ms`);
  console.log(`📈 Requests / Sec:    ${rps}`);
  console.log(`📉 Min Latency:      ${minLatency}ms`);
  console.log(`🧮 Avg Latency:      ${avgLatency.toFixed(1)}ms`);
  console.log(`🎯 P50 Latency:      ${p50}ms`);
  console.log(`🎯 P95 Latency:      ${p95}ms`);
  console.log(`🎯 P99 Latency:      ${p99}ms`);
  console.log(`--------------------------------------------------`);

  return { concurrency, successRate: successful.length / concurrency, avgLatency, p50, p95, p99, rps, totalDuration };
}

async function main() {
  console.log("==================================================");
  console.log("⏱️  EXECUTING SYSTEM STATELESS PERFORMANCE LOAD TEST");
  console.log("==================================================");
  
  try {
    const test1 = await runConcurrencyTest(10);
    const test2 = await runConcurrencyTest(100);
    const test3 = await runConcurrencyTest(500);

    console.log("\n==================================================");
    console.log("🏁 PERFORMANCE REPORT SUMMARY");
    console.log("==================================================");
    console.log(`10 Concurrency:`);
    console.log(`  - Avg Latency:  ${test1.avgLatency.toFixed(1)}ms`);
    console.log(`  - P50 Latency:  ${test1.p50}ms`);
    console.log(`  - P95 Latency:  ${test1.p95}ms`);
    console.log(`  - P99 Latency:  ${test1.p99}ms`);
    console.log(`  - Throughput:   ${test1.rps} req/sec`);
    console.log(`  - Success Rate: ${test1.successRate * 100}%`);
    console.log(`100 Concurrency:`);
    console.log(`  - Avg Latency:  ${test2.avgLatency.toFixed(1)}ms`);
    console.log(`  - P50 Latency:  ${test2.p50}ms`);
    console.log(`  - P95 Latency:  ${test2.p95}ms`);
    console.log(`  - P99 Latency:  ${test2.p99}ms`);
    console.log(`  - Throughput:   ${test2.rps} req/sec`);
    console.log(`  - Success Rate: ${test2.successRate * 100}%`);
    console.log(`500 Concurrency:`);
    console.log(`  - Avg Latency:  ${test3.avgLatency.toFixed(1)}ms`);
    console.log(`  - P50 Latency:  ${test3.p50}ms`);
    console.log(`  - P95 Latency:  ${test3.p95}ms`);
    console.log(`  - P99 Latency:  ${test3.p99}ms`);
    console.log(`  - Throughput:   ${test3.rps} req/sec`);
    console.log(`  - Success Rate: ${test3.successRate * 100}%`);
    console.log("==================================================");
    console.log("✅ Load test execution successfully finished.");
  } catch (err: any) {
    console.error("Performance load test failed:", err.message);
  }
}

main().catch(console.error);
