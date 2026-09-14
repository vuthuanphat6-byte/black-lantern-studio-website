# Quyết định kiến trúc — 14/09/2026

## Website

Astro + TypeScript + content collections, xuất HTML tĩnh. Ít JavaScript: menu mobile, bộ lọc tin, gallery và submit form. Font tự host, ảnh WebP responsive. Nội dung quản lý Markdown trong Git; không mở CMS/admin public ở bản ra mắt.

## Thay đổi so với phương án kế hoạch

Kế hoạch đầu dùng static hosting + serverless form. Chủ dự án sau đó chỉ định host riêng, yêu cầu code/test local trước deploy. Vì vậy bản ra mắt dùng HTML tĩnh và HTTP server Node built-in trên host riêng, đi qua Cloudflare Tunnel. Không phụ thuộc nền tảng hosting SaaS hoặc cài package runtime trên host.

Chưa có cấu hình nhà cung cấp email. Form được triển khai thành hộp thư bền vững riêng tư, không giả lập gửi email thành công. UI thông báo đã tiếp nhận, quản trị đọc qua SSH và phản hồi bằng email chính thức. Tích hợp SMTP/transational email là nâng cấp riêng khi có tài khoản gửi và cấu hình xác thực domain, không sử dụng thông tin đăng nhập từ dự án khác.

Chỉ tiếng Việt ở bản ra mắt. Dự án game chưa có tên, nền tảng/lịch phát hành xác nhận, nên hiển thị định hướng và ghi rõ tranh concept. Không dùng tên game hoặc thành tích bịa từ mockup.

## Ranh giới an toàn

- Code immutable theo release, root-owned. App chạy non-root, chỉ ghi StateDirectory.
- Chỉ listen loopback; không mở inbound port mới hoặc thay reverse proxy của site khác.
- Runtime Node 24.21.0 riêng, bản chính thức xác minh SHA-256. Không sửa Node global.
- Secrets/dữ liệu vận hành bị loại khỏi Git trước push; proof Google Search Console là dữ liệu công khai phải hiện trong HTML, không phải API credential.
- Form validate server-side, body giới hạn, origin check, honeypot và rate limit lưu qua restart. Lưu dữ liệu 30 ngày.
- CSP không dùng unsafe-inline; hash theo HTML thực. Cache-Control no-transform ngăn proxy chèn analytics làm lệch chính sách, theo https://developers.cloudflare.com/web-analytics/faq/.
- HTTP chuyển 308 sang canonical HTTPS qua trusted proxy. Preview local noindex.

Chính sách runtime LTS tham chiếu https://nodejs.org/en/about/previous-releases. Không có cơ chế đảm bảo uptime tuyệt đối; điện, mạng, host và tunnel vẫn cần quản trị.
