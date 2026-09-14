# Vận hành production

## Kiến trúc

Cloudflare HTTPS → tunnel hiện có → HTTP loopback 127.0.0.1:4280 → service `black-lantern` chạy user riêng. Không mở port public, không chỉnh nginx hoặc site khác. HTTPS kết thúc ở Cloudflare; tunnel về host được mã hóa.

Code root-owned trong `/srv/black-lantern/releases/<id>`; `current` trỏ bản đang chạy. User app không được sửa code. `/var/lib/black-lantern` riêng tư mode 0700, không thuộc webroot/repo. RAM 256 MB, CPU 50%, tối đa 64 tác vụ.

Runtime riêng: `/srv/black-lantern/runtime/node-v24.21.0-linux-x64/bin/node`, tải từ https://nodejs.org/dist/v24.21.0/ và xác minh SHA-256 theo manifest chính thức. Không thay Node global của host. Runtime archive SHA-256: `fd8e59d5a511510f6a298afb548f18c7d2b1be404d8b4a27d94fbe49f56cb2d6`. HTTP qua tunnel được chuyển 308 về HTTPS cùng path/query. Local preview có X-Robots-Tag noindex.

## Release

1. Kiểm tra `.gitignore` và secrets trước push. Build/test/audit phải qua.
2. Gói dist, server, scripts/inbox.mjs, deploy; tính SHA-256. Upload SSH vào staging riêng và đối chiếu hash.
3. Giải nén vào release mới, không ghi đè bản cũ. Chạy `sh deploy/install-release.sh <id>` từ bản mới bằng quyền quản trị. Unit khác bản chuẩn sẽ bị từ chối; health check thất bại sẽ rollback nếu có bản trước.
4. Kiểm tra HTTPS từ ngoài, route, sitemap, form, 404, headers. Chỉ thêm hostname website này vào tunnel, giữ nguyên route khác.

Không commit IP host riêng, khóa SSH, token tunnel hoặc cấu hình tài khoản Cloudflare. Không cấp sudo rộng cho user app.

## Kiểm tra

```sh
systemctl status black-lantern --no-pager
curl --fail http://127.0.0.1:4280/api/health
journalctl -u black-lantern --since '1 hour ago' --no-pager
systemctl restart black-lantern
```

Log chỉ mã lời nhắn/lỗi tổng quát, không ghi email hoặc nội dung. Service tự chạy theo máy, tự restart khi lỗi. Uptime còn phụ thuộc điện, mạng, host và tunnel.

## Hộp thư

Chỉ quản trị SSH đọc được; không có admin public hoặc SMTP ở bản này.

```sh
sudo -u blacklantern /srv/black-lantern/runtime/node-v24.21.0-linux-x64/bin/node /srv/black-lantern/current/scripts/inbox.mjs
sudo -u blacklantern /srv/black-lantern/runtime/node-v24.21.0-linux-x64/bin/node /srv/black-lantern/current/scripts/inbox.mjs BL-UUID-CUA-LOI-NHAN
```

Lệnh đầu liệt kê mã/thời gian/chủ đề; lệnh sau dùng UUID thật để đọc và phản hồi bằng email studio. Không copy dữ liệu vào issue công khai/log CI. Dữ liệu tự xóa sau 30 ngày, dọn mỗi giờ.

## Khôi phục

Giữ release cũ. Xác minh đường dẫn bản trước dưới `/srv/black-lantern/releases/`, đổi `current` qua symlink tạm và rename nguyên tử; restart rồi health check. Không xóa hàng loạt. Mã nguồn/lockfile trên GitHub và archive đã hash ở máy dev dùng để rebuild/khôi phục. Không backup liên hệ ngoài host ở bản ra mắt; nếu cần phải dùng kho mã hóa riêng, lưu tối đa 30 ngày và thử restore.

## SEO và nội dung

Kiểm tra sitemap-index.xml và robots.txt. Chủ domain xác minh Search Console và gửi sitemap. Google quyết định thời điểm index/thứ hạng; đo Core Web Vitals khi có dữ liệu thực, không suy ra từ Lighthouse lab.

Thêm Markdown ở `src/content/news` theo schema; dùng draft khi chưa công bố. Build/test trước phát hành. Chỉ bổ sung tên game, nền tảng/ngày ra mắt sau xác nhận của studio.
