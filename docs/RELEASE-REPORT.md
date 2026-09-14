# Báo cáo bàn giao Black Lantern Studio

Ngày nghiệm thu: 14/09/2026, múi giờ Việt Nam.

## Kết quả

- Website production: https://blacklantern.games/ — HTTPS trả 200, HTTP chuyển 308 về HTTPS cùng đường dẫn/query.
- Repository: https://github.com/vuthuanphat6-byte/black-lantern-studio-website.
- Mã release ứng dụng: `0a3f2c7`, gói `20260914-r3`. Các commit sau chỉ cập nhật tài liệu nếu không ghi khác.
- Đúng thứ tự: code và kiểm thử local trước, sau đó mới upload/cài service trên host và nối domain.
- Hoàn thành 11 trang public và trang lỗi 404, theo nhận diện logo gốc và phong cách game Việt Nam.

## Phạm vi giao diện và nội dung

Trang chủ, danh sách trò chơi, chi tiết định hướng dự án, giới thiệu studio, danh sách tin có bộ lọc, ba bài viết, báo chí có logo/factsheet/ZIP tải thật, liên hệ và chính sách riêng tư. Menu mobile, gallery mở ảnh lớn/Escape, focus bàn phím, trạng thái thành công/lỗi của form. Không hiển thị nút tải game, lịch phát hành hoặc thành tích chưa có thật.

## SEO

HTML dựng sẵn, title/description theo trang, canonical HTTPS, ngôn ngữ vi, Open Graph, sitemap-index/sitemap-0, robots, Organization/WebSite/BreadcrumbList/BlogPosting có dữ liệu phù hợp nội dung. Trang lỗi trả 404; API không index. Local preview có X-Robots-Tag noindex.

Google Search Console đã xác minh quyền sở hữu URL-prefix `https://blacklantern.games/` bằng thẻ HTML theo tài khoản chủ dự án duyệt. Sitemap-index.xml đã được gửi và Google hiển thị **Đã xử lý chỉ mục sơ đồ trang web thành công**. Google chưa có dữ liệu lập chỉ mục/hiệu suất ngay lúc tạo property; không cam kết thời điểm index hoặc thứ hạng.

Live URL test lúc 08:49 ngày 14/09/2026: Googlebot xác nhận **Google có thể lập chỉ mục URL này / Trang có thể lập chỉ mục**. Đây là kiểm tra thực từ Google, khác với việc giả lập User-Agent bằng curl.

## Bằng chứng kiểm thử

- Build: 12 HTML qua kiểm tra title, description, canonical, một H1, JSON-LD hợp lệ, liên kết/asset nội bộ.
- 11 kiểm thử tự động: validation, header injection, honeypot, giới hạn dữ liệu, cross-origin, method, lưu lời nhắn, rate limit qua restart, 404 và redirect HTTPS.
- CI GitHub qua build/test/audit trên Linux: https://github.com/vuthuanphat6-byte/black-lantern-studio-website/actions/runs/34796697764.
- npm audit: không phát hiện vulnerability tại thời điểm nghiệm thu. Đây không phải bảo đảm không có lỗ hổng chưa công bố.
- Crawl production: 11 URL từ sitemap và 13 tài nguyên/endpoint chính trả đúng trạng thái; có 404 thực và redirect 308. Không còn beacon analytics bị chèn vào HTML.
- Browser QA Chromium: desktop và mobile 390px, menu, tin lọc, gallery/Escape, form thành công; không thấy ảnh hỏng hoặc tràn ngang trong các view kiểm tra. Chưa kiểm tra trên thiết bị Safari/iOS vật lý.
- Form production nhận lời nhắn kiểm thử, file mode 0600 và vẫn còn sau đổi release/restart.
- Host chạy user riêng, code không ghi được bởi user app; thư mục dữ liệu 0700. Service enabled/active, không restart do lỗi tại thời điểm kiểm tra.

### Lighthouse mobile

| Trang / môi trường | Performance | Accessibility | Best practices | SEO |
| --- | ---: | ---: | ---: | ---: |
| Trang chủ — production bản cuối | 97 | 100 | 100 | 100 |
| Bài Black Lantern Studio — production bản cuối | 97 | 100 | 100 | 100 |
| Liên hệ — local release candidate | 95 | 100 | 100 | 100 |

Trang chủ production: LCP 2,2 giây, CLS 0 trong phép đo. Đây là kết quả lab của lần chạy, có thể thay đổi theo mạng/máy và không thay thế Core Web Vitals thực tế. Báo cáo JSON thô ở thư mục output trên máy dev, không push dữ liệu môi trường máy lên repo. Một số lần CLI Lighthouse gặp lỗi dọn thư mục tạm Windows sau khi đã ghi report; không phải lỗi website.

## Vận hành

Runtime Node LTS riêng; app chỉ listen 127.0.0.1:4280 qua tunnel đã có. Không mở port public mới, không thay nginx/Node global hoặc route khác. Systemd giới hạn RAM/CPU, tự chạy theo máy và restart khi lỗi. Các release cũ được giữ để rollback; archive đã đối chiếu SHA-256 trước giải nén. Hướng dẫn chi tiết tại [OPERATIONS.md](OPERATIONS.md).

## Lưu ý quan trọng

- Form lưu vào hộp thư riêng trên host, **chưa tự gửi email/SMTP**; người vận hành đọc qua SSH. Liên kết email trực tiếp hoạt động. Dữ liệu tự hết hạn sau 30 ngày.
- Chưa có backup dữ liệu liên hệ ngoài host; mã nguồn và release có bản sao. Muốn backup liên hệ cần kho mã hóa và chính sách lưu giữ riêng.
- Google index/thứ hạng cần thời gian. Không chạy chiến dịch SEO nội dung, không mua backlink, không tạo dữ liệu game giả.
- Canonical ra mắt là apex blacklantern.games; chưa thêm hostname www riêng.
- Chưa có giám sát bên ngoài 24/7 hoặc SLA. Tình trạng chạy ổn đã được kiểm tra tại bàn giao, không phải lời hứa uptime tuyệt đối.
