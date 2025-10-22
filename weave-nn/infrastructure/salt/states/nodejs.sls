# Node.js environment setup for Weave-NN

nodejs_repo_key:
  cmd.run:
    - name: curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /usr/share/keyrings/nodesource.gpg
    - creates: /usr/share/keyrings/nodesource.gpg

nodejs_repo:
  pkgrepo.managed:
    - name: deb [signed-by=/usr/share/keyrings/nodesource.gpg] https://deb.nodesource.com/node_{{ pillar['weave_nn']['nodejs']['version'] }}.x nodistro main
    - file: /etc/apt/sources.list.d/nodesource.list
    - require:
      - cmd: nodejs_repo_key

nodejs_packages:
  pkg.installed:
    - pkgs:
      - nodejs
    - require:
      - pkgrepo: nodejs_repo

npm_global_packages:
  npm.installed:
    - pkgs:
      - npm@latest
    - require:
      - pkg: nodejs_packages
