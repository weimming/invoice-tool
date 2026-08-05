# 手寫發票小救星 - 手寫發票小工具
# Handwritten Invoice Helper

![AI Powered](https://img.shields.io/badge/AI-Powered-purple?style=flat-square&logo=google-gemini&logoColor=white)

這是一個專為手寫發票設計的輔助工具，提供台灣公司統一編號查詢、營業稅（含稅/未稅）試算、金額大寫轉換以及發票填寫預覽功能。

This is an assistive tool designed for handwritten invoices in Taiwan. It provides features such as Unified Business Number (Tax ID) lookup, VAT calculation (handling Tax Included/Excluded), number-to-Chinese-capital conversion, and an invoice preview for filling out forms.

> **⚠️ 注意 (Note)**: 本專案由 AI 協助製作、修改與維護。
> This project is created, modified, and maintained by AI.

## 版權聲明 (Copyright)

本專案採用 **MIT License** 開源授權。
This project is licensed under the **MIT License**.

您可以免費使用、修改與分發本軟體，唯需保留原始版權聲明。
You are free to use, modify, and distribute this software, provided that the original copyright notice is preserved.

詳細內容請參閱 [LICENSE](LICENSE.md) 文件。
For more details, please refer to the [LICENSE](LICENSE.md) file.

## 功能特色 (Features)

- **發票試算 (Invoice Calculation)**：
    - 支援「含稅」與「未稅」金額互轉計算。
      Supports conversion between "Tax Included" and "Tax Excluded" amounts.
    - 自動計算 5% 營業稅，並支援 **零稅率** 與 **免稅** 模式。
      Automatically calculates 5% VAT, supporting **Zero Tax** and **Tax Exempt** modes.
    - 即時轉換金額為國字大寫（如：壹萬貳仟元整），方便填寫發票。
      Instantly converts numbers to Traditional Chinese financial capital characters (e.g., 壹萬貳仟元整) for easy filling.

- **發票預覽 (Invoice Preview)**：
    - 即時模擬 **三聯式 (公司用)** 與 **二聯式 (個人用)** 手寫發票樣式。
      Simulates **Triplicate (Company)** and **Duplicate (Individual)** handwritten invoice styles in real-time.
    - 自動填入買受人資訊、日期與金額，所見即所得。
      Automatically fills in Buyer info, date, and amount—what you see is what you get.

- **公司查詢 (Company Lookup)**：
    - 串接 g0v 開放資料 API。
      Integrated with g0v open data API.
    - 支援 **公司名稱** 模糊搜尋。
      Supports **Company Name** fuzzy search.
    - 支援 **統一編號 (8碼)** 精確查詢。
      Supports **Unified Business No. (8 digits)** exact search.
    - 可顯示公司/商號名稱、統編、狀態（營業中/解散/歇業）、登記機關與資本額。
      Displays Company/Business Name, Tax ID, Status (Operating/Dissolved/Closed), Registration Authority, and Capital Amount.

- **介面體驗 (User Experience)**：
    - **RWD 響應式設計**：支援手機、平板與桌面端完美顯示。
      **Responsive Design**: Perfectly tuned for mobile, tablet, and desktop.
    - **動態背景**：優雅的 Glassmorphism 玻璃擬態風格搭配動態背景。
      **Dynamic Background**: Elegant Glassmorphism style with dynamic background effects.

## 工作日誌 (Changelog)

### 2026-08-06
- **核心功能重構與發布 (Core Upgrade & Release)**:
    - **10碼智慧連號 (`YYYYMMxxxx`)**：實作三聯式 (AB) 與二聯式 (CD) 獨立連號與跨月自動歸零重置，僅在加入暫存清單時自動連號 `+1`。
      Implemented 10-digit auto-incrementing invoice numbers with mode-separated prefixes (`AB`/`CD`) and auto monthly reset.
    - **膠囊卡片 (Quick Chips)**：新增 `+ 新增常用客戶` 與 `+ 新增常用品項` 膠囊，並實作 JSON 備份/還原時靜默打包與解包復原。
      Added Quick Chips for frequent buyers and items, integrated with silent JSON backup & restore.
    - **範例膠囊清理與刪除持久化修復**：徹底移除硬編碼寫死之範例膠囊，並修復刪除記憶機制（膠囊清空為 `[]` 時持久化保存，刷新網頁後 100% 保持完全乾淨，不會自動強制復原預設範例）。
      Removed hardcoded default preset chips and fixed deletion persistence so that empty chip arrays remain cleanly empty on reload.
    - **雙層清除與按鈕動態連動**：實作 `🗑️` 一鍵清空 (Esc) 按鈕，與 `📋` 複製摘要按鈕共用 `120ms` 極速動態過渡與樣式連動。
      Added one-tap clear (`🗑️` / Esc) synced dynamically with copy button (`📋`), tuned to 120ms transition.
    - **原廠字型與完美對稱排版**：100% 保持 `'Courier New', Courier, monospace` 打字機字體風格，發票紙張頁首左右欄位對稱居中無偏斜。
      Restored original `'Courier New'` monospaced font, ensuring 100% centered header layout.
    - **TDD 自動化單元測試**：15 項單元測試 100% 綠燈全過。
      Passed all 15 automated TDD unit test suites cleanly.

### 2026-01-20
- **開源授權變更 (License Update)**:
    - **轉為 MIT License 開源 (Switched to MIT License)**：本專案正式採用 MIT License 開源授權，允許社群自由使用與貢獻。
      Officially adopted the MIT License, allowing the community to freely use and contribute to the project.
    - **更新授權文件 (Updated License Docs)**：更新 `LICENSE.md` 與 `README.md` 中的版權聲明。
      Updated copyright notices in `LICENSE.md` and `README.md`.

### 2026-01-16
- **介面細節修復 (UI Fixes)**:
    - **暫存清單間距修正 (History List Padding Fix)**：
        - 移除暫存清單底部多餘的內距 (Padding/Margin)，使區塊上下的留白高度視覺統一。
        - Reduced excessive bottom padding/margin in the History List section to align the top and bottom visual spacing seamlessly.
    - **動態版權年份 (Dynamic Copyright Year)**：
        - 實作自動化年份顯示邏輯，頁尾版權年份將隨系統時間自動更新 (如 2026)，無需手動維護。
        - Implemented auto-updating logic for the footer copyright year; it now syncs with the system date automatically.
- **品牌與授權資訊更新 (Rebranding & Licensing)**：
    - 將版權所有者由「Akira Lai」變更為 **「ameshima studio」**。
    - 更新 `LICENSE` 與相關文件中的聯絡信箱為 **akira@ameshima.com**。
    - Rebranded copyright holder to **"ameshima studio"** and updated licensing contact email.

### 2026-01-13
- **資料保護功能 (Data Protection)**:
    - **備份提醒機制 (Backup Reminder)**: 新增智慧偵測功能，當使用者**超過 30 天**未備份發票紀錄時，系統會在開啟網頁時自動跳出提示，避免因裝置重置或瀏覽器清除快取造成重要資料遺失。
      Implemented a smart reminder system that alerts users to backup their data if they haven't exported/backed up for **over 30 days**, preventing data loss.
- **文案調整 (Wording Update)**:
    - 將統編錯誤訊息由「邏輯檢查失敗」調整為更溫和的「統編可能有誤，請查明清楚」。

### 2026-01-09
- **核心邏輯修復 (Core Logic Fix)**:
    - **統編演算法修正 (UBN Validation Fix)**：修復了統一編號「第七位為 7」時的特殊驗證邏輯錯誤。
      Fixed a logic error in the Unified Business Number validation algorithm specifically for cases where the 7th digit is 7.
      - **細節說明**: 當第七位是 7 時，依財政部規則有兩種計算總和的方式（相差 9）。原程式碼誤用 `(sum - 1)` 來模擬第二種規則，已修正為正確的 `(sum + 1)` 或 `(sum - 9)`，解決了正確統編（如 `70625371`）被誤判為錯誤的問題。
      - **Details**: Corrected the math logic. Previously used `(sum - 1)` which was incorrect; updated to `(sum + 1)` to correctly satisfy the modulo 10 check for the alternative calculation method allowed by the tax authority.
- **系統強健性提升 (System Robustness)**:
    - **API 優先機制 (API Result Priority)**：啟用「API 救援模式」。現在當本機數學驗證失敗（顯示紅字）但 API 成功回傳公司資料時，系統會**自動移除錯誤訊息**並採信 API 結果。這能防止因數學邏輯邊緣案例導致的誤判，確保使用者體驗流暢。
      Enabled "API Rescue Mode": If local validation fails but the API successfully returns company data, the system now automatically clears the error message and trusts the API result, preventing false positives from blocking the user.

### 2026-01-08 (Refined / 最終修正版)
- **歷史清單完全體回歸 (Advanced History Restoration)**:
    - **雙月分組與小計 (Bi-monthly Grouping & Subtotals)**：恢復了備受好評的雙月份自動分組功能，並自動計算每期的銷售額、稅額與總金額小計，方便會計核對。
      Restored the acclaimed bi-monthly grouping with automatic subtotals for Sales, Tax, and Total Amount.
    - **詳細資料檢視 (Detailed View)**：清單項目現在能完整顯示三聯/二聯發票的詳細資訊，包含品項、個別金額與買受人資訊。
      List items now display full details including Item Name, amounts, and Buyer info for both Triplicate/Duplicate modes.
    - **資料相容遷移 (Data Migration)**：導入自動遷移邏輯，若偵測到舊版（扁平結構）的歷史資料，會自動轉換為新版（巢狀結構）格式，確保版本切換時**資料零遺失**。
      Implemented auto-migration logic to seamlessly convert legacy data formats to the new structure, ensuring **zero data loss** during updates.

- **UI 一致性與體驗 (UI Consistency & UX)**:
    - **全面內嵌清除按鈕 (Universal Inner Clear Buttons)**：為「統編」、「公司名稱」、「品項」等所有輸入欄位補齊了統一規格的內部清除功能 (`x`)，並優化了 `Padding`，徹底移除介面上突兀的外部清除按鈕。
      Added standardized inner clear buttons (`x`) to ALL input fields (Tax ID, Buyer Name, Item Name) and optimized padding, removing obsolete external buttons.
    - **頁面重整自動歸零 (Auto-Reset on Reload)**：現在重新整理網頁時，瀏覽器快取的輸入內容會被強制清空，讓使用者每次都能獲得乾淨的初始狀態。
      Browser-cached inputs are now forcibly cleared on page reload, ensuring a clean slate every time.
    - **錯誤訊息排版修正 (Error Layout Fix)**：解決輸入錯誤時（如統編格式錯誤），清除按鈕位置因高度變化而跑板的問題，現在按鈕位置穩如泰山。
      Fixed layout shifting of clear buttons when error messages appear; buttons remain perfectly centered.

- **極致單機優化 (Ultimate Standalone Optimization)**:
    - **雲端代碼徹底移除 (Code Purge)**：與先前版本不同，此版本已**物理性刪除**所有 PHP 後端檔案 (`save_invoice.php` 等) 與 JS 中的連線邏輯，程式碼更輕量，執行更安全。
      Physically removed all PHP backend files and connection logic. The app is now 100% clean, lightweight, and offline-safe.

- **行政效率與實用工具 (Productivity Tools)**:
    - **智慧品項快選 (Smart Item Presets)**：導入自動記憶功能，系統會自動學習您輸入過的品項（如：設計費、工程款...），下次輸入時即會透過自動完成選單 (`Datalist`) 提示，越用越聰明。
      Implemented auto-learning item presets. The system remembers your input history (e.g., Design Fee) and offers auto-complete suggestions for future use.
    - **一鍵複製摘要 (Copy Summary)**：新增「複製發票摘要」按鈕（📋 Icon），一鍵將發票日期、買受人、品項與詳細金額格式化為確認文案（日期格式優化為 `YYYY / MM / DD`），並提供綠色勾勾 ✅ 視覺回饋，方便直接貼給客戶核對。
      Added a "Copy Summary" clipboard icon button. Instantly copies formatted invoice details for client verification, featuring `YYYY / MM / DD` date format and visual success feedback.
    - **歷史備份/還原 (Backup & Restore)**：在暫存清單介面加入直覺的 JSON 匯出/匯入按鈕，讓使用者能輕鬆備份珍貴的歷史資料，防止瀏覽器快取清除造成的資料遺失。
      Added intuitive Export/Import buttons to the History section, allowing users to backup data as JSON files to prevent data loss from browser cache clearing.
    - **分流匯出與通用格式 (Smart Export & CSV)**:
        - **模式分流 (Mode-Specific)**: 匯出功能（JSON/CSV）現在會智慧偵測當前分頁，只匯出相應模式（三聯或二聯）的資料，並在檔名自動標註 `company` 或 `individual`，檔案管理井井有條。
          Exports depend on the active tab, filtering data by mode and tagging filenames with `company` / `individual`.
        - **Excel/Sheets 支援**: 新增 **CSV 匯出** 功能，內建 BOM 編碼處理，並包含「開立編號」欄位（對應系統 ID），確保 Excel 與 Google Sheets 開啟時資料完整且中文不亂碼。
          Added CSV export with BOM support, including an "Opening Number" column (System ID), ensuring full data integrity and correct encoding in Excel/Google Sheets.
    - **代碼庫整併 (Codebase Consolidation)**：執行 CSS 瘦身計畫，將原本獨立的 `style_history.css` 完整合併回主樣式表 `style.css`，並移除多餘的檔案引用。現在專案回歸最純粹的 HTML/CSS/JS 三檔結構，維護更輕鬆。
      Merged `style_history.css` into `style.css` and removed redundant file references. The project now maintains a clean 3-file structure (HTML/CSS/JS) for easier deployment and maintenance.
    - **備份功能與用語優化 (Backup & Wording)**：將「JSON 匯出/匯入」按鈕重新命名為更直覺的「備份紀錄 / 還原紀錄」，降低一般使用者的技術門檻。
      Renamed "Export/Import JSON" buttons to clearer "Backup Invoice Records / Restore Records" to improve accessibility for non-technical users.
    - **介面細節微調 (UI Polish)**：
        - 修正卡片上下留白不一致的視覺問題 (Card Padding Balance)。
        - 優化複製按鈕的防呆機制，載入時強制 Disabled 防止顏色閃爍 (Anti-Flicker)，並確保僅在有金額時可點擊。
        - **發票預覽載入穩定性 (Preview Stability)**：導入 CSS 初始化隱藏機制 (`opacity`)，確保發票預覽在 JavaScript 計算完成後才優雅淡入，徹底解決重新整理時的版面跳動問題。
          Implemented CSS-based initial hiding (`opacity`) to ensure the invoice preview fades in elegantly only after JS calculations, completely resolving layout jumps on reload.

### 2026-01-08
- **核心架構穩定化 (Core Stability Rollback)**:
    - **純單機模式回歸 (Standalone Mode)**：為確保極致的穩定性與隱私，全面移除「雲端同步」相關實驗性功能。目前系統回歸為**純前端 (Client-side)** 運作，所有發票資料僅存於您的裝置瀏覽器中，不再進行後端傳輸，徹底解決因連線邏輯導致的功能異常與快取干擾。
      Reverted to **Standalone Mode** for maximum stability and privacy. Removed all experimental "Cloud Sync" features. All invoice data now resides solely in your browser's local storage, ensuring zero interference from network logic or caching issues.
    - **JS 邏輯重整 (JS Logic Cleanup)**：清除所有冗餘的非同步呼叫與未使用的函式庫引用，大幅提升程式碼載入速度與執行效率。
      Cleaned up redundant async calls and unused libraries, boosting load speed and execution efficiency.

- **瀏覽器相容性與顯示修復 (Browser Compatibility & Display Fixes)**:
    - **Firefox 渲染修正**: 解決 Firefox 瀏覽器下因排版差異導致的發票預覽顯示異常問題。
      Fixed rendering issues in invoice preview specific to Firefox browsers.
    - **強制卷軸移除 (Scrollbar Removal)**: 移除先前為了解決跳動而強制開啟的 `overflow-x: auto`，現在發票預覽在所有裝置上皆能完美縮放，不再出現惱人的多餘卷軸。
      Removed the forced scrollbar (`overflow-x: auto`). Invoice preview now scales perfectly on all devices without unnecessary scrollbars.
    - **預覽防切邊 (Anti-Clipping)**: 調整自動縮放計算公式，增加安全邊距 (`Padding`)，確保發票邊框與內容在極窄螢幕下也不會被切斷。
      Adjusted auto-scaling formula with increased safe padding to prevent invoice borders/content from being clipped on narrow screens.
    - **暫存清單顯示修正**: 修復暫存清單區塊在特定情境下被錯誤隱藏 (`display: none`) 的問題，確保清單隨時可見。
      Fixed an issue where the History List section was incorrectly hidden (`display: none`); ensured it is always visible.

### 2026-01-07
- **發票預覽 RWD 體驗升級 (Invoice Preview RWD Upgrade)**:
    - **幾何等比縮放 (Geometric Scaling)**：針對手機與平板裝置導入全新自動縮放機制，發票預覽不再需要左右滑動，而是依據螢幕寬度自動**等比所小 (Auto-Scale)**，確保整張發票完美呈現於畫面中。
      Introduced a new auto-scaling mechanism for mobile/tablets. The invoice preview now **Auto-Scales** geometrically to fit the screen width, eliminating the need for horizontal scrolling.
    - **即時響應引擎 (Real-time Responsive Engine)**：導入 `ResizeObserver` 與 `MutationObserver` 雙重監聽技術，無論是旋轉螢幕或切換發票模式，預覽視窗皆能**毫秒級即時響應**，調整對應尺寸。
      Implemented dual `ResizeObserver` & `MutationObserver` technology. The preview window responds **instantly** to screen rotation or mode switching with millisecond precision.
    - **平滑無縫體驗 (Smooth & Seamless)**：
        - 解決頁面重新整理時的「跳動」問題，載入瞬間即定位完成。
          Fixed layout "jumping" on page reload; content snaps to correct size instantly.
        - 加入平滑過渡動畫 (Transitions)，讓視窗縮放過程如流體般自然。
          Added smooth transitions for a fluid scaling experience.
    - **版面修正 (Layout Fixes)**：修復發票標題與主體在特定寬度下跑版(並排顯示)的問題，強制採用垂直堆疊佈局，確保「發票預覽」標題永遠清晰位於上方。
      Fixed layout issues where the header and body overlapped or aligned incorrectly; enforced vertical stacking to keep the "Invoice Preview" header clearly on top.
- **輸入體驗優化 (Input UX Enhancements)**：
    - **內嵌清除按鈕 (Inner Clear Buttons)**：在「銷售額」與「總計」輸入框內新增圓形清除按鈕 (`x`)，點擊即清空數值並自動觸發重新計算，提升手機操作便利性。
      Added circular "Clear" buttons (`x`) inside "Sales" and "Total" input fields for one-tap clearing and auto-recalculation, improving mobile usability.
      Tuned mobile breakpoint (1250px -> 900px) to preserve the comfortable side-by-side layout on desktop screens.

### 2026-01-06
- **暫存清單功能增強 (History List Enhancements)**:
    - **分期檢視 (Bi-monthly Grouping)**：發票清單現已依照「民國年 - 雙月期別」自動分組顯示 (如：115年 三、四月份)，方便核對當期申報資料。
      Invoices are now automatically grouped by "ROC Year - Bi-monthly Period" (e.g., Year 115, Mar-Apr) for easier tax filing checking.
    - **分組小計 (Group Subtotals)**：每個期別群組下方新增獨立的「小計區塊」，自動計算該期的 **銷售額 (未稅)**、**稅額** 與 **總計**。
      Added "Group Subtotals" footer for each period, automatically calculating Sales (Tax Excl.), Tax, and Total Amount for that specific period.
    - **期別清除 (Per-Period Clear)**：移除舊版全域清除按鈕，改為在每個分組標題右側提供 **[清除本期]** 按鈕，可安全刪除特定月份資料而不影響其他期別。
      Replaced global clear with a **[Clear Period]** button in each group header, allowing safe deletion of specific months without affecting others.
- **UI 優化 (UI Improvements)**:
    - **金額標籤 (Amount Tags)**：新增「未稅 / 稅」獨立標籤，採用灰/紅配色區分，並整齊排列於金額左側。
      Added distinct "Tax Excl. / Tax" tags with Gray/Red color coding, stacked neatly beside the total amount.
      Increased text size of Tax Type buttons to `1.05rem` for better readability and clickability.

### 2025-12-30
- **品牌形象更新 (Branding Update)**:
    - **Logo 設計**: 新增專屬 App Icon (`logo.svg`)，以靛藍色圓角方塊搭配手寫發票意象，並加入「小救星」綠色勾勾元素。
      **Logo Design**: Added App Icon (`logo.svg`) featuring indigo rounded square and invoice imagery.
    - **首頁視覺優化**: 將 Logo 置於標題正上方 (Center Stacked) 並加大尺寸，增加陰影層次，提升整體 Web App 的專業質感。
      **Home Visuals**: Centered and enlarged Logo above title with shadow for a professional look.
    - **Favicon 設定**: 同步更新網頁 Favicon，讓瀏覽器分頁也能顯示品牌圖示。
      **Favicon**: Updated web favicon.
- **暫存清單 (History List) 全面升級 / History List Upgrade**:
    - **無限卷軸 (Infinite Scroll)**：移除清單高度限制，紀錄可自動向下延伸，不再受限於固定高度卷軸。
      Removed height limit, allowing list to grow infinitely.
    - **視覺層級優化 (Visual Hierarchy)**：
        - 「品項名稱」獨立成行，採用深色粗體 (`1.1rem`)，大幅提升識別度。
          Item Name now on its own line, bold and dark.
        - 「金額」獨立靠右顯示，字體放大 1.5 倍 (`2.4rem`)，成為視覺焦點。
          Amount displayed right-aligned and larger (`2.4rem`).
        - 「買受人」改為灰色次要顯示，降低資訊干擾。
          Buyer info muted in gray.
    - **版面配置**: 微調區塊間距 (`Padding`) 與行距，讓資訊呈現更緊湊且舒適。
      Tweaked padding and line height for a compact layout.
- **發票期別自動化(Automatic Invoice Period)**:
    - 實作三聯式發票期別自動判斷邏輯 (如：114年 十一、十二月份)，依據當前日期自動跨年與切換雙月期別，無需手動調整。
      Implemented logic to automatically determine invoice period (e.g., Year 114, Nov-Dec) based on current date.
- **模式分離優化 (Mode Separation)**:
    - **紀錄獨立**: 暫存清單現在會依據「三聯」或「二聯」模式自動過濾顯示，互不混淆。
      **History Separation**: History list now filters based on Triplicate/Duplicate mode.
    - **體驗改善**: 「加入暫存」成功後不再彈出 Alert 視窗，改為流暢的自動滾動定位。
      **UX Improvement**: Replaced "Added" Alert with smooth scrolling.
- **UI 細節修復 (UI Polish)**:
    - 統一卡片容器 (`.card`) 上下內距為 `30px`，移除多餘的底部留白，確保視覺平衡一致。
      Standardized card padding to `30px`, removing excess bottom space.

### 2025-12-29
- **Bug 修復與體驗優化 (Bug Fixes & UX)**:
    - **備註隱藏修復**：修復切換至「二聯式（個人）」時，底部備註文字（※應稅、零稅率...）未正確隱藏的問題（補上遺漏的 class）。
      Fixed issue where footer remarks were not hiding correctly in Duplicate mode.
    - **統編輸入限制**：解除統編輸入框的過濾註解，現在強制限制只能輸入數字，避免誤填非數字字符。
      Enforced numeric-only input for Tax ID field.
    - **金額輸入提示優化**：新增動態標籤邏輯，切換模式時自動更新金額輸入框標題：
      optimized amount input hint showing dynamic labels:
        - 三聯式顯示「輸入金額 (未稅)」。
          Triplicate: "Enter Amount (Tax Excluded)".
        - 二聯式顯示「輸入金額 (含稅)」，降低使用者金額填寫錯誤的機率。
          Duplicate: "Enter Amount (Tax Included)".

### 2025-12-28
- **UI/UX 顯示修復 (Display Fixes)**:
    - **中文大寫欄位優化 (Chinese Capital Field)**：
        - 恢復中文金額欄位（億、萬、仟...）的垂直分隔線。
          Restored vertical separators for Chinese currency fields (Yi, Wan, Qian...).
        - 修正刪除線樣式，使其略微延伸以覆蓋欄位間隙，解決線條斷裂問題。
          Fixed strikethrough style to cover gaps, resolving broken line issues.
    - **二聯式發票預覽修正 (Duplicate Invoice Preview)**：
        - 修復「營業稅」欄位高度不足導致的底部空白問題（改為自動填滿 `flex: 1`）。
          Fixed bottom whitespace issue in "VAT" field (changed to `flex: 1`).
    - **版面穩定性 (Layout Stability)**: 強制瀏覽器顯示右側卷軸 (`overflow-y: scroll`)，解決切換分頁時因高度變化造成的版面跳動。
      Forced vertical scrollbar (`overflow-y: scroll`) to prevent layout jumping when switching tabs.
- **功能與效能優化 (Performance & Features)**:
    - **公司查詢效能提升 (Company Lookup Performance)**：在公司名稱輸入監聽中加入 `AbortController` 中斷機制，解決快速輸入時舊請求覆蓋新結果 (Race Condition) 的問題，確保只顯示最新的查詢結果。
      Added `AbortController` to company name input listener to prevent race conditions from quick typing.
    - **程式碼重構 (Refactoring)**：
        - 移除 HTML 中冗餘重複的「二聯式營業稅」區塊，提升程式碼整潔度。
          Removed redundant "Duplicate VAT" block in HTML.
        - **全面中文化註解 (Full Chinese Comments)**：將 `index.html`、`style.css` 與 `script.js` 內的所有程式碼註解翻譯為繁體中文，並詳細說明各區塊功能，大幅提升專案可維護性。
          Translated all comments in `index.html`, `style.css`, and `script.js` to Traditional Chinese for better maintainability.
- **使用者體驗增強 (18:50 更新) / UX Enhancements (18:50 Update)**:
    - **三聯/二聯模式資料獨立 (Mode Data Separation)**：實作狀態管理機制，發票金額、品項、買受人資料在切換模式時會自動獨立儲存與還原，互不影響，避免三聯式「品項」內容誤入二聯式欄位的狀況。
      Implemented state management to keep data independent between Triplicate and Duplicate modes.
    - **二聯式買受人優化 (Duplicate Buyer Optimization)**：切換至開給個人（二聯式）時，輸入框標籤自動變更為「**姓名**」，並自動**隱藏統編輸入框**、**隱藏自動查詢提示**與**停用公司名單自動完成**，精簡介面以符合個人發票開立需求。
      Duplicate mode now labels input as "**Name**", hides Tax ID input/hints, and disables company autocomplete.
    - **清除功能邏輯修正 (Clear Logic Fix)**：修正「清除」按鈕邏輯，現在僅會清除**當前分頁模式**（三聯或二聯）的暫存資料，確保另一模式的資料完整保留，互不干擾。
      Fixed "Clear" button to only wipe data for the **current mode**, preserving the other mode's data.

### 2025-12-27
- **功能優化 (API) / Feature Optimization**:
    - **統編精確查詢 (Exact Tax ID Search)**：新增邏輯自動偵測輸入是否為 8 碼數字，若是則自動切換至 `api/show/{統編}` 接口，解決統編被當作關鍵字搜尋找不到資料的問題。
      Added logic to detect if input is an 8-digit number; if so, switches to `api/show/{ID}` for exact match, fixing issues where Tax IDs were treated as keywords.
    - **資料解析修正 (Data Parsing Fixes)**：
        - 修正名稱欄位：同時支援讀取 `公司名稱` (公司) 與 `商業名稱` (行號/工作室)。
          Name field fix: Supports reading both `Company Name` and `Business Name` (Sole proprietorships/Studios).
        - 修正狀態欄位：同時讀取 `公司狀況` 與 `現況`，並新增對「歇業」狀態的樣式判斷。
          Status field fix: Reads both `Company Status` and `Current Status`, adding style handling for "Closed" status.
        - 修正統編欄位：優先讀取標準 `統一編號` 欄位。
          Tax ID fix: Prioritizes reading the standard `Unified Business No.` field.
- **Git 維護 (Git Maintenance)**:
    - 解決 `script.js` 合併衝突，保留了最新的 API 搜尋優化邏輯。
      Resolved `script.js` merge conflicts, preserving the latest API optimization logic.
- **UI/UX 介面重構與優化 (UI/UX Refactoring)**:
    - **發票試算邏輯升級 (Calculation Logic Upgrade)**：
        - 導入「開給公司 (三聯)」與「開給個人 (二聯)」獨立分頁模式。
          Introduced separate tabs for "To Company (Triplicate)" and "To Individual (Duplicate)".
        - **三聯式邏輯**: 輸入金額視為「銷售額 (未稅)」，自動計算外加 5% 營業稅。
          **Triplicate Logic**: Input treated as "Sales Amount (Tax Excluded)", adds 5% VAT automatically.
        - **二聯式邏輯**: 輸入金額視為「總計 (含稅)」，自動回推未稅金額。
          **Duplicate Logic**: Input treated as "Total (Tax Included)", calculates tax-excluded amount backward.
        - 實作輸入數值獨立記憶功能，切換模式時數據不混用。
          Implemented independent storage for inputs so data isn't mixed when switching modes.
        - 優化稅率選擇介面，改為獨立按鈕 (應稅/零稅率/免稅)。
          Optimized tax rate selection with standalone buttons (Taxable/Zero Tax/Exempt).
        - 加大「金額大寫」顯示字體與加粗，提升可讀性。
          Enlarged and bolded "Capitalized Amount" font for better readability.
    - **買受人欄位改良 (Buyer Field Improvements)**：
        - 重新設計佈局：統一編號 (固定寬度) 與公司名稱 (彈性寬度) 採左右並排顯示。
          Redesigned layout: Tax ID (fixed width) and Company Name (fluid width) side-by-side.
        - 新增「一鍵清除」按鈕，快速重置輸入內容。
          Added "Clear All" button for quick reset.
        - 統一輸入框文字靠左對齊，修正原本靠右的狀況。
          Aligned text inputs to the left.
        - 優化卡片間距 (Padding/Margin)，提升整體視覺呼吸感與平衡。
          Optimized card spacing (Padding/Margin) for better visual balance.
    - **程式碼維護 (Code Maintenance)**：
        - `style.css` 進行全面重整，添加繁體中文註解與區塊標示 (買受人區塊/試算區塊)，提升可維護性。
          Refactored `style.css` with Traditional Chinese comments and block markers for maintainability.
