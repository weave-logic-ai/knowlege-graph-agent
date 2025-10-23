# Obsidian AppImage installation for Weave-NN

download_obsidian:
  cmd.run:
    - name: curl -L {{ pillar['weave_nn']['obsidian']['appimage_url'] }} -o {{ pillar['weave_nn']['user']['home'] }}/Obsidian.AppImage
    - creates: {{ pillar['weave_nn']['user']['home'] }}/Obsidian.AppImage
    - runas: {{ pillar['weave_nn']['user']['name'] }}
    - require:
      - pkg: base_packages

make_obsidian_executable:
  file.managed:
    - name: {{ pillar['weave_nn']['user']['home'] }}/Obsidian.AppImage
    - mode: 755
    - user: {{ pillar['weave_nn']['user']['name'] }}
    - group: {{ pillar['weave_nn']['user']['name'] }}
    - require:
      - cmd: download_obsidian

# Create .desktop file for application launcher
obsidian_desktop_file:
  file.managed:
    - name: {{ pillar['weave_nn']['user']['home'] }}/.local/share/applications/obsidian.desktop
    - user: {{ pillar['weave_nn']['user']['name'] }}
    - group: {{ pillar['weave_nn']['user']['name'] }}
    - mode: 644
    - makedirs: True
    - contents: |
        [Desktop Entry]
        Name=Obsidian
        Exec={{ pillar['weave_nn']['user']['home'] }}/Obsidian.AppImage
        Icon=obsidian
        Type=Application
        Categories=Office;
    - require:
      - file: make_obsidian_executable

# Create Obsidian configuration directory
obsidian_config_dir:
  file.directory:
    - name: {{ pillar['weave_nn']['user']['home'] }}/weave-nn/.obsidian
    - user: {{ pillar['weave_nn']['user']['name'] }}
    - group: {{ pillar['weave_nn']['user']['name'] }}
    - mode: 755
    - makedirs: True
    - require:
      - file: weave_nn_directory

# Note: Obsidian plugins must be installed manually via Community Plugins UI
# See: infrastructure/salt/files/obsidian-plugins/MANUAL-INSTALL.md
obsidian_plugin_notice:
  file.managed:
    - name: {{ pillar['weave_nn']['user']['home'] }}/weave-nn/.obsidian/PLUGIN-INSTALL-REQUIRED.md
    - user: {{ pillar['weave_nn']['user']['name'] }}
    - group: {{ pillar['weave_nn']['user']['name'] }}
    - mode: 644
    - contents: |
        # Obsidian Plugins - Manual Installation Required

        SaltStack has prepared your environment, but Obsidian Community Plugins
        require manual installation through the Obsidian UI.

        ## Required Plugins:

        1. **obsidian-local-rest-api** (CRITICAL)
           - Settings → Community Plugins → Browse → Search "Local REST API"
           - Install and Enable
           - Generate API key and save to ~/weave-nn/.env

        2. **obsidian-tasks-plugin** (CRITICAL)
           - Search "Tasks" by Martin Schenck
           - Install and Enable

        3. **obsidian-mehrmaid** (CRITICAL)
           - Search "Mehrmaid"
           - Install and Enable

        4. **obsidian-advanced-uri** (Optional fallback)
           - Search "Advanced URI"
           - Install and Enable

        ## Next Steps:

        After installing plugins:
        1. Follow: ~/weave-nn/_planning/TASKS-SETUP-GUIDE.md
        2. Configure REST API key in .env
        3. Test API: curl https://localhost:27124/vault/ -H "Authorization: Bearer YOUR_KEY" -k

        See full guide: ~/weave-nn/infrastructure/developer-onboarding.md
    - require:
      - file: obsidian_config_dir
