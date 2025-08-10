import streamlit as st
from models.db import get_db, SessionLocal, engine
from models.viewer import Viewer
from models.schemas import Item, Supplier, SupplierItem, Transactions, SupplierMaster, Settlement, SettlementStatus, SettlementType
from sqlalchemy import func, desc, case, or_, Integer, String, DateTime, UUID, Boolean, Float
from datetime import datetime
import pandas as pd
import uuid
from models.config import TEAM_ID, TZ

def get_dtype_dict_from_model(model_class):
    """SQLAlchemyモデルからdtype辞書を生成"""
    dtype_mapping = {
        'Integer': Integer,
        'String': String,
        'DateTime': DateTime,
        'UUID': UUID,  # UUIDはStringとして扱う
        'Text': String,
        'Boolean': Boolean,
        'Float': Float,
    }
    
    dtype_dict = {}
    for column_name, column in model_class.__table__.columns.items():
        column_type = str(column.type)
        # 型名を抽出（例: 'INTEGER' -> 'Integer'）
        type_name = column_type.split('(')[0].title()
        
        # マッピングから適切なSQLAlchemy型を取得
        if type_name in dtype_mapping:
            dtype_dict[column_name] = dtype_mapping[type_name]
        else:
            # デフォルトはString
            dtype_dict[column_name] = String
    
    return dtype_dict


class SupplierViewer(Viewer):
    """
    支払い先のビューアー
    """

    @staticmethod
    @st.cache_data
    def get_supplier_master(updated_at=None):
        with SessionLocal() as db:
            # SQLAlchemyクエリ結果をpandas DataFrameに変換
            query = db.query(SupplierMaster)
            df_supplier_master = pd.read_sql(query.statement, con=engine)
            
            # データ型を適切に設定
            df_supplier_master["created_at"] = pd.to_datetime(df_supplier_master["created_at"])
            df_supplier_master["updated_at"] = pd.to_datetime(df_supplier_master["updated_at"])
            
            # UUID列を文字列に変換
            df_supplier_master["team_id"] = df_supplier_master["team_id"].astype(str)
            df_supplier_master["supplier_code"] = df_supplier_master["supplier_code"].astype(str)
            
            # 文字列列を適切に設定
            string_columns = ["supplier_name", "bank_from", "bank_to", "note", "account_name"]
            for col in string_columns:
                if col in df_supplier_master.columns:
                    df_supplier_master[col] = df_supplier_master[col].astype(str).fillna("")
            
            return df_supplier_master
    
    @staticmethod
    @st.cache_data
    def get_settlement(updated_at=None):
        with SessionLocal() as db:
            # SQLAlchemyクエリ結果をpandas DataFrameに変換
            query = db.query(Settlement).order_by(desc(Settlement.settlement_date), desc(Settlement.created_at))
            df_settlement = pd.read_sql(query.statement, con=engine)
            
            # データ型を適切に設定
            df_settlement["settlement_date"] = pd.to_datetime(df_settlement["settlement_date"])
            df_settlement["updated_at"] = pd.to_datetime(df_settlement["updated_at"])
            df_settlement["created_at"] = pd.to_datetime(df_settlement["created_at"])
            
            # 数値列を適切な型に変換
            df_settlement["amount"] = pd.to_numeric(df_settlement["amount"], errors='coerce').fillna(0).astype(int)
            df_settlement["commission"] = pd.to_numeric(df_settlement["commission"], errors='coerce').fillna(0).astype(int)
            
            # UUID列を文字列に変換
            df_settlement["team_id"] = df_settlement["team_id"].astype(str)
            df_settlement["supplier_code"] = df_settlement["supplier_code"].astype(str)
            
            # 文字列列を適切に設定
            string_columns = ["settlement_type", "supplier_name", "status", "note", "bank_from", "bank_to", "account_name", "updated_by"]
            for col in string_columns:
                if col in df_settlement.columns:
                    df_settlement[col] = df_settlement[col].astype(str).fillna("")
            
            return df_settlement
    
    @st.dialog("支払いを追加")
    def add_settlement(_self, df_supplier_master, key="add_settlement"):
        settlement_date = st.date_input("日付", key=f"{key}_settlement_date", value=datetime.now(TZ))
        settlement_type = st.segmented_control("収支種別", options=SettlementType.values(), default=SettlementType.OUT.value, key=f"{key}_settlement_type", selection_mode="single")
        # settlement_month = st.date_input("支払い月", key=f"{key}_settlement_month", value=datetime.now(TZ), format="YYYY/MM")
        supplier = st.selectbox("支払い先", options=df_supplier_master.to_dict(orient="records"), format_func=lambda x: x["supplier_name"], key=f"{key}_supplier_name")
        bank_from = st.selectbox("支払元口座", options=df_supplier_master["bank_from"].unique().tolist(), index=df_supplier_master["bank_from"].unique().tolist().index(supplier["bank_from"]), key=f"{key}_bank_from")
        bank_to = st.selectbox("支払先銀行", options=df_supplier_master["bank_to"].unique().tolist(), index=df_supplier_master["bank_to"].unique().tolist().index(supplier["bank_to"]), key=f"{key}_bank_to")
        account_name = st.selectbox("口座登録名", options=df_supplier_master["account_name"].unique().tolist(), index=df_supplier_master["account_name"].unique().tolist().index(supplier["account_name"]), key=f"{key}_account_name")
        amount = st.number_input("金額", key=f"{key}_amount", min_value=0)
        commission = st.number_input("手数料", key=f"{key}_commission", min_value=0)
        status = st.selectbox("ステータス", options=SettlementStatus.values(), index=0, key=f"{key}_status")
        note = st.text_input("特記事項", value=supplier["note"], key=f"{key}_note")
        col1, col2 = st.columns(2)
        if col1.button("保存",icon=":material/save:", key=f"{key}_save"):
            with SessionLocal() as db:
                db.add(Settlement(
                    team_id=TEAM_ID,
                    settlement_date=settlement_date,
                    settlement_type=settlement_type,
                    # settlement_month=settlement_month,
                    supplier_code=uuid.UUID(supplier["supplier_code"]),
                    supplier_name=supplier["supplier_name"],
                    amount=amount,
                    commission=commission,
                    note=note,
                    bank_from=bank_from,
                    bank_to=bank_to,
                    account_name=account_name,
                    status=status,
                    updated_by=_self.user_name
                ))
                db.commit()
            _self.updated_at = datetime.now(TZ)
            st.success("支払いを追加しました")
            st.rerun()
        if col2.button("キャンセル",icon=":material/cancel:", key=f"{key}_cancel"):
            st.rerun()
    
    @st.dialog("支払い先を追加")
    def add_supplier_master(_self, df_supplier_master, key="add_supplier_master"):
        supplier_name = st.text_input("支払い先名", key=f"{key}_supplier_name")
        bank_from = st.text_input("支払元口座", key=f"{key}_bank_from")
        bank_to = st.text_input("支払先銀行", key=f"{key}_bank_to")
        account_name = st.text_input("口座登録名", key=f"{key}_account_name")
        note = st.text_input("特記事項", key=f"{key}_note")
        col1, col2 = st.columns((1,1))
        if col1.button("追加",icon=":material/add:", key=f"{key}_add"):
            with SessionLocal() as db:
                db.add(SupplierMaster(
                    team_id=TEAM_ID,
                    supplier_name=supplier_name,
                    bank_from=bank_from,
                    bank_to=bank_to,
                    account_name=account_name,
                    note=note,
                    # updated_by=_self.user_name
                ))
                db.commit()
            _self.updated_at = datetime.now(TZ)
            st.success("支払い先を追加しました")
            st.rerun()
        if col2.button("キャンセル",icon=":material/cancel:", key=f"{key}_cancel"):
            st.rerun()
    
    @st.dialog("支払い先を削除")
    def delete_supplier_master(_self, df_supplier_master, key="delete_supplier_master"):
        st.dataframe(df_supplier_master, column_order=["id", "supplier_name", "bank_from", "bank_to", "note", "account_name"], column_config={
            "id": st.column_config.TextColumn(label="ID"),
            "supplier_name": st.column_config.TextColumn(label="支払い先名"),
            "bank_from": st.column_config.TextColumn(label="支払元口座"),
            "bank_to": st.column_config.TextColumn(label="支払先銀行"),
            "note": st.column_config.TextColumn(label="特記事項"),
            "account_name": st.column_config.TextColumn(label="口座登録名"),
        }, hide_index=True, use_container_width=True)
        col1, col2 = st.columns((1,1))
        if col1.button("削除",icon=":material/delete:", key=f"{key}_delete"):
            with SessionLocal() as db:
                db.query(SupplierMaster).filter(SupplierMaster.supplier_code.in_(df_supplier_master["supplier_code"])).delete()
                db.commit()
            _self.updated_at = datetime.now(TZ)
            st.success("支払い先を削除しました")
            st.rerun()
        if col2.button("キャンセル",icon=":material/cancel:", key=f"{key}_cancel"):
            st.rerun()

    @st.dialog("支払いを削除")
    def delete_settlement(_self, df_settlement, key="delete_settlement"):
        st.dataframe(df_settlement, column_order=["id", "settlement_date", "settlement_type", "supplier_name", "amount", "commission", "status", "note", "bank_from", "bank_to", "account_name", "updated_at", "created_at", "updated_by"], column_config={
            "id": st.column_config.TextColumn(label="ID"),
            "settlement_date": st.column_config.DateColumn(label="日付"),
            "settlement_type": st.column_config.TextColumn(label="収支種別"),
            "status": st.column_config.TextColumn(label="ステータス"),
            "amount": st.column_config.NumberColumn(label="金額", format="yen"),
            "commission": st.column_config.NumberColumn(label="手数料", format="yen"),
            "supplier_name": st.column_config.TextColumn(label="支払い先名"),
            # "supplier_code": st.column_config.TextColumn(label="支払い先コード"),
            "bank_from": st.column_config.TextColumn(label="支払元口座"),
            "bank_to": st.column_config.TextColumn(label="支払先銀行"),
            "note": st.column_config.TextColumn(label="特記事項"),
            "account_name": st.column_config.TextColumn(label="口座登録名"),
            "updated_at": "更新日時",
            "created_at": "作成日時",
            "updated_by": "更新者",
        }, hide_index=True, use_container_width=True)
        col1, col2 = st.columns((1,1))
        if col1.button("削除",icon=":material/delete:", key=f"{key}_delete"):
            with SessionLocal() as db:
                db.query(Settlement).filter(Settlement.id.in_(df_settlement["id"])).delete()
                db.commit()
            _self.updated_at = datetime.now(TZ)
            st.rerun()
        if col2.button("キャンセル",icon=":material/cancel:", key=f"{key}_cancel"):
            st.rerun()

    def st_supplier_master_editor(self, df_supplier_master, _st=st, key="supplier_master_editor"):
        with _st.container(border=True):
            _st.subheader("支払い先を編集")
            select = _st.checkbox("全選択", key=f"{key}_select_all")
            df_supplier_master_edit = _st.data_editor(
                df_supplier_master.assign(selected=select), 
                disabled=["supplier_code"],
                column_order=["selected", "supplier_name", "bank_from", "bank_to", "note", "account_name"], 
                column_config={
                    "selected": st.column_config.CheckboxColumn(label="選択", pinned=True),
                    "supplier_code": st.column_config.TextColumn(label="支払い先コード"),
                    "supplier_name": st.column_config.TextColumn(label="支払い先名"),
                    "bank_from": st.column_config.TextColumn(label="支払元口座"),
                    "bank_to": st.column_config.TextColumn(label="支払先銀行"),
                    "note": st.column_config.TextColumn(label="特記事項"),
                    "account_name": st.column_config.TextColumn(label="口座登録名"),
                }, 
                # num_rows="dynamic", 
                hide_index=True, 
                use_container_width=True,
                key="supplier_master_editor"
            )
            # データ型を統一
            df_selected = df_supplier_master_edit[df_supplier_master_edit["selected"]]
            df_selected_edit = df_supplier_master_edit.drop(columns=["selected"])
            compare_cols = df_selected_edit.columns.intersection(df_supplier_master.columns)
            mismatch_mask = (df_selected_edit[compare_cols] != df_supplier_master[compare_cols]).any(axis=1)
            changed_rows = df_selected_edit[mismatch_mask].index.tolist()
            
            _st.write(f"変更された行: {len(changed_rows)}行")
            col1, col2, col3, col4 = _st.columns((1,1,1,3))
            col1.button("追加",icon=":material/add:", key=f"{key}_add", on_click=self.add_supplier_master, args=(df_supplier_master,))
            col2.button("削除",icon=":material/delete:", key=f"{key}_delete", on_click=self.delete_supplier_master, args=(df_selected,))

            if changed_rows:
                if col3.button("保存",icon=":material/save:", key=f"{key}_save"):
                    # 変更された行のみを更新
                    with SessionLocal() as db:
                        for idx in changed_rows:
                            if idx in df_supplier_master.index:
                                supplier_master_id = int(df_supplier_master.loc[idx, "id"])
                                supplier_master = db.query(SupplierMaster).filter(SupplierMaster.id == supplier_master_id).first()
                                if supplier_master:
                                    # 各列を更新
                                    for col in df_selected_edit.columns:
                                        if col != "id" and hasattr(supplier_master, col):
                                            value = df_selected_edit.loc[idx, col]
                                            if col in ["team_id", "supplier_code"]:
                                                value = uuid.UUID(value)
                                            setattr(supplier_master, col, value)
                                    supplier_master.updated_at = datetime.now(TZ)
                                    supplier_master.updated_by = self.user_name
                        db.commit()
                    _st.success("支払い先を更新しました")
                    self.updated_at = datetime.now(TZ)
                    _st.rerun()

    def st_settlement_editor(self,df_settlement, df_supplier_master, _st=st, key="settlement_editor"):
        with _st.container(border=True):
            _st.subheader("支払いを編集")
            # _df_settlement = df_settlement.merge(df_supplier_master, on="supplier_code", how="left")
            select = _st.checkbox("全選択", key=f"{key}_select_all")
            df_settlement_edit = _st.data_editor(df_settlement.assign(selected=select), 
                column_order=["selected", "settlement_date", "settlement_type", "supplier_name", "amount", "commission", "status", "bank_from", "bank_to", "account_name", "note", "updated_at", "created_at", "updated_by"],
                disabled=["supplier_code", "updated_at", "created_at", "updated_by"],
                column_config={
                    "selected": st.column_config.CheckboxColumn(label="選択", pinned=True),
                    "settlement_date": st.column_config.DateColumn(label="日付"),
                    "settlement_type": st.column_config.SelectboxColumn(label="収支種別", options=SettlementType.values()),
                    "status": st.column_config.SelectboxColumn(label="ステータス", options=SettlementStatus.values()),
                    "amount": st.column_config.NumberColumn(label="金額", format="yen"),
                    "commission": st.column_config.NumberColumn(label="手数料", format="yen"),
                    "supplier_name": st.column_config.SelectboxColumn(label="支払い先名", options=df_supplier_master["supplier_name"].unique()),
                    "supplier_code": st.column_config.TextColumn(label="支払い先コード"),
                    "bank_from": st.column_config.SelectboxColumn(label="支払元口座", options=df_supplier_master["bank_from"].unique()),
                    "bank_to": st.column_config.SelectboxColumn(label="支払先銀行", options=df_supplier_master["bank_to"].unique()),
                    "note": st.column_config.TextColumn(label="特記事項"),
                    "account_name": st.column_config.SelectboxColumn(label="口座登録名", options=df_supplier_master["account_name"].unique()),
                    "updated_at": "更新日時",
                    "created_at": "作成日時",
                    "updated_by": "更新者",
                },
                hide_index=True, 
                use_container_width=True,
                key=f"{key}_data_editor"
            )
            # データ型を統一
            df_selected = df_settlement_edit[df_settlement_edit["selected"]]
            df_selected_edit = df_settlement_edit.drop(columns=["selected"])
            df_selected_edit["settlement_date"] = pd.to_datetime(df_selected_edit["settlement_date"])
            compare_cols = df_selected_edit.columns.intersection(df_settlement.columns)
            mismatch_mask = (df_selected_edit[compare_cols] != df_settlement[compare_cols]).any(axis=1)
            changed_rows = df_selected_edit[mismatch_mask].index.tolist()
            
            _st.write(f"変更された行: {len(changed_rows)}行")
            col1, col2, col3, col4 = _st.columns((1,1,1,3))
            col1.button("追加",icon=":material/add:", on_click=self.add_settlement, args=(df_supplier_master,))
            if col2.button("削除",icon=":material/delete:", key=f"{key}_delete", on_click=self.delete_settlement, args=(df_selected,)):
                pass
            

            if changed_rows:
                if col3.button("保存",icon=":material/save:", key=f"{key}_save"):
                    # 変更された行のみを更新
                    with SessionLocal() as db:
                        for idx in changed_rows:
                            if idx in df_settlement.index:
                                settlement_id = int(df_settlement.loc[idx, "id"])
                                settlement = db.query(Settlement).filter(Settlement.id == settlement_id).first()
                                if settlement:
                                    # 各列を更新
                                    for col in df_selected_edit.columns:
                                        if col != "id" and hasattr(settlement, col):
                                            value = df_selected_edit.loc[idx, col]
                                            if col in ["team_id"]:
                                                value = uuid.UUID(value)
                                            elif col in ["supplier_code"]:
                                                value = df_selected_edit.loc[idx, "supplier_name"]
                                                supplier_master = db.query(SupplierMaster).filter(SupplierMaster.supplier_name == value).first()
                                                value = supplier_master.supplier_code
                                            elif col in ["amount", "commission"]:
                                                value = int(value)
                                            setattr(settlement, col, value)
                                    settlement.updated_at = datetime.now(TZ)
                                    settlement.updated_by = self.user_name
                        db.commit()
                    _st.success("支払いを更新しました")
                    self.updated_at = datetime.now(TZ)
                    _st.rerun()

    def view(self, _st=st):
        _st.title("収支")
        df_supplier_master = self.get_supplier_master(updated_at=self.updated_at)
        df_settlement = self.get_settlement(updated_at=self.updated_at)
        
        # 月次収支推移
        _st.subheader("月次収支推移")
        df_settlement["settlement_month"] = df_settlement["settlement_date"].dt.strftime("%Y-%m")
        
        # 出金データの集計（amount + commission）
        df_outflow = df_settlement[df_settlement["settlement_type"] == "出金"].copy()
        df_outflow["total_amount"] = df_outflow["amount"] + df_outflow["commission"]
        outflow_summary = df_outflow.groupby(["settlement_month", "status"]).agg({
            "total_amount": "sum"
        }).reset_index()
        
        # 入金データの集計（amount - commission）
        df_inflow = df_settlement[df_settlement["settlement_type"] == "入金"].copy()
        df_inflow["net_amount"] = df_inflow["amount"] - df_inflow["commission"]
        inflow_summary = df_inflow.groupby(["settlement_month", "status"]).agg({
            "net_amount": "sum"
        }).reset_index()
        
        # 収支バランスの計算
        # 月別の総入金と総出金を計算
        monthly_inflow = inflow_summary.groupby("settlement_month")["net_amount"].sum().reset_index()
        monthly_outflow = outflow_summary.groupby("settlement_month")["total_amount"].sum().reset_index()
        
        # 列名を変更してからmerge
        monthly_inflow = monthly_inflow.rename(columns={"net_amount": "inflow_amount"})
        monthly_outflow = monthly_outflow.rename(columns={"total_amount": "outflow_amount"})
        
        # 収支バランス（入金 - 出金）
        monthly_balance = monthly_inflow.merge(monthly_outflow, on="settlement_month", how="outer")
        monthly_balance = monthly_balance.fillna(0)
        monthly_balance["balance"] = monthly_balance["inflow_amount"] - monthly_balance["outflow_amount"]
        
        # 月をソートして累積残高を計算
        monthly_balance = monthly_balance.sort_values("settlement_month")
        monthly_balance["cumulative_balance"] = monthly_balance["balance"].cumsum()
        
        # Plotlyでチャート作成
        import plotly.graph_objects as go
        from plotly.subplots import make_subplots
        
        fig = make_subplots(
            rows=2, cols=1,
            subplot_titles=('出金と口座残高', '入金（折れ線グラフ）'),
            vertical_spacing=0.1
        )
        
        # 出金の棒グラフ
        statuses = outflow_summary["status"].unique()
        colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7']
        
        for i, status in enumerate(statuses):
            status_data = outflow_summary[outflow_summary["status"] == status]
            fig.add_trace(
                go.Bar(
                    x=status_data["settlement_month"],
                    y=status_data["total_amount"],
                    name=f"出金-{status}",
                    marker_color=colors[i % len(colors)],
                    showlegend=True
                ),
                row=1, col=1
            )
        
        # 累積残高の折れ線グラフ（出金グラフに重ねる）
        fig.add_trace(
            go.Scatter(
                x=monthly_balance["settlement_month"],
                y=monthly_balance["cumulative_balance"],
                name="口座残高（累積）",
                mode='lines+markers',
                line=dict(color='#2E8B57', width=4, dash='dash'),
                marker=dict(size=10, symbol='diamond'),
                showlegend=True,
                yaxis='y2'  # 第2Y軸を使用
            ),
            row=1, col=1
        )
        
        # 入金の折れ線グラフ
        statuses_inflow = inflow_summary["status"].unique()
        for i, status in enumerate(statuses_inflow):
            status_data = inflow_summary[inflow_summary["status"] == status]
            fig.add_trace(
                go.Scatter(
                    x=status_data["settlement_month"],
                    y=status_data["net_amount"],
                    name=f"入金-{status}",
                    mode='lines+markers',
                    line=dict(color=colors[i % len(colors)], width=3),
                    marker=dict(size=8),
                    showlegend=True
                ),
                row=2, col=1
            )
        
        # レイアウト設定
        fig.update_layout(
            title="月次収支推移",
            height=600,
            showlegend=True,
            legend=dict(
                orientation="h",
                yanchor="bottom",
                y=1.02,
                xanchor="right",
                x=1
            )
        )
        
        # Y軸の設定
        fig.update_yaxes(title_text="出金金額（円）", row=1, col=1)
        fig.update_yaxes(title_text="口座残高（円）", row=1, col=1, secondary_y=True)
        fig.update_yaxes(title_text="入金金額（円）", row=2, col=1)
        
        # X軸の設定
        fig.update_xaxes(title_text="月", row=2, col=1)
        fig.update_xaxes(tickformat="%Y-%m", row=1, col=1)
        fig.update_xaxes(tickformat="%Y-%m", row=2, col=1)
        
        _st.plotly_chart(fig, use_container_width=True)
        
        # サマリーテーブルも表示
        _st.subheader("月次サマリー")
        col1, col2, col3 = _st.columns(3)
        
        with col1:
            _st.write("出金サマリー")
            outflow_table = outflow_summary.pivot_table(
                index="settlement_month", 
                columns="status", 
                values="total_amount", 
                fill_value=0
            ).round(0)
            _st.dataframe(outflow_table, use_container_width=True)
        
        with col2:
            _st.write("入金サマリー")
            inflow_table = inflow_summary.pivot_table(
                index="settlement_month", 
                columns="status", 
                values="net_amount", 
                fill_value=0
            ).round(0)
            _st.dataframe(inflow_table, use_container_width=True)
        
        with col3:
            _st.write("口座残高推移")
            balance_table = monthly_balance[["settlement_month", "inflow_amount", "outflow_amount", "balance", "cumulative_balance"]].copy()
            balance_table.columns = ["月", "総入金", "総出金", "月次収支", "残高"]
            balance_table = balance_table.round(0)
            _st.dataframe(balance_table, use_container_width=True)

        _st.divider()
        

        self.st_settlement_editor(df_settlement, df_supplier_master)
        self.st_supplier_master_editor(df_supplier_master)

if __name__ == "__main__":
    viewer = SupplierViewer()
    viewer.view()