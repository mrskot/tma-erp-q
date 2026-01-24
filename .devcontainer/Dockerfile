# Заменяем общую версию на конкретную (Bookworm — самая стабильная сейчас)
FROM mcr.microsoft.com/devcontainers/javascript-node:20-bookworm

RUN apt-get update && apt-get install -y git curl

WORKDIR /workspace