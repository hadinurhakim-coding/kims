#!/bin/bash
PORTS=(3000 8080 8081)

for port in "${PORTS[@]}"; do
  PID=$(lsof -ti tcp:$port)
  if [ -n "$PID" ]; then
    echo "Killing PID $PID on port $port"
    kill -9 $PID
  else
    echo "No process found on port $port"
  fi
done

echo "Done. Ports checked: ${PORTS[*]}"
