# Observability & Centralized Logging Guide (ELK + Zipkin)

This directory contains the pipeline and setup for Distributed Tracing (Zipkin) and Centralized Logging (ELK Stack).

---

## 1. Quick Start

To spin up Zipkin and the ELK Stack together:

```bash
cd elk
docker compose -f docker-compose-elk.yml up -d
```

Services exposed:
- **Zipkin UI**: `http://localhost:9411`
- **Elasticsearch API**: `http://localhost:9200`
- **Logstash TCP Ingestion**: `localhost:5000`
- **Kibana UI**: `http://localhost:5601`

---

## 2. Kibana Index Setup

1. Open Kibana at `http://localhost:5601`.
2. Navigate to **Stack Management** > **Index Patterns** (or **Data Views**).
3. Create a data view with:
   - **Name**: `LinkedIn Microservices Logs`
   - **Index pattern**: `linkedin-logs-*`
   - **Timestamp field**: `@timestamp`
4. Click **Save data view to Kibana**.

---

## 3. Log & Trace Correlation Flow

When a client sends a request to API Gateway:
1. **API Gateway** creates a `traceId` (e.g. `64a9f8b2d1c3e4f5`) and `spanId`.
2. `traceId` is propagated across Feign calls (`posts-service` -> `connection-service`) and Kafka events (`posts-service` -> Kafka -> `notification-service`).
3. Every log entry written by Logback automatically contains `%mdc{traceId}` and `%mdc{spanId}`.
4. In **Kibana Discover**, search:
   ```text
   traceId: "64a9f8b2d1c3e4f5"
   ```
   This returns the complete sequence of log statements across all 5 microservices for that single transaction!
5. In **Zipkin UI** (`http://localhost:9411`), search the same `traceId` to view latency breakdowns and waterfall span diagrams.
