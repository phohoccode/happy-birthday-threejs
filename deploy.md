Website này đã được deploy lên OpenAI Sites.

Thông tin hiện tại:

* Build command: `vinext build`
* Production artifact: `dist/client`
* Hosting config: `.openai/hosting.json`
* Hosting: OpenAI Sites / Cloudflare
* Existing production URL:
  `https://birthday-midnight-wish.phophoccode.chatgpt.site`
* Access: private, yêu cầu đăng nhập ChatGPT

Hãy thực hiện các thay đổi tôi yêu cầu trên source code hiện tại.

Sau khi hoàn thành:

1. Không tạo OpenAI Site mới.
2. Không thay đổi `project_id` hiện có trong `.openai/hosting.json`.
3. Không thay đổi production URL.
4. Không thay đổi quyền truy cập private.
5. Chạy các validation phù hợp:

   * typecheck
   * lint
   * production build
6. Chạy:
   `vinext build`
7. Kiểm tra production artifact được tạo thành công.
8. Kiểm tra không có:

   * build error
   * TypeScript error
   * missing asset
   * broken import
   * client runtime error rõ ràng
9. Lưu một version mới của Site.
10. Deploy/publish version mới vào CHÍNH OpenAI Site hiện tại.
11. Không tạo một deployment project khác.
12. Sau deploy, kiểm tra production URL hiện tại vẫn hoạt động.

Nếu deploy thành công, báo cáo:

* các file đã thay đổi;
* build result;
* version mới;
* production URL;
* xác nhận Site cũ đã được update thay vì tạo Site mới.
