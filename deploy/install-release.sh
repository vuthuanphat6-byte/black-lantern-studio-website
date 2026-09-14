#!/bin/sh
set -eu
# Run as root after verifying archive SHA-256. No existing sites touched.
release=${1:?Pass release id}
case "$release" in *[!a-zA-Z0-9-]*|'') echo 'Invalid release id' >&2; exit 2;; esac
base=/srv/black-lantern
target="$base/releases/$release"
test -f "$target/dist/index.html"
test -f "$target/server/index.mjs"
test -x /usr/local/bin/node
if ! getent passwd blacklantern >/dev/null; then
  useradd --system --user-group --home-dir /var/lib/black-lantern --no-create-home --shell /usr/sbin/nologin blacklantern
else
  test "$(getent passwd blacklantern | cut -d: -f6)" = /var/lib/black-lantern
  test "$(getent passwd blacklantern | cut -d: -f7)" = /usr/sbin/nologin
fi
chown -R root:root "$target"
find "$target" -type d -exec chmod 755 {} +
find "$target" -type f -exec chmod 644 {} +
install -d -m 700 -o blacklantern -g blacklantern /var/lib/black-lantern
old=''
if test -L "$base/current"; then
  old=$(readlink -f "$base/current")
  case "$old" in "$base"/releases/*) ;; *) echo 'Unsafe existing release' >&2; exit 2;; esac
elif test -e "$base/current"; then
  echo 'Current exists and is not a release symlink' >&2; exit 2
fi
if test -e /etc/systemd/system/black-lantern.service; then
  cmp "$target/deploy/black-lantern.service" /etc/systemd/system/black-lantern.service || { echo 'Unit differs; review before replacing' >&2; exit 2; }
else
  install -o root -g root -m 644 "$target/deploy/black-lantern.service" /etc/systemd/system/black-lantern.service
fi
ln -s "$target" "$base/current.next"
mv -Tf "$base/current.next" "$base/current"
systemctl daemon-reload
systemctl enable black-lantern.service
systemctl restart black-lantern.service
attempt=0
until curl --fail --silent http://127.0.0.1:4280/api/health; do
  attempt=$((attempt + 1))
  if test "$attempt" -ge 10; then
    if test -n "$old"; then
      ln -s "$old" "$base/current.rollback"
      mv -Tf "$base/current.rollback" "$base/current"
      systemctl restart black-lantern.service
    else
      systemctl stop black-lantern.service
    fi
    echo 'New release unhealthy; old restored if available' >&2
    exit 1
  fi
  sleep 1
done
printf '\nRelease ready: %s\n' "$release"
