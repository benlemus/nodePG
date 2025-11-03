const express = require("express");
const router = express.Router();
const db = require("../db");
const ExpressError = require("../expressError");

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

    const company = await db.query(
      `SELECT code, name, description FROM companies WHERE code = $1`,
      [code]
    );

    if (!company.rows[0])
      throw new ExpressError(`Could not get company with code ${code}`, 404);

    const invoices = await db.query(
      `SELECT id, amt, paid, add_date, paid_date FROM invoices WHERE comp_code = $1`,
      [code]
    );

    return res.json({
      company: company.rows[0],
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
    const { code, name, description } = req.body;
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
