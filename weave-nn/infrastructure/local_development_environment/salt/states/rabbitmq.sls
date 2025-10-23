# RabbitMQ Docker container setup for Weave-NN

rabbitmq_container:
  docker_container.running:
    - name: rabbitmq
    - image: {{ pillar['weave_nn']['rabbitmq']['docker_image'] }}
    - port_bindings:
      - {{ pillar['weave_nn']['rabbitmq']['ports']['amqp'] }}:5672
      - {{ pillar['weave_nn']['rabbitmq']['ports']['management'] }}:15672
    - restart_policy: always
    - environment:
      - RABBITMQ_DEFAULT_USER: admin
      - RABBITMQ_DEFAULT_PASS: changeme
    - require:
      - service: docker_service

# Wait for RabbitMQ to be ready
wait_for_rabbitmq:
  cmd.run:
    - name: |
        for i in {1..30}; do
          if docker exec rabbitmq rabbitmqctl status > /dev/null 2>&1; then
            exit 0
          fi
          sleep 2
        done
        exit 1
    - require:
      - docker_container: rabbitmq_container

# Create exchange
{% for exchange in pillar['weave_nn']['rabbitmq']['exchanges'] %}
rabbitmq_exchange_{{ exchange['name'] }}:
  cmd.run:
    - name: |
        docker exec rabbitmq rabbitmqadmin declare exchange \
          name={{ exchange['name'] }} \
          type={{ exchange['type'] }} \
          durable={{ 'true' if exchange['durable'] else 'false' }}
    - unless: docker exec rabbitmq rabbitmqadmin list exchanges | grep {{ exchange['name'] }}
    - require:
      - cmd: wait_for_rabbitmq
{% endfor %}

# Create queues and bindings
{% for queue in pillar['weave_nn']['rabbitmq']['queues'] %}
rabbitmq_queue_{{ queue['name'] }}:
  cmd.run:
    - name: |
        docker exec rabbitmq rabbitmqadmin declare queue \
          name={{ queue['name'] }} \
          durable={{ 'true' if queue['durable'] else 'false' }}
    - unless: docker exec rabbitmq rabbitmqadmin list queues | grep {{ queue['name'] }}
    - require:
      - cmd: wait_for_rabbitmq

{% for routing_key in queue['routing_keys'] %}
rabbitmq_binding_{{ queue['name'] }}_{{ loop.index }}:
  cmd.run:
    - name: |
        docker exec rabbitmq rabbitmqadmin declare binding \
          source=weave-nn.events \
          destination={{ queue['name'] }} \
          routing_key={{ routing_key }}
    - require:
      - cmd: rabbitmq_queue_{{ queue['name'] }}
      - cmd: rabbitmq_exchange_weave-nn.events
{% endfor %}
{% endfor %}

# Create RabbitMQ management notice
rabbitmq_notice:
  file.managed:
    - name: {{ pillar['weave_nn']['user']['home'] }}/weave-nn/RABBITMQ-ACCESS.txt
    - user: {{ pillar['weave_nn']['user']['name'] }}
    - group: {{ pillar['weave_nn']['user']['name'] }}
    - mode: 644
    - contents: |
        # RabbitMQ Management Console

        URL: http://localhost:15672
        Username: admin
        Password: changeme

        AMQP Connection:
        Host: localhost
        Port: 5672

        ## Queues Created:
        {% for queue in pillar['weave_nn']['rabbitmq']['queues'] %}
        - {{ queue['name'] }}
        {% endfor %}

        ## Management Commands:

        # List exchanges:
        docker exec rabbitmq rabbitmqadmin list exchanges

        # List queues:
        docker exec rabbitmq rabbitmqadmin list queues

        # List bindings:
        docker exec rabbitmq rabbitmqadmin list bindings

        # Publish test message:
        docker exec rabbitmq rabbitmqadmin publish \
          exchange=weave-nn.events \
          routing_key=vault.file.created \
          payload='{"test": "message"}'
    - require:
      - docker_container: rabbitmq_container
