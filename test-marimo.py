import marimo

__generated_with = "0.14.13"
app = marimo.App(width="medium")


@app.cell
def _():
    import marimo as mo
    return (mo,)


@app.cell
def _():
    import os
    import sqlalchemy
    import json
    import pandas_gbq as gbq
    from google.oauth2 import service_account
    return gbq, json, os, service_account, sqlalchemy


@app.cell
def _(os, sqlalchemy):
    _password = os.environ.get("POSTGRES_PASSWORD", "99378mikotoli-hid")
    DATABASE_URL = f"postgresql://matsu:{_password}@localhost:5432/sub_job"
    engine = sqlalchemy.create_engine(DATABASE_URL)
    return (engine,)


@app.cell
def _(gbq, json, os, service_account, sqlalchemy):
    key_path=f"{os.getcwd()}/secrets/inventoria-463606-c78b4fc83343.json"
    with open(key_path, "r") as f:
        credentials = json.loads(f.read())
        gbq.context.credentials = service_account.Credentials.from_service_account_file(key_path)
    engine_bq = sqlalchemy.create_engine(f"bigquery://inventoria-463606/inventoria", credentials_info=credentials)
    return (engine_bq,)


@app.cell
def _(engine, mo):
    df = mo.sql(
        f"""
        SELECT * FROM settlement
        """,
        engine=engine
    )
    return (df,)


@app.cell
def _(engine, mo):
    df_grouped = mo.sql(
        f"""
        SELECT settlement_type, SUM(amount), EXTRACT(YEAR FROM settlement_date) as year, EXTRACT(MONTH FROM settlement_date) as month FROM settlement
        GROUP BY settlement_type, settlement_date
        """,
        engine=engine
    )
    return


@app.cell
def _():
    import altair as alt
    return (alt,)


@app.cell
def _(alt, df, mo):
    chart = mo.ui.altair_chart(alt.Chart(df).mark_line().encode(
        x="settlement_date",
        y="amount",
        color="settlement_type"
    ))
    chart
    return


@app.cell
def _(engine, mo):
    supplier = mo.sql(
        f"""
        SELECT * FROM supplier_master
        """,
        engine=engine
    )
    return (supplier,)


@app.cell
def _(gbq):
    gbq.read_gbq(
        """
        SELECT * FROM `inventoria-463606.Inventoria.settlement`
        """,
        project_id="inventoria-463606",
        location="asia-northeast1"
    )
    return


@app.cell
def _(df):
    # gbq.to_gbq(df, if_exists="replace")
    df.to_gbq("Inventoria.settlement",if_exists="replace")
    return


@app.cell
def _(supplier):
    supplier.to_gbq('Inventoria.supplier',if_exists="replace")
    return


@app.cell
def _(engine_bq, mo):
    _df = mo.sql(
        f"""
        SELECT * FROM `Inventoria.settlement`
        """,
        engine=engine_bq
    )
    return


@app.cell
def _():
    return


if __name__ == "__main__":
    app.run()
