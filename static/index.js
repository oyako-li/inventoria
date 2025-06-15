let scanner = null;
// let inventory = JSON.parse(localStorage.getItem('inventory')) || {};
let inventory = {};
fetch('http://localhost:8000/inventory').then(response => response.json()).then(data => {
    inventory = data;
    updateInventoryTable();
});

// 初期表示
updateInventoryTable();

document.addEventListener('DOMContentLoaded', function() {
    const tabScanner = document.getElementById('tabScanner');
    const tabInventory = document.getElementById('tabInventory');
    const scannerSection = document.querySelector('.scanner-section');
    const inventorySection = document.querySelector('.inventory-section');

    function showTab(tab) {
        if (tab === 'scanner') {
            tabScanner.classList.add('active');
            tabInventory.classList.remove('active');
            scannerSection.classList.add('active');
            inventorySection.classList.remove('active');
        } else {
            tabScanner.classList.remove('active');
            tabInventory.classList.add('active');
            scannerSection.classList.remove('active');
            inventorySection.classList.add('active');
        }
    }

    tabScanner.addEventListener('click', () => showTab('scanner'));
    tabInventory.addEventListener('click', () => showTab('inventory'));

    // 初期表示
    showTab('scanner');

    const actionType = document.getElementById('actionType');
    const supplierCodeGroup = document.getElementById('supplierCodeGroup');
    const customerCodeGroup = document.getElementById('customerCodeGroup');

    function updateCodeInput() {
        if (actionType.value === 'in') {
            supplierCodeGroup.style.display = '';
            customerCodeGroup.style.display = 'none';
        } else if (actionType.value === 'out') {
            supplierCodeGroup.style.display = 'none';
            customerCodeGroup.style.display = '';
        } else {
            supplierCodeGroup.style.display = 'none';
            customerCodeGroup.style.display = 'none';
        }
    }

    actionType.addEventListener('change', updateCodeInput);

    // 初期表示
    updateCodeInput();
});

// カメラ開始ボタン
document.getElementById('startButton').addEventListener('click', async () => {
    try {
        const video = document.getElementById('video');
        scanner = new QrScanner(video, result => {
            processQRCode(result.data);
        });
        
        await scanner.start();
        document.getElementById('startButton').disabled = true;
        document.getElementById('stopButton').disabled = false;
        showStatus('カメラが開始されました', 'success');
    } catch (error) {
        showStatus('カメラの起動に失敗しました: ' + error.message, 'error');
    }
});

// カメラ停止ボタン
document.getElementById('stopButton').addEventListener('click', () => {
    if (scanner) {
        scanner.stop();
        scanner = null;
        document.getElementById('startButton').disabled = false;
        document.getElementById('stopButton').disabled = true;
        showStatus('カメラが停止されました', 'info');
    }
});

// 手動入力ボタン
document.getElementById('manualSubmit').addEventListener('click', () => {
    const qrCode = document.getElementById('manualInput').value.trim();
    if (qrCode) {
        processQRCode(qrCode);
        document.getElementById('manualInput').value = '';
    } else {
        showStatus('QRコード値を入力してください', 'error');
    }
});

// 商品追加ボタン
document.getElementById('addProduct').addEventListener('click', () => {
    const productName = document.getElementById('productName').value.trim();
    if (productName) {
        const qrCode = 'PRODUCT_' + Date.now();
        // inventory[qrCode] = {
        //     name: productName,
        //     quantity: 0,
        //     lastUpdated: new Date().toLocaleString('ja-JP'),
        //     action: "create"
        // };
        saveInventory({
            qr_code: qrCode,
            name: productName,
            quantity: 0,
            updated_at: new Date().toLocaleString('ja-JP'),
            action: "create"
        });
        updateInventoryTable();
        document.getElementById('productName').value = '';
        showStatus(`商品「${productName}」が追加されました (QR: ${qrCode})`, 'success');
    } else {
        showStatus('商品名を入力してください', 'error');
    }
});

// データエクスポートボタン
document.getElementById('exportData').addEventListener('click', () => {
    const data = JSON.stringify(inventory, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'inventory_data.json';
    a.click();
    URL.revokeObjectURL(url);
    showStatus('データがエクスポートされました', 'success');
});

// データクリアボタン
document.getElementById('clearData').addEventListener('click', () => {
    if (confirm('すべての在庫データを削除しますか？')) {
        inventory = {};
        saveInventory();
        updateInventoryTable();
        showStatus('すべてのデータがクリアされました', 'info');
    }
});

// QRコード処理関数
function processQRCode(qrCode) {
    const actionType = document.getElementById('actionType').value;
    const quantity = parseInt(document.getElementById('quantity').value) || 1;
    
    if (!inventory[qrCode]) {
        const productName = prompt(`新しい商品が検出されました。\nQRコード: ${qrCode}\n\n商品名を入力してください:`);
        if (!productName) {
            showStatus('商品名が入力されませんでした', 'error');
            return;
        }
        
        inventory[qrCode] = {
            name: productName,
            quantity: 0,
            lastUpdated: new Date().toLocaleString('ja-JP')
        };
    }
    
    const item = inventory[qrCode];
    
    if (actionType === 'in') {
        item.quantity += quantity;
        showStatus(`${item.name} を ${quantity}個 入庫しました`, 'success');
    } else {
        if (item.quantity >= quantity) {
            item.quantity -= quantity;
            showStatus(`${item.name} を ${quantity}個 出庫しました`, 'success');
        } else {
            showStatus(`在庫不足です。現在の在庫数: ${item.quantity}`, 'error');
            return;
        }
    }
    
    item.lastUpdated = new Date().toLocaleString('ja-JP');
    saveInventory();
    updateInventoryTable();
}

// 在庫テーブル更新
function updateInventoryTable() {
    const tbody = document.getElementById('inventoryTable');
    tbody.innerHTML = '';
    
    for (const [qrCode, item] of Object.entries(inventory)) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${qrCode}</td>
            <td>${item.name}</td>
            <td>${item.quantity}</td>
            <td>${item.lastUpdated}</td>
            <td>
                <button class="btn btn-danger" onclick="deleteItem('${qrCode}')">削除</button>
            </td>
        `;
        tbody.appendChild(row);
    }
}

// 商品削除
function deleteItem(qrCode) {
    if (confirm(`商品「${inventory[qrCode].name}」を削除しますか？`)) {
        delete inventory[qrCode];
        saveInventory({
            qr_code: qrCode,
            quantity: 0,
            action: 'delete',
            updated_at: new Date().toLocaleString('ja-JP')
        });
        updateInventoryTable();
        showStatus('商品が削除されました', 'info');
    }
}

// 在庫データ保存
function saveInventory(data) {
    // localStorage.setItem('inventory', JSON.stringify(inventory));
    fetch('http://localhost:8000/transaction', {
        method: 'POST',
        body: JSON.stringify(data)
    });
}

// ステータスメッセージ表示
function showStatus(message, type) {
    const statusDiv = document.getElementById('statusMessage');
    statusDiv.innerHTML = `<div class="status-message status-${type}">${message}</div>`;
    
    setTimeout(() => {
        statusDiv.innerHTML = '';
    }, 5000);
}