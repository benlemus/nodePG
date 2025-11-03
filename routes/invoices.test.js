process.env.NODE_ENV === "test";

const request = require("supertest");
const app = require("../app");
const db = require("../db");

let testCompany;
let testInvoice;

beforeEach(async () => {
  const company = await db.query(
    `INSERT INTO companies (code, name, description) VALUES ('app','Apple', 'the company that makes iPhone') RETURNING code,name,description`
  );

  const invoice = await db.query(
    `INSERT INTO invoices (comp_code, amt) VALUES ('app', 200) RETURNING id, comp_code, amt, paid, add_date, paid_date`
  );

  testCompany = company.rows[0];
  testInvoice = invoice.rows[0];
});

afterAll(async () => {
  await db.end();
});

afterEach(async () => {
  await db.query(`DELETE FROM companies`);
  await db.query(`DELETE FROM invoices`);
});

describe("GET /invoices", () => {
  test("Gets a list of all invoices.", async () => {
    const res = await request(app).get("/invoices");

    expect(res.statusCode).toBe(200);
    expect(res.body.invoices[0].id).toEqual(testInvoice.id);
  });
});

describe("GET /invocies/:id", () => {
  test("Gets one invoice by id.", async () => {
    const res = await request(app).get(`/invoices/${testInvoice.id}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.invoice.id).toEqual(testInvoice.id);
  });

  test("Rsponds with 404 for invalid id.", async () => {
    const res = await request(app).get("/invoices/0");

    expect(res.statusCode).toBe(404);
  });
});

describe("POST /invoices", () => {
  test("Creates new invoice.", async () => {
    const newInvoice = {
      comp_code: `${testCompany.code}`,
      amt: 300,
    };
    const res = await request(app).post(`/invoices`).send(newInvoice);

    expect(res.statusCode).toBe(201);
    expect(res.body.invoice.amt).toEqual(300);
  });

  test("Rsponds with 404 for invalid info.", async () => {
    const res = await request(app).post("/invoices").send({});

    expect(res.statusCode).toBe(404);
  });
});

describe("PUT /invocies", () => {
  test("Updates invoice amt by id.", async () => {
    const res = await request(app)
      .put(`/invoices/${testInvoice.id}`)
      .send({ amt: 1000 });

    expect(res.statusCode).toBe(200);
    expect(res.body.invoice.amt).toEqual(1000);
  });

  test("Rsponds with 404 for invalid id.", async () => {
    const res = await request(app).put("/invoices/0");

    expect(res.statusCode).toBe(404);
  });
});

describe("DELETE /invoices", () => {
  test("Deletes an invoice by id.", async () => {
    const res = await request(app).delete(`/invoices/${testInvoice.id}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ status: "deleted" });
  });

  test("Rsponds with 404 for invalid id.", async () => {
    const res = await request(app).delete("/invoices/0");
    expect(res.statusCode).toBe(404);
  });
});
