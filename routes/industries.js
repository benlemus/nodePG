const express = require("express");
const router = express.Router();
const db = require("../db");
const ExpressError = require("../expressError");

router.post("/", async (req, res, next) => {
  try {
    const { code, name } = req.body;
    const result = await db.query(
      `INSERT INTO industries (code, name) VALUES ($1, $2) RETURNING *`,
      [code, name]
    );
    return res.status(201).json({ industry: result.rows[0] });
  } catch (e) {
    return next(new ExpressError(`Could not create new industry`, 404));
  }
});

router.get("/", async (req, res, next) => {
  try {
    const results = await db.query(
      `SELECT i.code, i.name, c.code AS company
        FROM industries AS i
        LEFT JOIN industries_companies AS ic
        ON i.code = ic.industry_code
        LEFT JOIN companies AS c
        ON ic.comp_code = c.code`
    );

    const industriesMap = {};

    for (const row of results.rows) {
      const { code, name, company } = row;

      if (!industriesMap[code]) {
        industriesMap[code] = {
          code: code,
          name: name,
          companies: [],
        };
      }

      if (company) {
        industriesMap[code].companies.push(company);
      }
    }

    const industries = Object.values(industriesMap);

    if (industries.length === 0) {
      throw new ExpressError("No industries found", 404);
    }

    return res.json({ industries });
  } catch (e) {
    return next(new ExpressError(`Could not get industries`, 404));
  }
});

router.post("/add-to-company", async (req, res, next) => {
  try {
    const { comp_code, industry_code } = req.body;
    const result = await db.query(
      `INSERT INTO industries_companies (comp_code, industry_code) VALUES ($1, $2) RETURNING *`,
      [comp_code, industry_code]
    );
    return res.status(201).json({ industry_company: result.rows[0] });
  } catch (e) {
    return next(
      new ExpressError(`Could not create new industry company join`, 404)
    );
  }
});
module.exports = router;
