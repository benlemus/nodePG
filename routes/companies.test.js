process.env.NODE_ENV = "test";

const request = require("supertest");
const app = require("../app");
const db = require("../db");

let testCompany;

beforeEach(async () => {
  const result = await db.query(
    `INSERT INTO companies (code, name, description) VALUES ('apple','Apple', 'the company that makes iPhone') RETURNING code,name,description`
  );

  testCompany = result.rows[0];
});

afterAll(async () => {
  await db.end();
});

afterEach(async () => {
  await db.query(`DELETE FROM companies`);
});

describe("GET /companies", () => {
  test("Gets a list of all companies.", async () => {
    const res = await request(app).get("/companies");

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ companies: [testCompany] });
  });
});

describe("GET /companies/:code", () => {
  test("Gets one company by code.", async () => {
    const res = await request(app).get(`/companies/${testCompany.code}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      company: {
        code: testCompany.code,
        name: testCompany.name,
        description: testCompany.description,
        industries: [null],
      },
      invoices: [],
    });
  });

  test("Rsponds with 404 for invalid code.", async () => {
    const res = await request(app).get("/companies/notAcode");

    expect(res.statusCode).toBe(404);
  });
});

describe("POST /companies", () => {
  test("Creates new company.", async () => {
    const newCompany = {
      name: "google",
      description: "that website you can search stuff on",
    };
    const res = await request(app).post(`/companies`).send(newCompany);

    expect(res.statusCode).toBe(201);
    expect(res.body).toEqual({
      company: {
        code: "google",
        name: "google",
        description: "that website you can search stuff on",
      },
    });
  });

  test("Rsponds with 404 for invalid code.", async () => {
    const res = await request(app).post("/companies");

    expect(res.statusCode).toBe(404);
  });
});

describe("PUT /companies", () => {
  test("Updates company name,desc by code.", async () => {
    const res = await request(app)
      .put(`/companies/${testCompany.code}`)
      .send({ code: "pea", name: "pear", description: "better than apples" });

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      company: { code: "pea", name: "pear", description: "better than apples" },
    });
  });

  test("Rsponds with 404 for invalid code.", async () => {
    const res = await request(app).put("/companies/notAcode");

    expect(res.statusCode).toBe(404);
  });
});

describe("DELETE /companies", () => {
  test("Deletes a company by code.", async () => {
    const res = await request(app).delete(`/companies/${testCompany.code}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ status: "deleted" });
  });

  test("Rsponds with 404 for invalid code.", async () => {
    const res = await request(app).delete("/companies/notAcode");
    expect(res.statusCode).toBe(404);
  });
});
