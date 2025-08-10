import streamlit as st

from models.viewer import Viewer

class MemberViewer(Viewer):
    def view(self, _st=st):
        _st.title("メンバー")
        _st.write("Hello World")

if __name__ == "__main__":
    viewer = MemberViewer()
    viewer.view()