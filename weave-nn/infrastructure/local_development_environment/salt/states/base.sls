# Base system packages required for Weave-NN development

base_packages:
  pkg.installed:
    - pkgs:
      - curl
      - wget
      - git
      - build-essential
      - software-properties-common
      - apt-transport-https
      - ca-certificates
      - gnupg
      - lsb-release
      - unzip
      - jq
      - sqlite3
      - fuse
      - libfuse2

# Create project directory
weave_nn_directory:
  file.directory:
    - name: {{ pillar['weave_nn']['user']['home'] }}/weave-nn
    - user: {{ pillar['weave_nn']['user']['name'] }}
    - group: {{ pillar['weave_nn']['user']['name'] }}
    - mode: 755
    - makedirs: True
    - require:
      - pkg: base_packages

# Ensure user has necessary permissions
user_groups:
  user.present:
    - name: {{ pillar['weave_nn']['user']['name'] }}
    - groups:
      - docker
    - remove_groups: False
    - require:
      - pkg: base_packages
