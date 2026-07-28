# Unified Communications & Voice AI Platform
## System Architecture & Technical Specifications

This report details the architectural design, lifecycles, and technical layouts of the **Unified Communications Platform (Phase 53)** deployed for the **AI Workforce OS**.

---

## 1. Architectural Overview

The Unified Communications Platform aggregates communication streams—Voice, SMS, Email, Website Chat, and Internal Notifications—into a single, secure, low-latency relational datastore. 

```
                                      [ Incoming Call (Twilio SIP) ]
                                                     │
                                                     ▼
    [ Admin QA Auditing ]                 [ AI Receptionist Engine ]
             ▲                                       │
             │ (Rate / Flag / Correct)               ▼ (Confidence Score Query)
     [ ai_responses_feedback ] <─── [ Business Knowledge & Memory Engine ]
             ▲                                       │
             │                                       ▼
             └─────────────────────── [ unified_comms_timeline ] ──> [ CRM CRM Log Sync ]
```

### Relational Schema Layout

1. **`receptionist_config`**: Handles individual enterprise rules, synthetic voice profiles (e.g., Google Text-to-Speech / Speech-to-Text en-US-Neural2-F), greeting scripts, business hours boundaries, custom qualification requirements, and emergency redirect targets.
2. **`unified_comms_timeline`**: A high-density aggregated ledger index, mapping inbound/outbound communication touchpoints to leads, customers, and AI workers.
3. **`ai_responses_feedback`**: Retrains local LLM behavior by indexing spoken prompts against generated outputs and allowing administrator ratings and target transcript overrides.

---

## 2. Conversation Lifecycle & State Transitions

Every incoming caller or webhook event executes a strict transactional state-machine:

```
[ INBOUND CONTACT ] ──> [ HOURS SCREENING ] ──> [ KNOWLEDGE QUERY ] ──> [ CONFIDENCE CHECK ]
                                                                                │
   ┌────────────────────────────────────────────────────────────────────────────┤
   ▼ (Confidence >= 75%)                                                        ▼ (Confidence < 75% or Emergency)
[ EXECUTE NATURAL SPEAK ]                                                    [ HUMAN ESCALATION ROUTE ]
   │                                                                            │
   ▼                                                                            ▼
[ RETIRE CALL & ADD TIMELINE ] <────────────────────────────────────────────────┴── [ SIP TRANSCRIPTION ]
```

1. **Inbound Routing & Hours Screening**: 
   The server matches the incoming webhook timestamp against `business_hours` in `receptionist_config`. Off-hour queries route to a voicemail-friendly transcription flow or direct emergency numbers if flagged.
2. **Dynamic Knowledge Retrieval & Generation**:
   Spoken queries are vectorized and matched against `knowledge_documents` for the active business. The prompt incorporates historical memory, custom pricing limits, and SLA protocols.
3. **Confidence Routing & Safety Gate**:
   - **High Confidence ($\ge$ 75%)**: AI Receptionist plays natural speech output.
   - **Low Confidence (< 75%)**: AI states polite uncertainty, references missing parameters, and triggers immediate transfer to prevent hallucination.
   - **Emergency Routing**: If a call matches critical criteria (e.g. active flood, electrical fire), the call is instantly routed to human dispatch (`emergencyRouting`).

---

## 3. CRM Integration & Synchronization

To avoid isolated communication silos, every timeline event replicates into the **CRM Ledger** (`crm_logs`):

* **Event Association**: Events automatically resolve target `lead_id` or `customer_id` by matching inbound phone or email headers.
* **Timeline Aggregation**: CRM profiles render a cohesive temporal flow, enabling humans to transition from an AI-handled chat directly into a phone call with complete contextual continuity.
* **Follow-up Automations**: Triggers (confirmations, dunning notices, review requests) insert synchronized log entries into both `unified_comms_timeline` and `automation_logs` concurrently.

---

## 4. Security, Compliance, & Privacy Boundaries

To safeguard PII and secure enterprise borders, we enforce:

* **Tenant Isolation**: Row-level constraints in PostgreSQL prevent multi-tenant data bleed. Every database operation mandates a valid, verified `business_id` derived from the session context.
* **Compliance Encryption**: Call transcripts and webhook bodies are sanitized at the ingestion boundary. Call recordings reference secure, signed Google Cloud Storage links with strict TTL limits.
* **Human-in-the-Loop Override**: Financial and billing triggers (e.g. past-due invoice dunning) enforce a manual administrator approval lock prior to carrier dispatch.

---

## 5. Development Roadmap

1. **Phase 1: Carrier Webhook Integration (Completed)**: Web APIs configured for Twilio Voice, SMS, and SMTP.
2. **Phase 2: RAG-based Voice Playground (Completed)**: Live Gemini-powered Voice Knowledge simulator with confidence score evaluations and escalations.
3. **Phase 3: QA & Human Corrective Backprop (Completed)**: Admin rating, correction, and log overrides.
4. **Phase 4: Low-latency WebRTC Audio Streaming (Future)**: Native browser audio streaming with streaming speech-to-text to reduce call-and-response times below 350ms.
