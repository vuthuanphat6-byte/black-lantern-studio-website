# Black Lantern Studio

Website tiếng Việt của studio game độc lập Black Lantern Studio: https://blacklantern.games.

## Chạy và kiểm tra

Yêu cầu Node.js >=22.12; dùng bản LTS đang được hỗ trợ.

```sh
npm ci
npm run build
npm test
npm run preview
```

Preview tại http://127.0.0.1:4321. `npm run dev` dành cho giao diện; kiểm tra form bằng production preview. Server nhận biến môi trường như `.env.example`, không tự nạp file .env.

## Cấu trúc

- `src/pages`: trang chủ, trò chơi, dự án, studio, tin tức, bài viết, báo chí, liên hệ, riêng tư, 404.
- `src/content/news`: nội dung Markdown và schema frontmatter.
- `src/assets`: logo gốc và tranh minh họa, tối ưu responsive bằng Astro.
- `server`: HTTP server và API liên hệ không phụ thuộc package runtime.
- `tests`: validation, HTTP, lưu dữ liệu và khởi động lại.
- `scripts/verify-build.mjs`: metadata, H1, structured data, liên kết nội bộ.
- `deploy`: service non-root và cài đặt release có rollback.

## SEO và dữ liệu

HTML dựng sẵn, canonical, sitemap, robots, Open Graph, JSON-LD và font tự host. Không tracker quảng cáo. Không cam kết thứ hạng hoặc thời điểm index.

Form **lưu lời nhắn vào hộp thư riêng trên host, không tự gửi email**. Tự hết hạn sau 30 ngày; giới hạn 5 lần gửi/IP/giờ. Người vận hành đọc qua SSH theo [hướng dẫn](docs/OPERATIONS.md). Email công khai có liên kết trực tiếp.

## Phát hành an toàn

Kiểm tra `.gitignore` trước push: không commit `.env`, khóa, chứng chỉ, token, dữ liệu liên hệ hoặc backup. Build, test và `npm audit --audit-level=high` phải qua trước release. Chỉ gói dist, server, công cụ inbox và cấu hình triển khai; không đưa node_modules hay dữ liệu local lên production.

Xem [vận hành](docs/OPERATIONS.md) và [nguồn tài sản](docs/ASSETS.md). Dự án game chưa công bố; tranh minh họa không phải gameplay. Không thêm lịch ra mắt, giải thưởng hoặc số người chơi chưa được xác nhận.
