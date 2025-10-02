import sys
import os

# Forzar el uso del venv correcto
venv_path = os.path.join(os.path.dirname(__file__), 'venv')
site_packages = os.path.join(venv_path, 'Lib', 'site-packages')

# Limpiar sys.path de otros venvs
sys.path = [p for p in sys.path if 'controlLife' not in p]

# Agregar nuestro site-packages al principio
if site_packages not in sys.path:
    sys.path.insert(0, site_packages)

# Ahora importar uvicorn
import uvicorn

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="127.0.0.1",
        port=8000,
        reload=True
    )