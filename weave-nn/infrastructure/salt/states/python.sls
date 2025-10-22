# Python environment setup for Weave-NN

python_repo:
  pkgrepo.managed:
    - name: ppa:deadsnakes/ppa
    - dist: {{ grains['lsb_distrib_codename'] }}
    - file: /etc/apt/sources.list.d/deadsnakes-ppa.list
    - require_in:
      - pkg: python_packages

python_packages:
  pkg.installed:
    - pkgs:
      - python{{ pillar['weave_nn']['python']['version'] }}
      - python{{ pillar['weave_nn']['python']['version'] }}-venv
      - python{{ pillar['weave_nn']['python']['version'] }}-dev
      - python3-pip

# Create Python virtual environment
python_venv:
  cmd.run:
    - name: python{{ pillar['weave_nn']['python']['version'] }} -m venv {{ pillar['weave_nn']['python']['venv_path'] }}
    - creates: {{ pillar['weave_nn']['python']['venv_path'] }}
    - runas: {{ pillar['weave_nn']['user']['name'] }}
    - require:
      - pkg: python_packages
      - file: weave_nn_directory

# Upgrade pip in venv
upgrade_pip:
  cmd.run:
    - name: {{ pillar['weave_nn']['python']['venv_path'] }}/bin/pip install --upgrade pip setuptools wheel
    - runas: {{ pillar['weave_nn']['user']['name'] }}
    - require:
      - cmd: python_venv
