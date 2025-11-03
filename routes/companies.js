const express = require("express");
const router = express.Router();
const db = require("../db");
const ExpressError = require("../expressError");
const slugify = require("slugify");

/** GET: GETS ALL COMPANIES */
router.get("/", async (req, res, next) => {
  try {
    const results = await db.query(`SELECT * FROM companies`);
    return res.json({ companies: results.rows });
  } catch (e) {
    return next(new ExpressError("Could not get companies", 404));
  }
});

/** GET: GETS ONE COMPANY BY CODE */
router.get("/:code", async (req, res, next) => {
  try {
    const { code } = req.params;

    const results = await db.query(
      `SELECT c.code, c.name, c.description, i.name AS industry
        FROM companies AS c
        LEFT JOIN industries_companies AS ic
        ON c.code = ic.comp_code
        LEFT JOIN industries AS i
        ON ic.industry_code = i.code
        WHERE c.code = $1`,
      [code]
    );

    if (!results.rows[0])
      throw new ExpressError(`Could not get company with code ${code}`, 404);

    const { name, description } = results.rows[0];
    const comp_code = results.rows[0].code;
    const industries = results.rows.map((r) => r.industry);

    const invoices = await db.query(
      `SELECT id, amt, paid, add_date, paid_date FROM invoices WHERE comp_code = $1`,
      [code]
    );

    return res.json({
      company: {
        code: comp_code,
        name,
        description,
        industries,
      },
      invoices: invoices.rows,
    });
  } catch (e) {
    return next(
      new ExpressError(
        `Could not get company with code ${req.params.code}`,
        404
      )
    );
  }
});

/** POST: MAKE NEW COMPANY */
router.post("/", async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const code = slugify(name, { lower: true, remove: /[#!]/g, strict: true });
    const result = await db.query(
      `INSERT INTO companies (code, name, description) VALUES ($1, $2, $3) RETURNING *`,
      [code, name, description]
    );
    return res.status(201).json({ company: result.rows[0] });
  } catch (e) {
    return next(new ExpressError(`Could not create new company`, 404));
  }
});

/** PUT: EDIT EXISTING COMPANY */
router.put("/:code", async (req, res, next) => {
  try {
    const curCode = req.params.code;
    const { code, name, description } = req.body;
    const result = await db.query(
      `UPDATE companies SET code=$1, name=$2, description=$3 WHERE code=$4 RETURNING *`,
      [code, name, description, curCode]
    );
    return res.json({ company: result.rows[0] });
  } catch (e) {
    return next(
      new ExpressError(
        `Could not edit company with code: ${req.params.code}`,
        404
      )
    );
  }
});

/** DELETE: DELETES A COMPANY */
router.delete("/:code", async (req, res, next) => {
  try {
    const { code } = req.params;

    const result = await db.query(
      `DELETE FROM companies WHERE code = $1 RETURNING code`,
      [code]
    );

    if (result.rowCount === 0) {
      throw new ExpressError(`Company with code ${code} not found`, 404);
    }

    return res.json({ status: "deleted" });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
