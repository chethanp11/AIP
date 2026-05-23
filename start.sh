#!/usr/bin/env bash
set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$APP_DIR"

PYTHON_BIN="${PYTHON_BIN:-python3}"
VENV_DIR="${VENV_DIR:-.venv}"
HOST="${HOST:-127.0.0.1}"
PORT="${PORT:-8000}"

if ! command -v "$PYTHON_BIN" >/dev/null 2>&1; then
  echo "Python executable not found: $PYTHON_BIN" >&2
  echo "Install Python 3, or run with: PYTHON_BIN=/path/to/python ./start.sh" >&2
  exit 1
fi

if [ ! -d "$VENV_DIR" ]; then
  echo "Creating virtual environment: $VENV_DIR"
  "$PYTHON_BIN" -m venv "$VENV_DIR"
fi

# shellcheck disable=SC1091
source "$VENV_DIR/bin/activate"

echo "Using Python: $(python --version)"
if python -c "import fastapi, uvicorn, pydantic" >/dev/null 2>&1; then
  echo "Python dependencies already available."
else
  echo "Preparing Python dependencies..."
  python -m pip install --upgrade pip setuptools wheel
  python -m pip install --prefer-binary -r requirements.txt
fi

echo "Starting AIP at http://$HOST:$PORT"
if [ "${AIP_DEV_RELOAD:-}" = "1" ]; then
  exec python -m uvicorn src.main:app --host "$HOST" --port "$PORT" --reload
fi

exec python -m uvicorn src.main:app --host "$HOST" --port "$PORT"
