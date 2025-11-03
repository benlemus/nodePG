const express = require("express");
const router = express.Router();
const db = require("../db");
const ExpressError = require("../expressError");

/** GET: GETS ALL INVOICES */
router.get("/", async (req, res, next) => {
  try {
    const results = await db.query(`SELECT * FROM invoices`);
    return res.json({ invoices: results.rows });
  } catch (e) {
    return next(new ExpressError("Could not get invoices", 404));
  }
});

/** GET: GETS ONE INVOICE BY ID */
router.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      `SELECT invoices.id, invoices.amt, invoices.paid, invoices.add_date, invoices.paid_date, companies.code AS company_code,companies.name AS company_name, companies.description AS company_description FROM invoices JOIN companies ON invoices.comp_code = companies.code WHERE invoices.id = $1`,
      [id]
    );
    const invoice = result.rows[0];

    return res.json({
      invoice: {
        id: invoice.id,
        amt: invoice.amt,
        paid: invoice.paid,
        add_date: invoice.add_date,
        paid_date: invoice.paid_date,
        company: {
          code: invoice.company_code,
          name: invoice.company_name,
          description: invoice.company_description,
        },
      },
    });
  } catch (e) {
    return next(
      new ExpressError(`Could not get invoice with id ${req.params.id}`, 404)
    );
  }
});

/** POST: MAKES NEW INVOICE */
router.post("/", async (req, res, next) => {
  try {
    const { comp_code, amt } = req.body;

    if (!comp_code || !amt) {
      throw new ExpressError("comp_code and amt are required", 400);
    }

    const result = await db.query(
      `INSERT INTO invoices (comp_code, amt)
       VALUES ($1, $2)
       RETURNING *`,
      [comp_code, amt]
    );
    return res.status(201).json({ invoice: result.rows[0] });
  } catch (e) {
    return next(new ExpressError(`Could not create new company`, 404));
  }
});

/** PUT: EDITS EXISTING INVOICE */
router.put("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    let { amt, paid } = req.body;

    const curResult = await db.query(
      `SELECT amt, paid, paid_date FROM invoices WHERE id = $1`,
      [id]
    );

    if (curResult.rows.length === 0) {
      throw new ExpressError(`Invoice not found with id: ${id}`, 404);
    }

    const cur = curResult.rows[0];

    let paid_date = cur.paid_date;

    if (paid && !cur.paid) {
      paid_date = new Date();
    } else if (!paid && cur.paid) {
      paid_date = null;
    }

    const result = await db.query(
      `UPDATE invoices SET amt=$1, paid=$2, paid_date=$3 WHERE id=$4 RETURNING *`,
      [amt, paid, paid_date, id]
    );
    return res.json({ invoice: result.rows[0] });
  } catch (e) {
    return next(new ExpressError("Could not edit invoices", 404));
  }
});

/** DELETE: DELETES A INVOICE */
router.delete("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      `DELETE FROM invoices WHERE id=$1 RETURNING id`,
      [id]
    );

    if (result.rowCount === 0) {
      throw new ExpressError(`Invoice with id ${id} not found`, 404);
    }

    return res.json({ status: "deleted" });
  } catch (e) {
    return next(
      new ExpressError(
        `Could not delete company with id: ${req.params.id}`,
        404
      )
    );
  }
});

module.exports = router;
