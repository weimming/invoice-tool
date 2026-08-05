/*
 * Copyright (c) 2025 ameshima studio
 * All rights reserved. / 版權所有
 *
 * This software is proprietary and confidential.
 * 本軟體為專有且機密之財產。
 *
 * Unauthorized copying, distribution, or use of this file is strictly prohibited.
 * 嚴禁未經授權複製、分發或使用本檔案。
 *
 * This software is NOT provided for free.
 * 本軟體並非免費提供。
 */

document.addEventListener('DOMContentLoaded', () => {

    // --- Data Migration (Simple -> Complex) ---
    try {
        const simpleHist = localStorage.getItem('invoice_history');
        if (simpleHist) {
            console.log('Migrating old data...');
            const simpleData = JSON.parse(simpleHist);
            if (Array.isArray(simpleData) && simpleData.length > 0) {
                let saved = JSON.parse(localStorage.getItem('invoice_helper_history') || '[]');
                const migrated = simpleData.map(item => ({
                    id: item.id || Date.now().toString() + Math.random(),
                    date: item.date,
                    mode: item.buyerUbn ? 'company' : 'individual',
                    buyer: {
                        name: item.buyerName || '',
                        ubn: item.buyerUbn || ''
                    },
                    item: {
                        name: item.itemName || '品項'
                    },
                    amounts: {
                        sales: parseInt(item.sales) || 0,
                        tax: (parseInt(item.total) || 0) - (parseInt(item.sales) || 0),
                        total: parseInt(item.total) || 0,
                        taxType: '0.05'
                    }
                }));
                // Combine: New migrated items first
                saved = [...migrated, ...saved];
                localStorage.setItem('invoice_helper_history', JSON.stringify(saved));
                localStorage.removeItem('invoice_history');
                console.log('Migration complete.');
            }
        }
    } catch (e) { console.error('Migration error', e); }
    // ------------------------------------------


    // --- 發票試算核心邏輯 (Invoice Calculator Logic) ---
    // const modeToggle = document.getElementById('tax-mode-toggle'); // Removed
    const modeOptions = document.querySelectorAll('.mode-opt');
    let isExclusive = false; // 預設值：內含稅 (因為初始狀態為二聯式/開給個人)

    const inputSales = document.getElementById('input-sales-amount');
    const inputTotal = document.getElementById('input-total-amount');
    const displayTax = document.getElementById('display-tax-amount');
    const inputItemName = document.getElementById('input-item-name');

    // Auto-clear inputs on reload
    [inputSales, inputTotal, inputItemName, document.getElementById('buyer-ubn'), document.getElementById('buyer-name')].forEach(el => {
        if (el) el.value = '';
    });

    // const resSales = document.getElementById('res-sales'); // Removed
    // const resTax = document.getElementById('res-tax'); // Removed
    // const resTotal = document.getElementById('res-total'); // Removed
    const chineseNum = document.getElementById('chinese-num');


    // 分頁切換邏輯 (Tabs Switching)
    const tabs = document.querySelectorAll('.tab-btn');
    const tabIndicator = document.querySelector('.tab-indicator');
    const buyerSection = document.querySelector('.buyer-section');

    tabs.forEach((tab, index) => {
        tab.addEventListener('click', () => {
            // 移除所有按鈕的啟用狀態
            tabs.forEach(t => t.classList.remove('active'));
            // 將當前按鈕設為啟用
            tab.classList.add('active');

            // 移動底部指示線
            // Index 0 -> 0%, Index 1 -> 100%
            tabIndicator.style.transform = `translateX(${index * 100}%)`;

            // 切換內容顯示區塊
            const mode = tab.getAttribute('data-tab');
            if (mode === 'individual') {
                buyerSection.style.display = 'none';
            } else {
                buyerSection.style.display = 'block';
                // 若需要淡入動畫可在此添加，目前僅做簡單切換
            }
            renderHistory(); // 切換模式時重新渲染歷史紀錄
            if (typeof updateInvoiceNumberDisplay === 'function') {
                updateInvoiceNumberDisplay(mode); // 切換三聯(AB)/二聯(CD)獨立發票號碼
            }
            if (typeof renderItemChips === 'function') {
                renderItemChips(mode); // 切換三聯/二聯獨立常用品項膠囊
            }
        });
    });

    // 常數定義
    const taxOptions = document.querySelectorAll('.tax-opt');
    let currentTaxRateVal = '0.05'; // 預設稅率 5%

    function formatNumber(num) {
        return new Intl.NumberFormat('zh-TW').format(num);
    }

    function toChineseNumeral(n) {
        if (!n || n === 0) return '零元整';

        const units = ['', '拾', '佰', '仟'];
        const bigUnits = ['', '萬', '億', '兆', '京'];
        const digits = ['零', '壹', '貳', '參', '肆', '伍', '陸', '柒', '捌', '玖'];

        let s = Math.round(n).toString();
        let result = '';
        let groupCount = 0;

        while (s.length > 0) {
            let chunk = s.substring(Math.max(0, s.length - 4));
            s = s.substring(0, Math.max(0, s.length - 4));

            let chunkRes = '';
            let zeroFlag = false;

            for (let i = 0; i < chunk.length; i++) {
                let digit = parseInt(chunk[i]);
                let unitIdx = chunk.length - 1 - i;

                if (digit !== 0) {
                    if (zeroFlag) {
                        chunkRes += digits[0];
                        zeroFlag = false;
                    }
                    chunkRes += digits[digit] + units[unitIdx];
                } else {
                    zeroFlag = true;
                }
            }

            if (chunkRes !== '') {
                result = chunkRes + bigUnits[groupCount] + result;
            } else if (result !== '' && bigUnits[groupCount] !== '') {
                if (s.length > 0 && s.slice(-1) !== '0') {
                    result = digits[0] + result;
                }
            }

            groupCount++;
        }

        if (result.startsWith('零')) result = result.substring(1);

        return result + '元整';
    }

    // 各模式輸入金額狀態暫存 (State for inputs per mode)
    // 改為儲存 sales (未稅金額) 作為基準，或者兩個都存
    // 為簡單起見，儲存 sales 即可還原
    const inputState = {
        company: {
            sales: '', // changed from amount
            itemName: '',
            buyerName: '',
            buyerUbn: ''
        },
        individual: {
            sales: '', // changed from amount
            itemName: '',
            buyerName: '',
            buyerUbn: ''
        }
    };

    let lastEditedSource = 'sales'; // 'sales' or 'total'

    function calculate(source = lastEditedSource) {
        lastEditedSource = source; // Update source

        // Read Inputs
        let salesVal = parseFloat(inputSales.value);
        let totalVal = parseFloat(inputTotal.value);

        // Get Tax Rate
        const rateVal = currentTaxRateVal;
        const isTaxFree = (rateVal === '0' || rateVal === 'free');
        const rate = isTaxFree ? 0 : 0.05;

        let sales = 0, tax = 0, total = 0;

        if (source === 'sales') {
            // Forward: Sales -> Tax -> Total
            if (!isNaN(salesVal)) {
                sales = Math.round(salesVal);
                tax = Math.round(sales * rate);
                total = sales + tax;

                // Update UI (Total & Tax)
                // Note: Don't format Input values while typing? 
                // Creating a standard calculator feel: updating other fields
                displayTax.value = formatNumber(tax);
                inputTotal.value = total;
            } else {
                // Clear
                displayTax.value = '';
                inputTotal.value = '';
            }
        } else {
            // Reverse: Total -> Sales, Tax
            if (!isNaN(totalVal)) {
                total = Math.round(totalVal);
                // Formula: Sales = Total / (1.05)
                sales = Math.round(total / (1 + rate));
                tax = total - sales;

                // Update UI (Sales & Tax)
                inputSales.value = sales;
                displayTax.value = formatNumber(tax);
            } else {
                displayTax.value = '';
                inputSales.value = '';
            }
        }

        const chineseStr = toChineseNumeral(total);
        chineseNum.innerText = chineseStr;

        // Use total or sales for body?
        // 3-ply body uses Sales.
        // 2-ply body uses Total?
        // Let's stick to Sales for body "Amount" usually, but preview might behave differently.
        // Original logic passed "amount". 
        // Let's passed "sales" as body amount if mode is company, else total?
        // Actually, updateInvoicePreview logic handles it?
        // We pass 'sales', 'tax', 'total'.
        // Also pass 'displayBodyAmount' argument.
        // In Company mode, body amount is Sales. In Individual, usually Total?
        // In Company mode (3-ply), body amount is Sales (exclusive of tax).
        // In Individual mode (2-ply), body amount is Total (inclusive of tax).
        const mode = getCurrentMode();
        const displayBodyAmount = (mode === 'individual') ? total : sales;
        // console.log(`Mode: ${mode}, Body: ${displayBodyAmount}`);

        // Update Invoice Preview
        updateInvoicePreview(sales, tax, total, mode, isTaxFree, currentTaxRateVal, chineseStr, displayBodyAmount);

        // Update Copy & Reset Button State
        const copyBtn = document.getElementById('copy-summary-btn');
        const resetBtn = document.getElementById('reset-form-btn');
        const inputCompanyEl = document.getElementById('buyer-name');
        const inputUbnEl = document.getElementById('buyer-ubn');
        const inputItemEl = document.getElementById('input-item-name');
        const companyVal = inputCompanyEl ? inputCompanyEl.value.trim() : '';
        const ubnVal = inputUbnEl ? inputUbnEl.value.trim() : '';
        const itemVal = inputItemEl ? inputItemEl.value.trim() : '';
        const hasContent = (total > 0 || sales > 0 || companyVal !== '' || ubnVal !== '' || itemVal !== '');

        if (copyBtn) {
            copyBtn.disabled = !(total > 0);
        }
        if (resetBtn) {
            resetBtn.disabled = !hasContent;
        }

        // Update State
        // Store SALES as the source of truth for restoration
        inputState[mode].sales = inputSales.value;
    }

    // 取得當前模式
    function getCurrentMode() {
        const activeTab = document.querySelector('.tab-btn.active');
        return activeTab ? activeTab.getAttribute('data-tab') : 'company';
    }

    // 輸入監聽器
    inputSales.addEventListener('input', (e) => {
        // e.target.value is updated.
        // inputState update happens inside calculate
        calculate('sales');
    });

    inputTotal.addEventListener('input', (e) => {
        calculate('total');
    });

    // 品項名稱監聽器
    const invItemName = document.getElementById('inv-item-name');
    inputItemName.addEventListener('input', (e) => {
        const mode = getCurrentMode();
        const val = e.target.value;
        inputState[mode].itemName = val;
        invItemName.textContent = val || '品項';
    });

    // Inner Clear Button Handler
    document.querySelectorAll('.inner-clear-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const targetId = btn.getAttribute('data-target');
            const targetInput = document.getElementById(targetId);
            if (targetInput) {
                targetInput.value = '';
                // Dispatch input event to trigger calculation/update
                targetInput.dispatchEvent(new Event('input', { bubbles: true }));
                targetInput.focus();
            }
        });
    });

    // 分頁切換監聽器：切換狀態與 UI
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const mode = tab.getAttribute('data-tab');

            // 還原該模式之前輸入的數值與文字
            inputSales.value = inputState[mode].sales || '';
            // Recalculate forward from sales
            calculate('sales');

            inputItemName.value = inputState[mode].itemName || '';
            invItemName.textContent = inputItemName.value || '品項';

            // 還原買受人資料
            if (buyerName) buyerName.value = inputState[mode].buyerName || '';
            if (buyerUbn) buyerUbn.value = inputState[mode].buyerUbn || '';

            // Update Label logic removed (Labels are static now)

            // 控制買受人區塊顯示 (Visibility Logic)
            const buyerHint = document.querySelector('.buyer-section .section-hint');
            if (mode === 'individual') {
                // 二聯式：顯示買受人區塊，但隱藏統編輸入框與提示
                buyerSection.style.display = 'block';
                const ubnGroup = buyerUbn.closest('.input-float-group');
                if (ubnGroup) ubnGroup.style.display = 'none';
                if (buyerHint) buyerHint.style.display = 'none';

                // 修改標籤文字
                const nameLabel = document.querySelector('label[for="buyer-name"]');
                if (nameLabel) nameLabel.textContent = '姓名';
            } else {
                // 三聯式：顯示完整買受人區塊 (包含統編與提示)
                buyerSection.style.display = 'block';
                const ubnGroup = buyerUbn.closest('.input-float-group');
                if (ubnGroup) ubnGroup.style.display = 'block';
                if (buyerHint) buyerHint.style.display = 'block';

                // 修改標籤文字
                const nameLabel = document.querySelector('label[for="buyer-name"]');
                if (nameLabel) nameLabel.textContent = '公司名稱';
            }

            // 使用還原的數值重新計算
            calculate();
        });
    });

    // 稅率選擇邏輯 (Tax Options)
    taxOptions.forEach(opt => {
        opt.addEventListener('click', () => {
            // 移除其他選項的啟用狀態
            // Remove active class
            taxOptions.forEach(o => o.classList.remove('active'));
            // 設定當前選項為啟用
            // Add active
            opt.classList.add('active');
            // 更新目前稅率值
            // Update val
            currentTaxRateVal = opt.getAttribute('data-value');
            // 重新計算
            // Recalculate
            calculate();
        });
    });

    // 重置按鈕邏輯 (Reset Button)
    // 清除所有輸入、狀態與暫存變數


    // --- 買受人自動查詢邏輯 (Buyer Auto-Lookup) ---
    const buyerUbn = document.getElementById('buyer-ubn');
    const buyerName = document.getElementById('buyer-name');
    const suggestionsList = document.getElementById('company-suggestions');
    let debounceTimer;

    // 試算預覽即時更新監聽器 (Real-time Preview)
    buyerUbn.addEventListener('input', (e) => {
        const mode = getCurrentMode();
        inputState[mode].buyerUbn = e.target.value;
        calculate();
    });

    // 買受人名稱輸入邏輯合併於下方的監聽器

    // 輔助函式：防抖動 (Debounce)
    function debounce(func, delay) {
        return function (...args) {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => func.apply(this, args), delay);
        };
    }

    // 輔助函式：關閉建議清單
    function closeSuggestions() {
        suggestionsList.innerHTML = '';
        suggestionsList.classList.remove('show');
    }



    // 事件：點擊外部區域以關閉建議清單
    document.addEventListener('click', (e) => {
        if (!buyerName.contains(e.target) && !suggestionsList.contains(e.target)) {
            closeSuggestions();
        }
    });

    // 事件：輸入統編 (UBN) -> 自動查詢公司名稱
    // 當輸入滿 8 碼時自動發送請求
    // 驗證統編邏輯 (Validate UBN Logic)
    function validateUBN(ubn) {
        if (!ubn || ubn.length !== 8) return false;

        const weights = [1, 2, 1, 2, 1, 2, 4, 1];
        let sum = 0;
        let sumWith7 = 0; // 當第七位是 7 時的第二種計算總和 (0)

        for (let i = 0; i < 8; i++) {
            const digit = parseInt(ubn[i]);
            let product = digit * weights[i];

            // 如果乘積大於 9，則將個位數與十位數相加
            // e.g., 2 * 6 = 12 -> 1 + 2 = 3
            // 其實就是 (Math.floor(n / 10) + n % 10)
            if (product > 9) {
                product = Math.floor(product / 10) + (product % 10);
            }
            sum += product;
        }

        // 基本判斷：總和是否能被 10 整除
        if (sum % 10 === 0) return true;

        // 特殊情況：第七位是 7
        if (ubn[6] === '7') {
            // 第七位是 7，乘數是 4，乘積是 28 -> 2+8=10 -> 加總多了10 (沒變)
            // 但如果我們用另一個算法...
            // 其實官方邏輯是：第七位數元與邏輯乘數之積，若為二位數，其個位數與十位數相加後大於 9 時... 沒那麼複雜
            // 簡化規則：如果第七位是 7，且 (總和 - 1) 能被 5 整除?? (舊算法)

            // 正確算法：當第 7 位數為 7 時，取 (原本總和 + 1) % 10 == 0 也算過
            // 因為 7*4=28, 2+8=10. 另一種是取 0? (7*4=28, 取 1+0 ? No)

            // 財政部規則說明：
            // 第七位數為 7 者，可將其乘積之和的十位數與個位數相加 (即 1+0=1)，或者取其乘積之和 (即 10)。
            // 第一種算法 (本程式上方邏輯) 產生了 10 (2+8=10)。
            // 第二種算法應該要在總和中只加 1 (1+0=1)。
            // 兩者相差 9 (10 - 1 = 9)。
            // 若原本的 sum (含 10) 不能被 10 整除，則檢查另一種情況：
            // (sum - 9) % 10 === 0  => 等同於 (sum + 1) % 10 === 0

            if ((sum + 1) % 10 === 0) return true;
        }

        return false;
    }

    const ubnErrorMsg = document.getElementById('ubn-error-msg');

    buyerUbn.addEventListener('input', async (e) => {
        const ubn = e.target.value.replace(/\D/g, ''); // 僅保留數字

        // 若需要強制限制輸入為純數字，可解除以下註解
        e.target.value = ubn;

        if (ubn.length === 8) {
            // 1. 執行邏輯驗證
            const isValid = validateUBN(ubn);
            if (!isValid) {
                e.target.classList.add('invalid');
                if (ubnErrorMsg) ubnErrorMsg.textContent = '統編可能有誤，請查明清楚';
            } else {
                e.target.classList.remove('invalid');
                if (ubnErrorMsg) ubnErrorMsg.textContent = '';
            }

            // 2. 執行查詢 (Lookup)
            try {
                const res = await fetch(`https://company.g0v.ronny.tw/api/show/${ubn}`);
                const data = await res.json();

                // 即使邏輯檢查失敗，如果 g0v 查得到資料，還是顯示 ( maybe user insists)
                // 或者如果查得到資料，代表其實是合法的 (邏輯可能有誤判?) -> 不，通常邏輯是鐵律。
                // 但為了保險，查得到就移除紅框
                if (data.data) {
                    // API 查獲資料
                    // 注意：不自動清除錯誤狀態 (保持使用者原本的互動習慣，不自動收回紅字)
                    // e.target.classList.remove('invalid');
                    // if (ubnErrorMsg) ubnErrorMsg.textContent = '';

                    const name = data.data["公司名稱"] || data.data["商業名稱"] || data.data["Company_Name"];
                    if (name) {
                        buyerName.value = name;
                        const mode = getCurrentMode();
                        inputState[mode].buyerName = name;
                        calculate();
                    }
                }
            } catch (err) {
                console.error('UBN Lookup failed', err);
            }
        } else {
            // 未滿 8 碼，先清除錯誤
            e.target.classList.remove('invalid');
            if (ubnErrorMsg) ubnErrorMsg.textContent = '';
        }
    });

    // 事件：輸入公司名稱 -> 自動查詢統編
    // 包含即時預覽更新、防抖動 (Debounce) 與請求中斷 (AbortController) 機制
    let currentSearchController = null; // 用於取消未完成的請求 (Race Condition 處理)

    buyerName.addEventListener('input', (e) => {
        const mode = getCurrentMode();
        inputState[mode].buyerName = e.target.value;
        // 1. 即時預覽更新
        calculate();

        // 若為個人模式 (二聯式)，不執行自動完成查詢
        if (mode === 'individual') {
            closeSuggestions();
            return;
        }

        // 2. 防抖動查詢 (Debounced Lookup)
        const query = e.target.value.trim();

        clearTimeout(debounceTimer);

        // 若有新的輸入，立即取消前一次未完成的請求
        if (currentSearchController) {
            currentSearchController.abort();
            currentSearchController = null;
        }

        if (query.length < 2) {
            closeSuggestions();
            return;
        }

        debounceTimer = setTimeout(async () => {
            currentSearchController = new AbortController();
            const signal = currentSearchController.signal;

            try {
                // 將 signal 傳入 fetch 以支援中斷用
                const res = await fetch(`https://company.g0v.ronny.tw/api/search?q=${encodeURIComponent(query)}`, { signal });
                const data = await res.json();

                if (data.data && data.data.length > 0) {
                    const matches = data.data.slice(0, 10);
                    renderSuggestions(matches);
                } else {
                    closeSuggestions();
                }
            } catch (err) {
                if (err.name === 'AbortError') {
                    // 忽略中斷錯誤 (使用者持續輸入中)
                    // Ignore abort errors (user kept typing)
                    return;
                }
                console.error('Name Lookup failed', err);
            } finally {
                currentSearchController = null;
            }
        }, 400); // 400ms delay
    });

    function renderSuggestions(companies) {
        suggestionsList.innerHTML = '';
        if (companies.length === 0) return;

        companies.forEach(company => {
            const name = company["公司名稱"] || company["商業名稱"] || company["Company_Name"];
            const ubn = company["統一編號"] || company["Unified_Business_No"] || company["Business_Accounting_NO"];
            const status = company["公司狀況"] || company["現況"] || "";
            const capital = company["資本總額(元)"] || company["Capital_Stock_Amount"] || "";
            const authority = company["登記機關"] || company["Company_Registration_Organisation_Name"] || "";

            // 顯示所有結果，非營業中狀態可標註顯示
            // Let's show all but maybe gray out non-active

            const item = document.createElement('div');
            item.className = 'suggestion-item';

            // 格式化資本額 (e.g. 1,000,000)
            const fmtCapital = capital ? formatNumber(capital) : '';

            item.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span class="comp-name">${name}</span>
                    <span class="comp-ubn" style="font-size: 0.9rem; color: #666;">#${ubn}</span>
                </div>
                <div style="font-size: 0.8rem; color: #888; margin-top: 4px; display: flex; gap: 8px;">
                    ${status ? `<span>${status}</span>` : ''}
                    ${authority ? `<span>| ${authority}</span>` : ''}
                    ${fmtCapital ? `<span>| 資本額: ${fmtCapital}</span>` : ''}
                </div>
            `;

            item.addEventListener('click', () => {
                buyerName.value = name;
                buyerUbn.value = ubn;
                const mode = getCurrentMode();
                inputState[mode].buyerName = name;
                inputState[mode].buyerUbn = ubn;
                closeSuggestions();
                calculate();
            });

            suggestionsList.appendChild(item);
        });

        suggestionsList.classList.add('show');
    }

    // 初始化視圖 (Initialize View)
    // Initialize label
    // 初始化視圖 (Initialize View)
    // Labels are now static, no need to update.
    calculate();
    // 閉包結構結束，後續為 updateInvoicePreview 函式定義
    // Closure continues to include updateInvoicePreview


    // 發票預覽更新主要邏輯 (Main Invoice Preview Update Function)
    // 負責將計算結果填入下方的發票預覽表格中
    function updateInvoicePreview(sales, tax, total, mode, isTaxFree, rateVal, chineseStr, bodyAmount) {


        // 0. 優先更新內容：品項金額 (直接使用傳入的 bodyAmount)
        try {
            // bodyAmount 來自 calculate() 傳入的 sales (or total)
            const numVal = bodyAmount;
            const strVal = (numVal !== undefined && numVal !== null && !isNaN(numVal)) ? formatNumber(numVal) : '0';

            const invPrice = document.getElementById('inv-price');
            const invAmount = document.getElementById('inv-amount');
            if (invPrice) invPrice.textContent = strVal;
            if (invAmount) invAmount.textContent = strVal;
        } catch (e) {
            console.error('Body update check failed', e);
        }

        // 1. 日期計算 (民國年 & 期別)
        // 自動計算中華民國年份與當期月份區間
        const now = new Date();
        let rocYear = now.getFullYear() - 1911;
        const month = now.getMonth() + 1;
        const day = now.getDate();

        // Calculate Invoice Period (2 months per period)
        // Period 1: 1-2, Period 2: 3-4, ..., Period 6: 11-12
        // 計算發票期別 (每兩個月一期)
        // 第一期: 1-2月, 第二期: 3-4月 ... 第六期: 11-12月
        const periodGroup = Math.ceil(month / 2); // 1 to 6
        const periodStart = (periodGroup * 2) - 1;
        const periodEnd = periodGroup * 2;

        // 輔助函式：將數字 1-12 轉為中文數字 (Helper for simple Chinese numbers)
        const toChineseMonth = (m) => {
            const map = { 1: '一', 2: '二', 3: '三', 4: '四', 5: '五', 6: '六', 7: '七', 8: '八', 9: '九', 10: '十', 11: '十一', 12: '十二' };
            return map[m] || m;
        };

        const pStartChi = toChineseMonth(periodStart);
        const pEndChi = toChineseMonth(periodEnd);

        // 更新上方標題的年份與期別月份 (Update Top Header)
        const topYearEl = document.getElementById('inv-top-year');
        const topMonthsGroup = document.getElementById('inv-top-months-group');

        if (topYearEl) topYearEl.textContent = rocYear;

        // 插入 HTML：顯示藍色的起始與結束月份，中間用黑色頓號分隔
        // Inject HTML for Blue Month Names + Black Separator
        if (topMonthsGroup) {
            topMonthsGroup.innerHTML = `<span class="write-font-simple" style="color: #4338ca;">${pStartChi}</span>、<span class="write-font-simple" style="color: #4338ca;">${pEndChi}</span>`;
        }

        // 更新買受人區塊的開立日期 (Update Issue Date)
        document.getElementById('inv-year').textContent = rocYear;
        document.getElementById('inv-month').textContent = month.toString().padStart(2, '0');
        document.getElementById('inv-day').textContent = day.toString().padStart(2, '0');

        // 2. 標題與發票類型切換 (三聯/二聯)
        // 根據目前模式顯示對應的欄位與文字
        const invTitle = document.getElementById('inv-type-title');
        if (mode === 'company') {
            invTitle.textContent = '統 一 發 票 （ 三 聯 式 ）';

            // 三聯式顯示邏輯 (3-Ply View Logic)
            const date2 = document.getElementById('inv-header-date-2ply');
            if (date2) date2.style.display = 'none';

            const ubnRow = document.getElementById('inv-ubn-row');
            if (ubnRow) ubnRow.style.display = 'flex';

            const salesRow = document.getElementById('inv-row-sales');
            if (salesRow) salesRow.style.display = 'flex';

            const taxRow3 = document.getElementById('inv-row-tax-3ply');
            if (taxRow3) taxRow3.style.display = 'flex';

            const taxRow2 = document.getElementById('inv-row-tax-2ply');
            if (taxRow2) taxRow2.style.display = 'none';

            // 顯示三聯式注意事項 (Show Footer Note)
            const footerNote = document.querySelector('.inv-footer-note');
            if (footerNote) footerNote.style.display = 'flex';

        } else {
            invTitle.textContent = '統 一 發 票 （ 二 聯 式 ）';

            // 二聯式顯示邏輯 (2-Ply View Logic)
            // 填寫二聯式日期欄位 (Header)
            const y2 = document.getElementById('inv-year-2');
            const m2 = document.getElementById('inv-month-2');
            const d2 = document.getElementById('inv-day-2');
            if (y2) y2.textContent = rocYear;
            if (m2) m2.textContent = month.toString().padStart(2, '0');
            if (d2) d2.textContent = day.toString().padStart(2, '0');

            const date2 = document.getElementById('inv-header-date-2ply');
            if (date2) date2.style.display = 'flex'; // 使用 Flex 置中

            // 隱藏三聯式專用區塊 (Hide 3-Ply Specifics)
            const ubnRow = document.getElementById('inv-ubn-row');
            if (ubnRow) ubnRow.style.display = 'none';

            const salesRow = document.getElementById('inv-row-sales');
            if (salesRow) salesRow.style.display = 'none';

            const taxRow3 = document.getElementById('inv-row-tax-3ply');
            if (taxRow3) taxRow3.style.display = 'none';

            // 顯示二聯式營業稅區塊 (位於底部)
            const taxRow2 = document.getElementById('inv-row-tax-2ply');
            if (taxRow2) taxRow2.style.display = 'flex';

            // 顯示二聯式注意事項 (Show Footer Note - same as 3-ply)
            const footerNote = document.querySelector('.inv-footer-note');
            if (footerNote) footerNote.style.display = 'flex';

        }

        // 3. 買受人資訊與統編方格填寫
        // 處理必填提示與統編分格顯示
        const ubnInput = document.getElementById('buyer-ubn').value || '';
        const nameInput = document.getElementById('buyer-name').value || '';

        // 填寫名稱與預設文字 (必填提示) (required-placeholder logic)
        const invBuyerName = document.getElementById('inv-buyer-name');
        if (invBuyerName) {
            if (!nameInput) {
                invBuyerName.innerHTML = '<span class="required-placeholder" style="color: #4338ca; opacity: 0.5;">必填</span>';
            } else {
                invBuyerName.textContent = nameInput;
            }
        }

        // 填寫統編與方格邏輯 (Fill UBN Boxes)
        const ubnClean = ubnInput.replace(/\D/g, ''); // 僅保留數字
        const ubnBoxesContainer = document.getElementById('inv-ubn-boxes');
        if (ubnBoxesContainer) {
            // 取得所有格子 (預期 8 格)
            // Target all spans (expected 8) - use children to avoid nested spans
            const allSpans = Array.from(ubnBoxesContainer.children);

            // 先全部清空 (innerHTML 清除巢狀 span)
            // Clear all first
            allSpans.forEach(span => span.innerHTML = '');

            if (!ubnClean) {
                // 空值狀態：前兩格顯示「必填」提示
                if (allSpans[0]) allSpans[0].innerHTML = '<span class="required-ph" style="color: #4338ca; opacity: 0.5; font-size: 0.8rem;">必</span>';
                if (allSpans[1]) allSpans[1].innerHTML = '<span class="required-ph" style="color: #4338ca; opacity: 0.5; font-size: 0.8rem;">填</span>';
            } else {
                // 填入數字
                for (let i = 0; i < Math.min(ubnClean.length, 8); i++) {
                    if (allSpans[i]) allSpans[i].textContent = ubnClean[i];
                }
            }
        } else {
            // 舊版無方格的備用方案 (Fallback)
            const oldUbn = document.getElementById('inv-buyer-ubn');
            if (oldUbn) oldUbn.textContent = ubnInput;
        }



        // 5. 頁腳表格數值填寫 (銷售額/稅額/總計)
        document.getElementById('inv-sales-amt').textContent = formatNumber(sales);
        document.getElementById('inv-tax-amt').textContent = formatNumber(tax);
        document.getElementById('inv-total').textContent = formatNumber(total);

        // 填寫中文大寫金額欄位 (Chinese Numeral Grid)
        // 將總金額轉換為中文大寫數字，並逐格填入
        const digitsMap = ['零', '壹', '貳', '參', '肆', '伍', '陸', '柒', '捌', '玖'];
        const totalStr = Math.round(total).toString();
        const len = totalStr.length;

        // 先清空所有格子的數字
        const digitSpans = document.querySelectorAll('.chn-digit');
        digitSpans.forEach(sp => {
            sp.textContent = '';
            if (sp.parentElement) sp.parentElement.classList.remove('chn-strike');
        });

        // 從右側開始填入 (個位數為 pos 0)
        // 並為左側的空值格子加上刪除線 (Strikeout)
        // 最大位數為 8 (億)
        const maxDigitIndex = len - 1; // e.g. 100 -> len 3 -> max index 2 (佰)

        for (let i = 0; i <= 8; i++) {
            const targetSpan = document.querySelector(`.chn-digit[data-pos="${i}"]`);
            if (!targetSpan) continue;

            if (i <= maxDigitIndex) {
                // 填入數字
                const digitChar = totalStr[len - 1 - i];
                const digitInt = parseInt(digitChar);
                const chinChar = digitsMap[digitInt];
                targetSpan.textContent = chinChar;
            } else {
                // 左側前導空格：在父元素加上刪除線樣式
                if (targetSpan.parentElement) {
                    targetSpan.parentElement.classList.add('chn-strike');
                }
            }
        }

        // 6. 稅率勾選框同步
        // 根據選擇的稅率模式，在對應的格子打勾
        const checkV = '✓';
        // 清除三聯式與二聯式的所有勾選狀態
        // Clear marks in both 3-ply and 2-ply rows
        ['mark-taxable', 'mark-zero', 'mark-free', 'mark-taxable-2', 'mark-zero-2', 'mark-free-2'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.textContent = '';
        });

        if (rateVal === '0') {
            const el1 = document.getElementById('mark-zero');
            const el2 = document.getElementById('mark-zero-2');
            if (el1) el1.textContent = checkV;
            if (el2) el2.textContent = checkV;
        } else if (rateVal === 'free') {
            const el1 = document.getElementById('mark-free');
            const el2 = document.getElementById('mark-free-2');
            if (el1) el1.textContent = checkV;
            if (el2) el2.textContent = checkV;
        } else {
            const el1 = document.getElementById('mark-taxable');
            const el2 = document.getElementById('mark-taxable-2');
            if (el1) el1.textContent = checkV;
            if (el2) el2.textContent = checkV;
        }
    }

    // --- 歷史紀錄功能 (History Feature) ---
    // 重新抓取按鈕以防萬一
    const saveInvoiceBtn = document.getElementById('save-invoice-btn');
    const historySection = document.getElementById('history-section');
    const historyList = document.getElementById('history-list');
    const clearHistoryBtn = document.getElementById('clear-history-btn');
    const historyEmptyMsg = document.getElementById('history-empty-msg');

    if (!saveInvoiceBtn) {
        console.error('Critical Error: Save button not found in DOM');
    } else {
        console.log('Save button found, attaching listener');
    }

    // 讀取暫存資料
    let savedInvoices = JSON.parse(localStorage.getItem('invoice_helper_history')) || [];

    // 初始化：渲染列表

    renderHistory();

    // 儲存當前發票
    if (saveInvoiceBtn) {
        saveInvoiceBtn.addEventListener('click', () => {
            console.log('Save button clicked');

            // 安全獲取當前模式
            let mode = 'company';
            if (typeof getCurrentMode === 'function') {
                mode = getCurrentMode();
            } else {
                console.warn('getCurrentMode not found, defaulting to company');
            }

            // 重新獲取 DOM 元素以確保最新狀態
            const inputSalesEl = document.getElementById('input-sales-amount');
            const inputTotalEl = document.getElementById('input-total-amount');
            const displayTaxEl = document.getElementById('display-tax-amount');

            const buyerUbnEl = document.getElementById('buyer-ubn');
            const buyerNameEl = document.getElementById('buyer-name');
            const inputItemNameEl = document.getElementById('input-item-name');

            const totalVal = parseFloat(inputTotalEl.value);

            if (isNaN(totalVal) || totalVal < 0) { // Allow 0? usually 0 invoice is valid? Let's require > 0
                alert('請輸入有效的金額！');
                return;
            }

            const now = new Date();
            const timestamp = now.getTime();
            const dateStr = `${now.getFullYear()}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getDate().toString().padStart(2, '0')} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

            // 收集資料
            const ubn = (mode === 'company') ? (buyerUbnEl.value || '') : '';
            const name = (mode === 'company') ? (buyerNameEl.value || '') : (buyerNameEl.value || '');
            const itemName = inputItemNameEl.value || '品項';

            // 取得計算結果 (去除千位分隔符)
            // Sales & Total come from Input Values (Raw)
            // Tax comes from input value (fmt)
            const salesStr = inputSalesEl.value; // Raw number
            const taxStr = displayTaxEl.value.replace(/,/g, '');
            const totalStr = inputTotalEl.value; // Raw number

            const newInvoice = {
                id: timestamp.toString(),
                date: dateStr,
                mode: mode, // 'company' or 'individual'
                buyer: {
                    ubn: ubn,
                    name: name
                },
                item: {
                    name: itemName
                },
                amounts: {
                    sales: parseInt(salesStr) || 0,
                    tax: parseInt(taxStr) || 0,
                    total: parseInt(totalStr) || 0,
                    taxType: currentTaxRateVal // '0.05', '0', 'free'
                }
            };

            // 加入陣列開頭
            savedInvoices.unshift(newInvoice);
            // 存入 LocalStorage
            saveToLocalStorage();

            // 雲端同步 (如果是在伺服器環境)
            if (typeof syncToCloud === 'function') {
                syncToCloud(newInvoice);
            }

            // 重新渲染
            renderHistory();

            // 發票連號自動 +1
            if (typeof incrementInvoiceNumber === 'function') {
                incrementInvoiceNumber();
            }

            // 滾動到紀錄區塊
            const historySectionEl = document.getElementById('history-section');
            if (historySectionEl) {
                historySectionEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }


        });
    }

    // 渲染歷史列表
    function renderHistory() {
        // 重新抓取容器，確保 DOM 更新後仍有效
        const historySectionEl = document.getElementById('history-section');
        const historyListEl = document.getElementById('history-list');
        const historyEmptyMsgEl = document.getElementById('history-empty-msg');
        const clearHistoryBtnEl = document.getElementById('clear-history-btn');
        const historyFooter = document.getElementById('history-summary-footer');
        const elSumSales = document.getElementById('sum-sales');
        const elSumTax = document.getElementById('sum-tax');
        const elSumTotal = document.getElementById('sum-total');

        const currentMode = getCurrentMode();
        const displayList = savedInvoices.filter(inv => inv.mode === currentMode);

        console.log(`Rendering History for ${currentMode}, count:`, displayList.length);

        if (!historyListEl || !historySectionEl) {
            console.error('History DOM elements missing');
            return;
        }

        historyListEl.innerHTML = '';

        if (displayList.length === 0) {
            // 沒資料時
            historySectionEl.style.display = 'block'; // 保持顯示但 Empty
            historyEmptyMsgEl.style.display = 'block';
            historyListEl.style.display = 'none';
            if (clearHistoryBtnEl) clearHistoryBtnEl.style.display = 'none';
            if (historyFooter) historyFooter.style.display = 'none'; // Hide footer when empty
            return;
        }

        historySectionEl.style.display = 'block';
        historyEmptyMsgEl.style.display = 'none';
        historyListEl.style.display = 'block';
        if (clearHistoryBtnEl) clearHistoryBtnEl.style.display = 'none'; // Always hide global clear btn
        if (historyFooter) historyFooter.style.display = 'flex'; // Show footer when not empty

        // 計算總和
        let sumSales = 0;
        let sumTax = 0;
        let sumTotal = 0;

        // 產生 HTML (Grouping Logic)
        let lastPeriod = null;
        const htmlParts = [];

        // 分組統計變數
        let groupSales = 0;
        let groupTax = 0;
        let groupTotal = 0;

        // 輔助函式：產生分組頁腳 HTML
        const createGroupFooter = (sales, tax, total) => {
            return `
                <div class="history-summary-footer">
                    <div class="summary-item">
                        <span class="label">未稅小計</span>
                        <span class="value">$${formatNumber(sales)}</span>
                    </div>
                    <div class="summary-item">
                        <span class="label">稅額小計</span>
                        <span class="value md-red">$${formatNumber(tax)}</span>
                    </div>
                    <div class="summary-item">
                        <span class="label">總計</span>
                        <span class="value lg-strong">$${formatNumber(total)}</span>
                    </div>
                </div>
            `;
        };

        // 確保依照日期降序排列 (最新的在最上面)
        displayList.sort((a, b) => {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            return dateB - dateA; // Descending
        });

        displayList.forEach((inv, index) => {
            // 1. 計算期別 (民國年 + 雙月)
            const d = new Date(inv.date);
            const rocYear = d.getFullYear() - 1911;
            const month = d.getMonth() + 1; // 1-12
            let periodText = '';

            // 判斷雙月期別
            if (month <= 2) periodText = '一、二月份';
            else if (month <= 4) periodText = '三、四月份';
            else if (month <= 6) periodText = '五、六月份';
            else if (month <= 8) periodText = '七、八月份';
            else if (month <= 10) periodText = '九、十月份';
            else periodText = '十一、十二月份';

            const currentPeriod = `${rocYear}年 ${periodText}`;

            // 2. 判斷是否換組 (如果期別改變)
            if (currentPeriod !== lastPeriod) {
                // 如果不是第一組，代表上一組結束了，要印出上一組的頁腳
                if (lastPeriod !== null) {
                    htmlParts.push(createGroupFooter(groupSales, groupTax, groupTotal));
                    // 重置統計
                    groupSales = 0;
                    groupTax = 0;
                    groupTotal = 0;
                }

                // 印出新組別的標頭 (包含清除本期按鈕)
                // Note: using data-period attribute for easy identification
                htmlParts.push(`
                    <div class="history-group-header">
                        <span>${currentPeriod}</span>
                        <button class="btn-clear-group" data-period="${currentPeriod}">清除本期</button>
                    </div>
                `);
                lastPeriod = currentPeriod;
            }

            // 3. 累加當前發票金額到「分組」統計
            const totalAmt = inv.amounts && inv.amounts.total ? Number(inv.amounts.total) : 0;
            const salesAmt = inv.amounts && inv.amounts.sales ? Number(inv.amounts.sales) : 0;
            const taxAmt = inv.amounts && inv.amounts.tax ? Number(inv.amounts.tax) : 0;

            groupSales += salesAmt;
            groupTax += taxAmt;
            groupTotal += totalAmt;

            // 4. 插入發票項目 (原邏輯)
            const isCompany = (inv.mode === 'company');
            const typeLabel = isCompany ? '三聯' : '二聯';
            const typeClass = isCompany ? 'company' : 'individual';

            let buyerDisplay = inv.buyer.name || (isCompany ? '未填寫公司' : '未填寫姓名');
            if (isCompany && inv.buyer.ubn) {
                buyerDisplay += ` (#${inv.buyer.ubn})`;
            }



            // 注意：這裡是全部加總，所以即使分組顯示，總計還是算所有的 (符合需求)
            // Note: Total calculation is done outside this loop in the original code? 
            // Wait, previously sum calculation was inside the map execution.
            // Since we changed map to forEach, we need to ensure sums are accumulated.
            // But wait, the previous code had sum variables declared before the loop.
            // So we just need to add the sum logic here.



            const itemName = inv.item && inv.item.name ? inv.item.name : '品項';
            const isSpecialTax = inv.amounts && inv.amounts.taxType !== '0.05';

            const safeBuyer = String(buyerDisplay).replace(/[<&]/g, '');
            const safeItem = String(itemName).replace(/[<&]/g, '');

            const trashIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`;

            htmlParts.push(`
            <li class="history-item">
                <div class="history-info" style="flex: 0 0 45%;">
                    <div class="h-top-row">
                        <span class="h-tag ${typeClass}">${typeLabel}</span>
                        <span class="h-date">${inv.date}</span>
                    </div>
                    <div style="margin-top: 4px;">
                        <span class="h-name">${safeBuyer}</span>
                    </div>
                    <div style="margin-top: 0;">
                        <span style="color: #0f172a; font-size: 1.1rem; font-weight: 700;">
                            ${safeItem}
                        </span>
                        ${isSpecialTax ? '<span style="color: #ef4444; font-size: 0.8rem; margin-left: 4px;">(特殊稅率)</span>' : ''}
                    </div>
                </div>
                
                <div style="flex: 1; min-width: 0; text-align: right; padding-right: 16px; display: flex; align-items: center; justify-content: flex-end;">
                    <div style="display: flex; flex-direction: column; align-items: flex-end; margin-right: 12px; gap: 4px;">
                        ${salesAmt ? `<span style="font-size: 0.75rem; color: #64748b; background: #f1f5f9; padding: 2px 6px; border-radius: 6px; font-weight: 600; white-space: nowrap;">未稅 $${formatNumber(salesAmt)}</span>` : ''}
                        ${taxAmt > 0 ? `<span style="font-size: 0.75rem; color: #ef4444; background: #fee2e2; padding: 2px 6px; border-radius: 6px; font-weight: 600; white-space: nowrap;">稅 $${formatNumber(taxAmt)}</span>` : ''}
                    </div>
                    <span class="h-amount" style="font-size: 2.4rem; line-height: 1;">$${formatNumber(totalAmt)}</span>
                </div>
                <button class="btn-delete" type="button" title="刪除" data-id="${inv.id}">
                    ${trashIcon}
                </button>
            </li>
            `);
            // 如果是最後一筆，要印出最後一組的頁腳
            if (index === displayList.length - 1) {
                htmlParts.push(createGroupFooter(groupSales, groupTax, groupTotal));
            }
        });

        const htmlStr = htmlParts.join('');

        // 隱藏全域匯總 (因為已經改為分組顯示了)
        // Hide global footer since we show sub-totals now
        if (historyFooter) historyFooter.style.display = 'none';

        historyListEl.innerHTML = htmlStr;

        // 重新綁定刪除按鈕
        const delBtns = historyListEl.querySelectorAll('.btn-delete');
        delBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = btn.getAttribute('data-id');
                deleteInvoice(id);
            });
        });

        // 綁定「清除本期」按鈕
        const clearGroupBtns = historyListEl.querySelectorAll('.btn-clear-group');
        clearGroupBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const period = btn.getAttribute('data-period');
                deletePeriod(period);
            });
        });
    }

    // 刪除整期
    function deletePeriod(periodName) {
        if (!confirm(`確定要清除 [${periodName}] 的所有發票嗎？`)) return;

        // 我們需要重新計算每一筆的 period，如果不吻合才保留
        // Re-using logic to calculate period for filtering
        savedInvoices = savedInvoices.filter(inv => {
            const d = new Date(inv.date);
            const rocYear = d.getFullYear() - 1911;
            const month = d.getMonth() + 1;
            let periodText = '';

            if (month <= 2) periodText = '一、二月份';
            else if (month <= 4) periodText = '三、四月份';
            else if (month <= 6) periodText = '五、六月份';
            else if (month <= 8) periodText = '七、八月份';
            else if (month <= 10) periodText = '九、十月份';
            else periodText = '十一、十二月份';

            const pName = `${rocYear}年 ${periodText}`;

            // 如果期別名稱相同，就移除 (回傳 false)
            return pName !== periodName;
        });

        saveToLocalStorage();
        renderHistory();
    }

    // 刪除單筆
    function deleteInvoice(id) {
        if (!confirm('確定要刪除這筆紀錄嗎？')) return;
        savedInvoices = savedInvoices.filter(inv => inv.id !== id);
        saveToLocalStorage();
        renderHistory();
    }

    // 清除全部
    if (clearHistoryBtn) {
        clearHistoryBtn.addEventListener('click', () => {
            const currentMode = getCurrentMode();
            // 檢查是否有該模式的紀錄
            const hasData = savedInvoices.some(inv => inv.mode === currentMode);

            if (!hasData) return;

            if (confirm('確定要清空此模式的所有暫存紀錄嗎？此動作無法復原。')) {
                // 只保留非當前模式的紀錄
                savedInvoices = savedInvoices.filter(inv => inv.mode !== currentMode);
                saveToLocalStorage();
                renderHistory();
            }
        });
    }

    // --- 資料匯出/匯入邏輯 (Data Export/Import) ---
    const btnExport = document.getElementById('btn-export');
    const btnImport = document.getElementById('btn-import');
    const fileImport = document.getElementById('file-import');

    if (btnExport) {
        btnExport.addEventListener('click', () => {
            const currentMode = getCurrentMode();
            // Filter by current mode
            const filteredData = savedInvoices.filter(inv => inv.mode === currentMode);

            let buyerChips = [];
            let itemChipsCompany = [];
            let itemChipsIndividual = [];

            try { buyerChips = JSON.parse(localStorage.getItem('invoice_quick_buyer_chips')) || []; } catch (e) {}
            try { itemChipsCompany = JSON.parse(localStorage.getItem('invoice_quick_item_chips_company')) || []; } catch (e) {}
            try { itemChipsIndividual = JSON.parse(localStorage.getItem('invoice_quick_item_chips_individual')) || []; } catch (e) {}

            const exportPayload = {
                version: 2,
                exportDate: new Date().toISOString(),
                mode: currentMode,
                invoices: filteredData,
                quickBuyerChips: buyerChips,
                quickItemChipsCompany: itemChipsCompany,
                quickItemChipsIndividual: itemChipsIndividual
            };

            const dataStr = JSON.stringify(exportPayload, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');

            // 產生檔名 invoice_history_MODE_YYYYMMDD.json
            const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
            const filenameMode = (currentMode === 'company') ? 'company' : 'individual';

            a.href = url;
            a.download = `invoice_history_${filenameMode}_${date}.json`;
            document.body.appendChild(a);
            a.click();
            // Update last backup date
            localStorage.setItem('invoice_last_backup_date', new Date().toISOString());
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        });
    }

    // 匯出 CSV 邏輯
    const btnExportCsv = document.getElementById('btn-export-csv');
    if (btnExportCsv) {
        btnExportCsv.addEventListener('click', () => {
            const currentMode = getCurrentMode();
            // Filter by current mode
            const filteredData = savedInvoices.filter(inv => inv.mode === currentMode);

            if (!filteredData || filteredData.length === 0) {
                alert('目前模式下沒有任何暫存紀錄可匯出');
                return;
            }

            // CSV Header
            const headers = ['開立編號', '模式', '日期', '買受人統編', '買受人名稱', '品項名稱', '銷售額', '稅額', '總計'];

            // Build CSV Content
            let csvContent = '\uFEFF' + headers.join(',') + '\n';

            filteredData.forEach(inv => {
                const modeName = (inv.mode === 'company') ? '三聯式' : '二聯式';
                const ubn = inv.buyer ? (inv.buyer.ubn || '') : '';
                const name = inv.buyer ? (inv.buyer.name || '').replace(/"/g, '""') : '';
                const item = inv.item ? (inv.item.name || '').replace(/"/g, '""') : '';
                const sales = inv.amounts ? inv.amounts.sales : 0;
                const tax = inv.amounts ? inv.amounts.tax : 0;
                const total = inv.amounts ? inv.amounts.total : 0;

                const row = [
                    inv.id,
                    modeName,
                    inv.date,
                    `"${ubn}"`,
                    `"${name}"`,
                    `"${item}"`,
                    sales,
                    tax,
                    total
                ];
                csvContent += row.join(',') + '\n';
            });

            // Download
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
            const filenameMode = (currentMode === 'company') ? 'company' : 'individual';

            a.href = url;
            a.download = `invoice_${filenameMode}_${date}.csv`;
            document.body.appendChild(a);
            a.click();
            // Update last backup date
            localStorage.setItem('invoice_last_backup_date', new Date().toISOString());
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        });
    }

    if (btnImport) {
        btnImport.addEventListener('click', () => {
            fileImport.click();
        });
    }

    if (fileImport) {
        fileImport.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            // 檢查檔案大小
            if (file.size === 0) {
                alert('匯入失敗：檔案內容為空。');
                fileImport.value = '';
                return;
            }

            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const importedRaw = JSON.parse(event.target.result);
                    let targetInvoices = [];
                    let importedBuyerChips = null;
                    let importedItemChipsCompany = null;
                    let importedItemChipsIndividual = null;

                    if (Array.isArray(importedRaw)) {
                        // 相容舊版陣列格式 JSON
                        targetInvoices = importedRaw;
                    } else if (importedRaw && typeof importedRaw === 'object') {
                        // 新版帶有膠囊資料的打包備份格式
                        targetInvoices = Array.isArray(importedRaw.invoices) ? importedRaw.invoices : [];
                        if (Array.isArray(importedRaw.quickBuyerChips)) importedBuyerChips = importedRaw.quickBuyerChips;
                        if (Array.isArray(importedRaw.quickItemChipsCompany)) importedItemChipsCompany = importedRaw.quickItemChipsCompany;
                        if (Array.isArray(importedRaw.quickItemChipsIndividual)) importedItemChipsIndividual = importedRaw.quickItemChipsIndividual;
                    } else {
                        alert('檔案格式錯誤：內容非有效的發票備份資料。');
                        fileImport.value = '';
                        return;
                    }

                    let count = 0;
                    const existingIds = new Set(savedInvoices.map(i => i.id));
                    targetInvoices.forEach(item => {
                        if (item.id && !existingIds.has(item.id)) {
                            savedInvoices.push(item);
                            count++;
                        }
                    });

                    // 復原常用膠囊 (Quick Chips)
                    let chipsRestoredCount = 0;
                    if (importedBuyerChips) {
                        localStorage.setItem('invoice_quick_buyer_chips', JSON.stringify(importedBuyerChips));
                        if (typeof renderBuyerChips === 'function') renderBuyerChips();
                        chipsRestoredCount++;
                    }
                    if (importedItemChipsCompany) {
                        localStorage.setItem('invoice_quick_item_chips_company', JSON.stringify(importedItemChipsCompany));
                        chipsRestoredCount++;
                    }
                    if (importedItemChipsIndividual) {
                        localStorage.setItem('invoice_quick_item_chips_individual', JSON.stringify(importedItemChipsIndividual));
                        chipsRestoredCount++;
                    }
                    if (typeof renderItemChips === 'function') renderItemChips(getCurrentMode());

                    if (count > 0 || chipsRestoredCount > 0) {
                        saveToLocalStorage();
                        renderHistory();
                        let msg = `成功匯入！\n- 發票紀錄：新增 ${count} 筆`;
                        if (chipsRestoredCount > 0) {
                            msg += `\n- 常用膠囊：已同步更新完整復原`;
                        }
                        alert(msg);
                    } else {
                        alert('沒有新資料可匯入 (資料已存在或格式不符)。');
                    }
                } catch (err) {
                    console.error('Import failed', err);
                    alert('匯入失敗：' + err.message + '\n請確認檔案未損壞且為標準 JSON 格式。');
                }
                // Reset value
                fileImport.value = '';
            };
            reader.onerror = () => {
                alert('匯入失敗：無法讀取檔案。');
                fileImport.value = '';
            };
            reader.readAsText(file);
        });
    }

    // 存入 LocalStorage
    function saveToLocalStorage() {
        localStorage.setItem('invoice_helper_history', JSON.stringify(savedInvoices));
    }


    // [Cloud Backend Removed for Local Stability]

    // ==========================================
    // RWD Invoice Scaling Logic (Updated)
    // ==========================================
    function resizeInvoicePreview() {
        // We scale the PAPER inside the CONTAINER.
        // The Section holds the Header + Container.
        const scaleContainer = document.querySelector('.invoice-scale-container');
        const paper = document.querySelector('.invoice-paper');

        if (!scaleContainer || !paper) return;

        // Base width of the invoice paper
        const baseWidth = 800; // Fixed width in CSS

        // Get valid width of the container
        const availableWidth = scaleContainer.clientWidth;

        if (availableWidth < baseWidth && availableWidth > 0) {
            const scale = availableWidth / baseWidth;

            // Set scale
            paper.style.transform = `scale(${scale})`;
            paper.style.transformOrigin = 'top center'; // ensure centering

            // Adjust container height to match scaled content
            // The paper takes up 'baseHeight' * scale space vertically.
            const scaledHeight = paper.offsetHeight * scale;
            scaleContainer.style.height = `${scaledHeight}px`;

            // Ensure width is set to avoid overflow
            // scaleContainer.style.width = '100%'; // Already set in HTML/CSS
        } else {
            // Reset
            paper.style.transform = 'none';
            scaleContainer.style.height = 'auto'; // or remove style
        }
    }

    // Run on load, resize, and mutations
    // Run on load
    resizeInvoicePreview();

    // Enable animations after initial load to prevent jump
    setTimeout(() => {
        const previewSection = document.querySelector('.invoice-preview-section');
        if (previewSection) {
            previewSection.classList.add('ready');
        }
    }, 100);

    // 1. ResizeObserver: Watch container width changes
    const scaleContainer = document.querySelector('.invoice-scale-container');
    if (scaleContainer) {
        const resizeObserver = new ResizeObserver(() => {
            resizeInvoicePreview();
        });
        resizeObserver.observe(scaleContainer);
    }

    // 2. MutationObserver: Watch for content changes (height changes)
    // When switching modes (Hidden/Shown rows), offsetHeight changes.
    const paper = document.querySelector('.invoice-paper');
    if (paper) {
        const mutationObserver = new MutationObserver(() => {
            resizeInvoicePreview();
        });
        mutationObserver.observe(paper, {
            attributes: true,
            childList: true,
            subtree: true,
            characterData: true
        });
    }

    // Add listener to tabs (legacy fallback)
    tabs.forEach(tab => tab.addEventListener('click', () => {
        // Observers should handle it, but double check
        resizeInvoicePreview();
    }));


    // ==========================================
    // New Features: Quick Presets & Copy Summary
    // ==========================================

    const presetListId = 'item-name-presets';
    const storageKeyPresets = 'invoice_item_presets';

    function loadItemPresets() {
        const listEl = document.getElementById(presetListId);
        if (!listEl) return;

        // 預設常用詞
        const defaults = ["設計費", "服務費", "工程款", "顧問費", "訂金", "尾款", "網站製作", "系統開發"];
        let stored = JSON.parse(localStorage.getItem(storageKeyPresets) || '[]');

        // 合併並去重
        const allPresets = Array.from(new Set([...defaults, ...stored]));

        listEl.innerHTML = allPresets.map(val => `<option value="${val}"></option>`).join('');
    }

    function saveItemPreset(name) {
        if (!name || name.trim().length < 2) return;
        let stored = JSON.parse(localStorage.getItem(storageKeyPresets) || '[]');
        if (!stored.includes(name)) {
            if (stored.length >= 20) stored.shift(); // 最多記20個
            stored.push(name);
            localStorage.setItem(storageKeyPresets, JSON.stringify(stored));
            loadItemPresets();
        }
    }

    // 初始化選單
    loadItemPresets();

    // 綁定儲存按鈕，順便記憶品項
    const saveBtn = document.getElementById('save-invoice-btn');
    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            const name = document.getElementById('input-item-name').value;
            saveItemPreset(name);
        });
    }

    // 複製摘要功能
    const copyBtn = document.getElementById('copy-summary-btn');
    if (copyBtn) {
        // Initial state: Disabled
        copyBtn.disabled = true;

        copyBtn.addEventListener('click', () => {
            const mode = getCurrentMode(); // 'company' or 'individual'
            // Format Date: YYYY / MM / DD
            const now = new Date();
            const dateStr = now.getFullYear() + ' / ' + String(now.getMonth() + 1).padStart(2, '0') + ' / ' + String(now.getDate()).padStart(2, '0');

            const buyerNameVal = document.getElementById('buyer-name').value || (mode === 'company' ? '' : '個人');
            const buyerUbnVal = document.getElementById('buyer-ubn').value || '';
            const itemNameVal = document.getElementById('input-item-name').value || '品項';

            // Get raw values
            const salesVal = document.getElementById('input-sales-amount').value || '0';
            const totalVal = document.getElementById('input-total-amount').value || '0';

            // Calculate tax safely
            let taxNum = parseInt(totalVal) - parseInt(salesVal);
            if (isNaN(taxNum)) taxNum = 0;

            // Check formatted string
            const text = `【發票開立確認】\n日期：${dateStr}\n買受人：${buyerNameVal} ${buyerUbnVal ? '(統編: ' + buyerUbnVal + ')' : ''}\n品項：${itemNameVal}\n----------------\n銷售額：$${parseInt(salesVal).toLocaleString()}\n稅　額：$${taxNum.toLocaleString()}\n總計(含稅)：$${parseInt(totalVal).toLocaleString()}`;


            navigator.clipboard.writeText(text).then(() => {
                const originalHtml = copyBtn.innerHTML;
                copyBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
                copyBtn.style.background = '#f0fdf4';
                copyBtn.style.color = '#15803d';
                copyBtn.style.borderColor = '#15803d';

                setTimeout(() => {
                    copyBtn.innerHTML = originalHtml;
                    copyBtn.style.background = '';
                    copyBtn.style.color = '';
                    copyBtn.style.borderColor = '';
                }, 2000);
            }).catch(err => {
                alert('複製失敗 (需在安全連線環境)');
            });
        });
    }


    // --- 備份提醒檢查 (Backup Reminder) ---
    function checkBackupReminder() {
        if (!savedInvoices || savedInvoices.length === 0) return;

        const lastBackup = localStorage.getItem('invoice_last_backup_date');
        const now = new Date();
        const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000; // 30 Days

        let shouldRemind = false;
        if (!lastBackup) {
            // 從未備份過且有資料 -> 提醒
            shouldRemind = true;
        } else {
            const last = new Date(lastBackup);
            if ((now - last) > thirtyDaysMs) {
                shouldRemind = true;
            }
        }

        if (shouldRemind) {
            setTimeout(() => {
                alert('【溫馨提醒】\n\n您已經許久未備份發票紀錄了。\n為了避免資料遺失，建議您點擊「備份紀錄」將檔案匯出保存！');
            }, 1000);
        }
    }
    checkBackupReminder();

    // --- Download PNG Image Feature (Global Fail-safe) ---


    // --- 一鍵全清表單控制 (Reset All Form Inputs) ---
    function initResetFormButton() {
        const resetBtn = document.getElementById('reset-form-btn');
        if (!resetBtn) return;

        resetBtn.addEventListener('click', () => {
            const companyInput = document.getElementById('buyer-name');
            const ubnInput = document.getElementById('buyer-ubn');
            const itemInput = document.getElementById('input-item-name');
            const salesInput = document.getElementById('input-sales-amount');
            const totalInput = document.getElementById('input-total-amount');

            if (companyInput) companyInput.value = '';
            if (ubnInput) ubnInput.value = '';
            if (itemInput) itemInput.value = '';
            if (salesInput) salesInput.value = '';
            if (totalInput) totalInput.value = '';

            // 觸發事件以即時更新預覽與試算
            [companyInput, ubnInput, itemInput, salesInput, totalInput].forEach(inp => {
                if (inp) inp.dispatchEvent(new Event('input', { bubbles: true }));
            });
        });
    }

    // --- Keyboard Shortcuts & Focus Management ---
    document.addEventListener('keydown', function(e) {
        // Enter: 按下 Enter 加入暫存
        if (e.key === 'Enter' && e.target.tagName === 'INPUT') {
            const saveBtn = document.getElementById('save-invoice-btn');
            if (saveBtn) {
                e.preventDefault();
                saveBtn.click();
            }
        }
        // Esc: 一鍵清空表單
        if (e.key === 'Escape') {
            const resetBtn = document.getElementById('reset-form-btn');
            if (resetBtn) {
                resetBtn.click();
            }
        }
        // Alt+C: 複製摘要
        if (e.altKey && (e.key === 'c' || e.key === 'C')) {
            const copyBtn = document.getElementById('copy-summary-btn');
            if (copyBtn && !copyBtn.disabled) {
                e.preventDefault();
                copyBtn.click();
            }
        }
    });

    // --- 10 碼 YYYYMMxxxx 三聯(AB)/二聯(CD) 獨立連號與顯示 ---
    function getSmartYearMonthStr() {
        const now = new Date();
        const yyyy = now.getFullYear();
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        return `${yyyy}${mm}`;
    }

    function getSmartNumberStorage() {
        const currentYM = getSmartYearMonthStr();
        let modesData = null;
        try {
            modesData = JSON.parse(localStorage.getItem('invoice_smart_number_modes'));
        } catch (e) {}

        if (!modesData || typeof modesData !== 'object') {
            modesData = {
                company: { prefix: 'AB', yearMonth: currentYM, seq: 0 },
                individual: { prefix: 'CD', yearMonth: currentYM, seq: 0 }
            };
        }

        if (!modesData.company) modesData.company = { prefix: 'AB', yearMonth: currentYM, seq: 0 };
        if (!modesData.individual) modesData.individual = { prefix: 'CD', yearMonth: currentYM, seq: 0 };

        ['company', 'individual'].forEach(m => {
            if (modesData[m].yearMonth !== currentYM) {
                modesData[m].yearMonth = currentYM;
                modesData[m].seq = 0;
            }
        });

        localStorage.setItem('invoice_smart_number_modes', JSON.stringify(modesData));
        return modesData;
    }

    window.updateInvoiceNumberDisplay = function(mode) {
        if (!mode) mode = getCurrentMode();
        const modesData = getSmartNumberStorage();
        const target = modesData[mode] || modesData['company'];

        const prefixDisplay = document.getElementById('inv-track-code-display');
        const numberDisplay = document.getElementById('inv-number-display');

        const formattedNum = `${target.yearMonth}${String(target.seq).padStart(4, '0')}`;
        if (prefixDisplay) prefixDisplay.textContent = target.prefix || (mode === 'individual' ? 'CD' : 'AB');
        if (numberDisplay) numberDisplay.textContent = formattedNum;
    };

    function initTrackAndNumberController() {
        const mode = getCurrentMode();
        updateInvoiceNumberDisplay(mode);
    }

    // 每次存檔/下載自動連號 +1 (依據目前三聯 AB / 二聯 CD 獨立跳號)
    window.incrementInvoiceNumber = function() {
        const mode = getCurrentMode();
        const modesData = getSmartNumberStorage();
        const currentYM = getSmartYearMonthStr();

        let target = modesData[mode];
        if (!target) {
            target = { prefix: (mode === 'individual' ? 'CD' : 'AB'), yearMonth: currentYM, seq: 0 };
            modesData[mode] = target;
        }

        let seq = (target.yearMonth === currentYM) ? (parseInt(target.seq) || 0) : 0;
        seq += 1;

        target.yearMonth = currentYM;
        target.seq = seq;

        localStorage.setItem('invoice_smart_number_modes', JSON.stringify(modesData));
        updateInvoiceNumberDisplay(mode);
    };

    // --- 常用買受人 Quick Chips 膠囊 ---
    function initBuyerQuickChips() {
        const container = document.getElementById('buyer-chips-container');
        const addBtn = document.getElementById('add-buyer-chip-btn');
        if (!container) return;

        let buyerChips = null;
        try {
            const raw = localStorage.getItem('invoice_quick_buyer_chips');
            if (raw !== null) buyerChips = JSON.parse(raw);
        } catch (e) {}

        if (!Array.isArray(buyerChips)) {
            buyerChips = [];
            localStorage.setItem('invoice_quick_buyer_chips', JSON.stringify(buyerChips));
        }

        function renderChips() {
            container.innerHTML = '';
            buyerChips.forEach((chip, index) => {
                const el = document.createElement('div');
                el.className = 'quick-chip';
                const displayText = chip.ubn ? `${chip.name} (${chip.ubn})` : chip.name;
                el.innerHTML = `<span>${displayText}</span><span class="chip-del" title="刪除">✕</span>`;

                el.addEventListener('click', (e) => {
                    if (e.target.classList.contains('chip-del')) return;
                    const ubnInput = document.getElementById('buyer-ubn');
                    const nameInput = document.getElementById('buyer-name');

                    if (ubnInput) {
                        ubnInput.value = chip.ubn || '';
                        ubnInput.dispatchEvent(new Event('input', { bubbles: true }));
                    }
                    if (nameInput) {
                        nameInput.value = chip.name || '';
                        nameInput.dispatchEvent(new Event('input', { bubbles: true }));
                    }
                });

                const delBtn = el.querySelector('.chip-del');
                if (delBtn) {
                    delBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        buyerChips.splice(index, 1);
                        localStorage.setItem('invoice_quick_buyer_chips', JSON.stringify(buyerChips));
                        renderChips();
                    });
                }

                container.appendChild(el);
            });
        }

        renderChips();

        if (addBtn) {
            addBtn.addEventListener('click', () => {
                const ubnInput = document.getElementById('buyer-ubn');
                const nameInput = document.getElementById('buyer-name');
                const nameVal = nameInput ? nameInput.value.trim() : '';
                const ubnVal = ubnInput ? ubnInput.value.trim() : '';

                if (!nameVal && !ubnVal) {
                    alert('請先輸入公司名稱或統一編號！');
                    return;
                }

                const exists = buyerChips.some(c => c.name === nameVal && c.ubn === ubnVal);
                if (!exists) {
                    buyerChips.push({ name: nameVal, ubn: ubnVal });
                    localStorage.setItem('invoice_quick_buyer_chips', JSON.stringify(buyerChips));
                    renderChips();
                }
            });
        }
    }

    // --- 常用品項與金額 Quick Chips 膠囊 (三聯/二聯獨立) ---
    window.renderItemChips = function(mode) {
        const container = document.getElementById('item-chips-container');
        if (!container) return;
        if (!mode) mode = getCurrentMode();

        const storageKey = `invoice_quick_item_chips_${mode}`;
        let itemChips = null;
        try {
            const raw = localStorage.getItem(storageKey);
            if (raw !== null) itemChips = JSON.parse(raw);
        } catch (e) {}

        if (!Array.isArray(itemChips)) {
            itemChips = [];
            localStorage.setItem(storageKey, JSON.stringify(itemChips));
        }

        container.innerHTML = '';
        itemChips.forEach((chip, index) => {
            const el = document.createElement('div');
            el.className = 'quick-chip';
            const amtStr = chip.amount ? ` $${parseInt(chip.amount).toLocaleString()}` : '';
            el.innerHTML = `<span>${chip.name}${amtStr}</span><span class="chip-del" title="刪除">✕</span>`;

            el.addEventListener('click', (e) => {
                if (e.target.classList.contains('chip-del')) return;
                const itemNameInput = document.getElementById('input-item-name');
                const salesInput = document.getElementById('input-sales-amount');
                const totalInput = document.getElementById('input-total-amount');

                if (itemNameInput) {
                    itemNameInput.value = chip.name;
                    itemNameInput.dispatchEvent(new Event('input', { bubbles: true }));
                }

                if (chip.amount) {
                    if (mode === 'company') {
                        if (salesInput) {
                            salesInput.value = chip.amount;
                            salesInput.dispatchEvent(new Event('input', { bubbles: true }));
                        }
                    } else {
                        if (totalInput) {
                            totalInput.value = chip.amount;
                            totalInput.dispatchEvent(new Event('input', { bubbles: true }));
                        }
                    }
                }
            });

            const delBtn = el.querySelector('.chip-del');
            if (delBtn) {
                delBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    itemChips.splice(index, 1);
                    localStorage.setItem(storageKey, JSON.stringify(itemChips));
                    renderItemChips(mode);
                });
            }

            container.appendChild(el);
        });
    };

    function initItemQuickChips() {
        const addBtn = document.getElementById('add-item-chip-btn');
        renderItemChips(getCurrentMode());

        if (addBtn) {
            addBtn.addEventListener('click', () => {
                const mode = getCurrentMode();
                const storageKey = `invoice_quick_item_chips_${mode}`;
                let itemChips = [];
                try {
                    itemChips = JSON.parse(localStorage.getItem(storageKey)) || [];
                } catch (e) {}

                const itemNameInput = document.getElementById('input-item-name');
                const salesInput = document.getElementById('input-sales-amount');
                const totalInput = document.getElementById('input-total-amount');

                const nameVal = itemNameInput ? itemNameInput.value.trim() : '';
                let amtVal = 0;
                if (mode === 'company') {
                    amtVal = salesInput ? parseInt(salesInput.value) || 0 : 0;
                } else {
                    amtVal = totalInput ? parseInt(totalInput.value) || 0 : 0;
                }

                if (!nameVal) {
                    alert('請先輸入品項名稱！');
                    return;
                }

                const exists = itemChips.some(c => c.name === nameVal && c.amount === amtVal);
                if (!exists) {
                    itemChips.push({ name: nameVal, amount: amtVal });
                    localStorage.setItem(storageKey, JSON.stringify(itemChips));
                    renderItemChips(mode);
                }
            });
        }
    }

    // 啟動新增之三大開單效率模組
    initTrackAndNumberController();
    initBuyerQuickChips();
    initItemQuickChips();
    initResetFormButton();

    // --- Service Worker & Cache Cleanup ---
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(registrations => {
            for (let registration of registrations) {
                registration.unregister();
            }
        });
        if ('caches' in window) {
            caches.keys().then(names => {
                for (let name of names) caches.delete(name);
            });
        }
    }
});
