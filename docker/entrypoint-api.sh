#!/bin/bash
set -e

echo "Starting Weave-NN API Server..."

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

# Run database migrations if needed
if [ "$ENVIRONMENT" = "production" ]; then
    echo "Running database migrations..."
    # alembic upgrade head || true
fi

# Start application
echo "Starting application..."
exec "$@"
