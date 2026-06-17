Hoàn toàn hiểu! Bạn muốn **chạy dự án trên máy** để xem trực tiếp giao diện trong khi làm việc với tôi. 😊

#### Cách chạy dự án Aura Fitness

Dự án có **2 phần** cần chạy song song, hãy mở **2 terminal riêng biệt**:

**Terminal 1 - Chạy Frontend (React):**

```bash
cd "c:\Users\tdken\OneDrive\Desktop\1_Projects\New folder"
npm install
npm run dev
```

> Mở trình duyệt tại `http://localhost:5173`

**Terminal 2 - Chạy Backend (Express):**

```bash
cd "c:\Users\tdken\OneDrive\Desktop\1_Projects\New folder\server"
npm install
npm run dev
```

---

#### Quy trình làm việc cùng tôi

```
Tôi sửa code trên GitLab
        ↓
Bạn chạy: git pull origin main
        ↓
Trình duyệt tự động reload ✅
(Vite hỗ trợ Hot Reload, không cần restart)
```

> ⚡ **Vite** (bundler của dự án bạn) có tính năng **Hot Module Replacement** - tức là mỗi khi code thay đổi, trình duyệt tự cập nhật ngay mà không cần F5!

---


Đây là 2 cheatsheet cho bạn! 🎯

#### 📥 Khi tôi sửa code → Lấy về máy

```bash
# Chỉ cần 1 lệnh duy nhất
git pull origin main
```

> Chạy lệnh này mỗi khi tôi báo "đã sửa xong, bạn pull về nhé!"

---

#### 📤 Khi bạn sửa code → Đẩy lên GitLab

```bash
# Bước 1: Xem những file nào đã thay đổi
git status

# Bước 2: Thêm tất cả thay đổi vào
git add .

# Bước 3: Lưu lại với mô tả ngắn
git commit -m "mô tả ngắn bạn vừa làm gì"

# Bước 4: Đẩy lên GitLab
git push
```

> 4 lệnh này chạy  **theo thứ tự** , không bỏ bước nào!

---

#### ⚠️ Quy tắc vàng

| Tình huống        | Làm gì                                    |
| ------------------- | ------------------------------------------- |
| Trước khi code    | `git pull`trước                         |
| Sau khi code xong   | `git add .`→`git commit`→`git push` |
| Tôi báo sửa xong | `git pull origin main`                    |
