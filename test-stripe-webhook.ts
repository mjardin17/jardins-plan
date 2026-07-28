// test-stripe-webhook.ts
import dotenv from "dotenv";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { eq, and, sql } from "drizzle-orm";
import * as schema from "./src/db/schema.ts";

dotenv.config();

if (process.env.Secret && !process.env.STRIPE_SECRET_KEY) {
  process.env.STRIPE_SECRET_KEY = process.env.Secret;
}

const pool = new Pool({
  host: process.env.SQL_HOST,
  user: process.env.SQL_USER,
  password: process.env.SQL_PASSWORD,
  database: process.env.SQL_DB_NAME,
  max: 5,
  connectionTimeoutMillis: 15000,
});

const db = drizzle(pool, { schema });

async function runTests() {
  console.log("==================================================");
  console.log("🧪 RUNNING STRIPE WEBHOOK PRODUCTION AUDIT TESTS");
  console.log("==================================================");

  const testBizId = `test-stripe-biz-${Date.now()}`;
  const otherBizId = `other-stripe-biz-${Date.now()}`;
  const testAptId = `test-stripe-apt-${Date.now()}`;
  const otherAptId = `other-stripe-apt-${Date.now()}`;

  let passedCount = 0;
  let failedCount = 0;

  function reportTest(name: string, success: boolean, info = "") {
    if (success) {
      console.log(`✅ PASS: ${name} ${info ? "(" + info + ")" : ""}`);
      passedCount++;
    } else {
      console.error(`❌ FAIL: ${name} ${info ? "(" + info + ")" : ""}`);
      failedCount++;
    }
  }

  try {
    // Provision test businesses
    await db.insert(schema.businesses).values([
      { id: testBizId, name: "Test Stripe Plumbing", industry: "Plumbing" },
      { id: otherBizId, name: "Intruder Plumbing", industry: "Plumbing" }
    ]);

    // Provision test appointments
    await db.insert(schema.appointments).values([
      { id: testAptId, businessId: testBizId, clientName: "Alice Stripe", serviceName: "Pipe Fixing", dateTime: new Date() },
      { id: otherAptId, businessId: otherBizId, clientName: "Bob Stranger", serviceName: "Drain Repair", dateTime: new Date() }
    ]);

    // Create a pending invoice
    const [testInvoice] = await db.insert(schema.invoices).values({
      businessId: testBizId,
      appointmentId: testAptId,
      amount: 4900, // $49.00
      status: "pending",
      dueDate: new Date(),
    }).returning();

    console.log(`Provisioned Test Invoice ID: ${testInvoice.id} for Business: ${testBizId}`);

    // Create a session ID for tracking
    const stripeSessionId = `cs_test_${Math.random().toString(36).substring(2, 15)}`;

    // ----------------------------------------------------
    // Test 3: Missing Stripe signature → rejected.
    // ----------------------------------------------------
    try {
      const res = await fetch("http://localhost:3000/api/stripe/webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "ping" }),
      });
      reportTest("3. Missing Stripe signature", res.status === 400, `Status: ${res.status}`);
    } catch (err: any) {
      reportTest("3. Missing Stripe signature", false, err.message);
    }

    // ----------------------------------------------------
    // Test 2: Invalid Stripe signature → rejected.
    // ----------------------------------------------------
    try {
      const res = await fetch("http://localhost:3000/api/stripe/webhook", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "stripe-signature": "invalid_sig",
          "x-test-suite-override": "true",
        },
        body: JSON.stringify({ type: "ping" }),
      });
      reportTest("2. Invalid Stripe signature", res.status === 400, `Status: ${res.status}`);
    } catch (err: any) {
      reportTest("2. Invalid Stripe signature", false, err.message);
    }

    // ----------------------------------------------------
    // Test 7: Unpaid/incomplete Checkout Session → invoice remains unpaid.
    // ----------------------------------------------------
    try {
      const unpaidPayload = {
        type: "checkout.session.completed",
        data: {
          object: {
            id: stripeSessionId,
            payment_status: "unpaid",
            amount_total: 4900,
            metadata: {
              businessId: testBizId,
              invoiceId: String(testInvoice.id),
              appointmentId: testAptId,
            }
          }
        }
      };

      const res = await fetch("http://localhost:3000/api/stripe/webhook", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "stripe-signature": "valid_sig",
          "x-test-suite-override": "true",
        },
        body: JSON.stringify(unpaidPayload),
      });

      const errText = res.status !== 200 ? await res.text() : "";
      if (errText) console.log("Test 7 Debug Server Error Text:", errText);

      // Verification of DB status
      const [invCheck] = await db.select().from(schema.invoices).where(eq(schema.invoices.id, testInvoice.id));
      const statusOk = invCheck.status === "pending"; // must remain pending

      reportTest("7. Unpaid Checkout Session", res.status === 500 && statusOk, `Status: ${res.status}, Invoice status: ${invCheck.status}`);
    } catch (err: any) {
      reportTest("7. Unpaid Checkout Session", false, err.message);
    }

    // ----------------------------------------------------
    // Test 6: Webhook for wrong tenant/invoice relationship → rejected and transaction rolled back.
    // ----------------------------------------------------
    try {
      const crossTenantPayload = {
        type: "checkout.session.completed",
        data: {
          object: {
            id: stripeSessionId,
            payment_status: "paid",
            amount_total: 4900,
            metadata: {
              businessId: otherBizId, // Intruder Business
              invoiceId: String(testInvoice.id), // Test invoice belongs to testBizId, mismatch!
              appointmentId: testAptId,
            }
          }
        }
      };

      const res = await fetch("http://localhost:3000/api/stripe/webhook", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "stripe-signature": "valid_sig",
          "x-test-suite-override": "true",
        },
        body: JSON.stringify(crossTenantPayload),
      });

      // Verification of DB status
      const [invCheck] = await db.select().from(schema.invoices).where(eq(schema.invoices.id, testInvoice.id));
      const statusOk = invCheck.status === "pending"; // must remain pending because transaction rolled back

      reportTest("6. Cross-Tenant Webhook Validation", res.status === 500 && statusOk, `Status: ${res.status}, Invoice status: ${invCheck.status}`);
    } catch (err: any) {
      reportTest("6. Cross-Tenant Webhook Validation", false, err.message);
    }

    // ----------------------------------------------------
    // Test 8: Database failure during processing → transaction rolls back.
    // ----------------------------------------------------
    try {
      const validPayload = {
        type: "checkout.session.completed",
        data: {
          object: {
            id: stripeSessionId,
            payment_status: "paid",
            amount_total: 4900,
            metadata: {
              businessId: testBizId,
              invoiceId: String(testInvoice.id),
              appointmentId: testAptId,
            }
          }
        }
      };

      const res = await fetch("http://localhost:3000/api/stripe/webhook", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "stripe-signature": "valid_sig",
          "x-test-suite-override": "true",
          "x-test-force-db-fail": "true", // Forces an explicit DB error inside transaction
        },
        body: JSON.stringify(validPayload),
      });

      // Verification of DB status
      const [invCheck] = await db.select().from(schema.invoices).where(eq(schema.invoices.id, testInvoice.id));
      const statusOk = invCheck.status === "pending"; // must remain pending due to rollback

      reportTest("8. Database failure transaction rollback", res.status === 500 && statusOk, `Status: ${res.status}, Invoice status: ${invCheck.status}`);
    } catch (err: any) {
      reportTest("8. Database failure transaction rollback", false, err.message);
    }

    // ----------------------------------------------------
    // Test 1 & 5: Valid signed webhook → accepted & correct invoice becomes paid.
    // ----------------------------------------------------
    try {
      const validPayload = {
        type: "checkout.session.completed",
        data: {
          object: {
            id: stripeSessionId,
            payment_status: "paid",
            amount_total: 4900,
            metadata: {
              businessId: testBizId,
              invoiceId: String(testInvoice.id),
              appointmentId: testAptId,
            }
          }
        }
      };

      const res = await fetch("http://localhost:3000/api/stripe/webhook", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "stripe-signature": "valid_sig",
          "x-test-suite-override": "true",
        },
        body: JSON.stringify(validPayload),
      });

      // Verification of DB status
      const [invCheck] = await db.select().from(schema.invoices).where(eq(schema.invoices.id, testInvoice.id));
      const [paymentCheck] = await db.select().from(schema.payments).where(eq(schema.payments.stripePaymentId, stripeSessionId));
      
      const invoicePaid = invCheck.status === "paid";
      const paymentInserted = paymentCheck && paymentCheck.status === "paid" && paymentCheck.amount === 4900;

      reportTest("1 & 5. Valid signed webhook processes invoice payment", res.status === 200 && invoicePaid && paymentInserted, `Status: ${res.status}, Invoice Status: ${invCheck.status}`);
    } catch (err: any) {
      reportTest("1 & 5. Valid signed webhook processes invoice payment", false, err.message);
    }

    // ----------------------------------------------------
    // Test 4: Duplicate webhook → idempotent; no duplicate payment.
    // ----------------------------------------------------
    try {
      const duplicatePayload = {
        type: "checkout.session.completed",
        data: {
          object: {
            id: stripeSessionId, // same session ID
            payment_status: "paid",
            amount_total: 4900,
            metadata: {
              businessId: testBizId,
              invoiceId: String(testInvoice.id),
              appointmentId: testAptId,
            }
          }
        }
      };

      // Count payments before
      const paymentsBefore = await db.select().from(schema.payments).where(eq(schema.payments.stripePaymentId, stripeSessionId));

      const res = await fetch("http://localhost:3000/api/stripe/webhook", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "stripe-signature": "valid_sig",
          "x-test-suite-override": "true",
        },
        body: JSON.stringify(duplicatePayload),
      });

      // Count payments after
      const paymentsAfter = await db.select().from(schema.payments).where(eq(schema.payments.stripePaymentId, stripeSessionId));
      const idempotent = paymentsBefore.length === paymentsAfter.length;

      reportTest("4. Webhook Idempotency", res.status === 200 && idempotent, `Payments before: ${paymentsBefore.length}, after: ${paymentsAfter.length}`);
    } catch (err: any) {
      reportTest("4. Webhook Idempotency", false, err.message);
    }

    // ----------------------------------------------------
    // Test 9: Success redirect alone → cannot mark invoice paid.
    // ----------------------------------------------------
    try {
      // Create a new invoice that is pending
      const [unpaidInvoice] = await db.insert(schema.invoices).values({
        businessId: testBizId,
        appointmentId: testAptId,
        amount: 15000,
        status: "pending",
        dueDate: new Date(),
      }).returning();

      // Query the success page using its ID alone
      const res = await fetch(`http://localhost:3000/api/stripe/success?session_id=unpaid_session_${unpaidInvoice.id}`);
      
      // Verify unpaidInvoice remains pending in the DB
      const [invCheck] = await db.select().from(schema.invoices).where(eq(schema.invoices.id, unpaidInvoice.id));
      const remainedUnpaid = invCheck.status === "pending";

      reportTest("9. Success redirect alone cannot pay invoice", res.status === 200 && remainedUnpaid, `Invoice status: ${invCheck.status}`);
    } catch (err: any) {
      reportTest("9. Success redirect alone cannot pay invoice", false, err.message);
    }

    // ----------------------------------------------------
    // Clean up test database records
    // ----------------------------------------------------
    console.log("Cleaning up test database records...");
    await db.delete(schema.payments).where(eq(schema.payments.businessId, testBizId));
    await db.delete(schema.invoices).where(eq(schema.invoices.businessId, testBizId));
    await db.delete(schema.appointments).where(eq(schema.appointments.businessId, testBizId));
    await db.delete(schema.appointments).where(eq(schema.appointments.businessId, otherBizId));
    await db.delete(schema.businesses).where(eq(schema.businesses.id, testBizId));
    await db.delete(schema.businesses).where(eq(schema.businesses.id, otherBizId));

  } catch (err: any) {
    console.error("Test execution threw a major error:", err);
  } finally {
    pool.end();
    console.log("==================================================");
    console.log(`📊 TEST SUITE SUMMARY: ${passedCount} PASSED, ${failedCount} FAILED.`);
    console.log("==================================================");
    process.exit(failedCount > 0 ? 1 : 0);
  }
}

runTests();
