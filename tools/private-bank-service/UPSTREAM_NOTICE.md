# Supabase fixture attribution

The ten original Supabase configuration and initialization files embedded in `upstream-observation.json` are reproduced byte-for-byte from commit `8c7a4d9dbbaf8b552893822e89d7bf06f33f9220` of [supabase/supabase](https://github.com/supabase/supabase/tree/8c7a4d9dbbaf8b552893822e89d7bf06f33f9220), under the accompanying Apache License 2.0. Their original paths, Git blob identities and hashes are recorded in `source-pins.json`.

Copyright 2024 Supabase. The accompanying `UPSTREAM_LICENSE.txt` reproduces that revision's LICENSE (Git blob `49ea124025275674563eeff03af0f653ca49fdc0`). The root and Docker directory trees at that revision contain no separate NOTICE file.

ECHS's `fixture_config.py` is an adapted, isolated configuration: it selects five services, uses synthetic credentials and fresh resources, binds only loopback ports, closes container egress, and records image identities. The original embedded files retain their notices and content. This attribution does not change the licensing of unrelated ECHS files.
