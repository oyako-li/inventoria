from models.config import DIR_SQL
import re

class Query:
    def __init__(self, _query: str) -> None:
        self._query = _query
        self.__update()

    def __update(self) -> None:
        matches = re.findall(r"\{([^ ]+?)\}", self._query)
        for match in matches:
            setattr(self, match, None)

    def __str__(self) -> str:
        return self._query.format(
            **{key: getattr(self, key) for key in self.get_query_params()}
        )

    def __getitem__(self, key: str):
        return getattr(self, key)

    def __setitem__(self, key, value):
        setattr(self, key, value)

    def __repr__(self) -> str:
        return self.__str__()

    @property
    def key(self):
        return self.keys()

    @property
    def value(self):
        return self.values()

    @property
    def query(self):
        return self.__repr__()

    @classmethod
    def load_query(cls, _query_name: str, _dir=DIR_SQL) -> "Query":
        with open(f"{_dir}/{_query_name}.sql", "r") as f:
            return cls(f.read())

    @classmethod
    def save_query(cls, _query: str, _query_name: str, _dir: str = DIR_SQL) -> None:
        with open(f"{_dir}/{_query_name}.sql", "w") as f:
            f.write(_query)

    def get_query_params(self):
        yield from (key for key in self.__dict__ if not key.startswith("_"))

    def format(self, *args, **kwargs) -> str:
        return self._query.format(*args, **kwargs)

    def keys(self) -> list:
        return list(self.get_query_params())

    def values(self) -> list:
        return [getattr(self, key) for key in self.get_query_params()]

    def items(self) -> list:
        return [(key, getattr(self, key)) for key in self.get_query_params()]
