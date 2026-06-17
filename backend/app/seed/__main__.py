from app.database import SessionLocal, init_db
from app.seed.loaders import (
    seed_categorias,
    seed_geojsons,
    seed_horarios,
    seed_linhas,
    seed_qrcodes_demo,
    seed_usuarios,
)


def main() -> None:
    init_db()
    db = SessionLocal()
    try:
        categorias = seed_categorias(db)
        print(f"categorias: {len(categorias)}")

        linhas = seed_linhas(db, categorias)
        print(f"linhas: {len(linhas)}")

        seed_horarios(db, linhas)
        print("horarios ok")

        seed_geojsons(db, linhas)
        print("geojsons ok")

        usuarios = seed_usuarios(db)
        print(f"usuarios: {len(usuarios)}")

        seed_qrcodes_demo(db, usuarios, linhas)
        print("qrcodes demo ok")

        db.commit()
        print("[OK] seed concluido")
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
