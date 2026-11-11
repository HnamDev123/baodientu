# Báo điện tử 10A4 · Tri ân thầy cô 20/11

Website tĩnh (HTML/CSS/JS thuần), không cần build, gồm **hai link**:

- `/` (`index.html`) – giới thiệu "Một sản phẩm đến từ nhóm …", có loading, ảnh trang vở lơ lửng, rồi **tự chuyển** sang trang bài học.
- `/bai-hoc` (`bai-hoc.html`) – chủ đề chính: Giá trị lượng giác của góc từ 0° đến 180°. Xem hết bài thì công thức bay thành chữ **TRI ÂN THẦY CÔ**, rồi thành **con thuyền** và hiện lời tri ân.

## Đưa lên Vercel
1. Kéo thả thư mục này vào vercel.com/new (hoặc đẩy lên GitHub).
2. Framework Preset: **Other**. Build/Output: để trống. Deploy.

## Cấu trúc
- `style.css` – giao diện dùng chung (mobile + máy tính)
- `common.js` – gợn sóng nút, cánh hoa rơi
- `intro.js` – loading + giới thiệu + chuyển trang (đổi tên nhóm trong `index.html`, thẻ `.in-group`)
- `lesson.js` – mô phỏng nửa đường tròn đơn vị + hiệu ứng kết bài
