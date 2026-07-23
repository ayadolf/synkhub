from sqlalchemy import create_engine, event
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.config import DATABASE_URL, PRODUCTION

connect_args = {}
engine_kwargs = {
    "pool_pre_ping": True,
    "pool_recycle": 300,
    "pool_timeout": 30,
}

if PRODUCTION:
    engine_kwargs["pool_size"] = 5
    engine_kwargs["max_overflow"] = 5
    connect_args["sslmode"] = "require"
else:
    engine_kwargs["pool_size"] = 20
    engine_kwargs["max_overflow"] = 20

engine = create_engine(DATABASE_URL, connect_args=connect_args, **engine_kwargs)

@event.listens_for(engine, "connect")
def set_session_params(dbapi_conn, connection_record):
    cursor = dbapi_conn.cursor()
    cursor.execute("SET lock_timeout = '5s'")
    cursor.execute("SET statement_timeout = '30s'")
    cursor.close()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
