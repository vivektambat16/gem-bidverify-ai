"""Checks app/main.py without FastAPI installed: imports it against tiny stand-ins, confirms every
URL the frontend calls is registered, and runs several handlers directly.
(The real FastAPI behaviour is verified on your laptop with `uvicorn`.)"""
import os, re, sys, types, tempfile
from pathlib import Path

os.environ["GEM_DATA_DIR"] = tempfile.mkdtemp(prefix="gemroutes_")
ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
ROUTES = []

def mod(name, **attrs):
    m = types.ModuleType(name); m.__dict__.update(attrs); sys.modules[name] = m; return m

class FastAPI:
    def __init__(self, **kw): pass
    def _reg(self, method):
        def deco_factory(path, **kw):
            def deco(fn): ROUTES.append((method, path, fn)); return fn
            return deco
        return deco_factory
    def __getattr__(self, name):
        if name in ("get", "post", "put", "delete"): return self._reg(name.upper())
        raise AttributeError(name)
    def add_middleware(self, *a, **k): pass
    def on_event(self, ev): return lambda fn: fn
    def exception_handler(self, exc): return lambda fn: fn

class BaseModel:
    def __init__(self, **kw):
        for k in getattr(self.__class__, "__annotations__", {}):
            setattr(self, k, kw.get(k, getattr(self.__class__, k, None)))
    def dict(self): return {k: getattr(self, k) for k in self.__class__.__annotations__}

mod("fastapi", FastAPI=FastAPI, Depends=lambda f=None: f, File=lambda *a, **k: None, Form=lambda *a, **k: None,
    Header=lambda *a, **k: None, Query=lambda *a, **k: None, Request=object, UploadFile=object)
mod("fastapi.middleware"); mod("fastapi.middleware.cors", CORSMiddleware=object)
mod("fastapi.responses", FileResponse=object, JSONResponse=object)
mod("pydantic", BaseModel=BaseModel)

from app import main, db, services  # noqa: E402
db.init_db()
print(f"{len(ROUTES)} routes registered")

frontend = (ROOT.parent / "src" / "api" / "mockApi.js").read_text(encoding="utf-8")
called = set(re.findall(r"\$\{API_BASE\}(/[a-z0-9/_\-\$\{\}\.]*)", frontend))
norm = lambda p: re.sub(r"\$\{[^}]*\}|\{[^}]*\}", "{}", "/api" + p.split("?")[0])
have = {re.sub(r"\{[^}]*\}", "{}", p) for _, p, _ in ROUTES}
missing = sorted(n for n in {norm(c) for c in called} if n not in have)
print("frontend paths:", sorted({norm(c) for c in called}))
print("MISSING:", missing)
assert not missing, missing

class Req:  # request stand-in
    client = types.SimpleNamespace(host="127.0.0.1")

sess = main.login(main.LoginIn(username="officer", password="demo123"), Req())
user = services.user_from_token(sess["access_token"])
assert main.dashboard(user)["total_tenders"] == 2
assert len(main.list_bids(None, user)) == 3
assert main.get_bid("1", user)["bid_id"].startswith("BID/")
assert main.test_gst("08BHART9999K1Z8", user)["status"] == "SUSPENDED"
assert main.test_debarment("Bharat Systems", "", user)["severity"] == "CRITICAL"
assert main.audit_verify(user)["valid"]
assert main.me(user)["username"] == "officer"
try:
    main.current_user(None); raise SystemExit("auth should be required")
except services.ServiceError as e:
    assert e.status == 401
assert main.current_user("Bearer " + sess["access_token"])["username"] == "officer"
print("route handlers OK")
