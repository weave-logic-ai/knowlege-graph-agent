#!/bin/bash
set -e

echo "Starting Weave-NN MCP Server..."

# Wait for dependent services
echo "Waiting for RabbitMQ..."
until curl -f http://${RABBITMQ_HOST:-rabbitmq}:15672/api/healthchecks/node 2>/dev/null; do
    echo "RabbitMQ is unavailable - sleeping"
    sleep 2
done
echo "RabbitMQ is up!"

echo "Waiting for Redis..."
until redis-cli -h ${REDIS_HOST:-redis} -p ${REDIS_PORT:-6379} ping 2>/dev/null; do
    echo "Redis is unavailable - sleeping"
    sleep 2
done
echo "Redis is up!"

# Initialize MCP data directory
if [ ! -d "/app/data/agents" ]; then
    echo "Initializing MCP data directory..."
    mkdir -p /app/data/{agents,sessions,logs}
fi

# Start MCP server
echo "Starting MCP server..."
exec "$@"
