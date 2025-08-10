import streamlit as st
from datetime import datetime
from models.config import TEAM_NAME, TEAM_ID, DEBUG

# st.set_page_config(page_title="ダッシュボード", layout="wide")


class Viewer:
    """
    ダッシュボードの表示を管理するクラス
    """

    session_state = st.session_state

    def __init__(self, _st=st):
        self._updated_at = None
        self.st = _st
        # self.st.logo(image="./src/images/logo.png", size="large")
        self.__class__.session_state.setdefault("authentication_status", None)
        if DEBUG:
            if self.st.sidebar.button("デバッグモード"):
                self.updated_at = datetime.now()
            if self.st.sidebar.button("cache clear"):
                self.st.cache_data.clear()


    @property
    def auth_status(self):
        return self.__class__.session_state.get("authentication_status", None)

    @property
    def team_id(self):
        return self.__class__.session_state.setdefault("team_id", TEAM_ID)

    @property
    def team_name(self):
        return self.__class__.session_state.setdefault("team_name", TEAM_NAME)

    @property
    def user_id(self):
        return self.__class__.session_state.setdefault("user_id", "test_user")

    @property
    def user_name(self):
        return self.__class__.session_state.setdefault("username", "test_user")

    @property
    def updated_at(self):
        return self.__class__.session_state.setdefault("updated_at", None)

    @updated_at.setter
    def updated_at(self, value):
        self.__class__.session_state["updated_at"] = value

    @classmethod
    def set_session(cls, key, value):
        cls.session_state[key] = value

    @classmethod
    def get_session(cls, key, default=None):
        return cls.session_state.setdefault(key, default)

    @classmethod
    def del_session(cls, key):
        del cls.session_state[key]

    def view(self):
        raise NotImplementedError("viewメソッドを実装してください")
