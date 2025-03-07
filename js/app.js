// JavaScript functionality for the mind map application

// グローバル変数
let isDragging = false;
let dragNode = null;
let offsetX, offsetY;
let startX, startY;
let wasDragging = false;

// すべての親子接続を記録する配列
let connections = [];

// Initialize the application
window.onload = function() {
    createInitialNode();
};

// Create the initial node at the center of the screen
function createInitialNode() {
    createNode('新しいノード', window.innerWidth / 2, window.innerHeight / 2, false);
}

// Create a new node at a specified position
function createNode(text, x, y, addDelete = true) {
    const node = document.createElement('div');
    node.classList.add('node');
    node.style.left = `${x}px`;
    node.style.top = `${y}px`;
    node.innerHTML = `<span class="node-text" contenteditable="true">${text}</span>`;
    
    // テキスト部分のイベント
    const textElement = node.querySelector('.node-text');
    textElement.addEventListener('click', (e) => {
        e.stopPropagation();
    });
    textElement.addEventListener('mousedown', (e) => {
        e.stopPropagation();
    });
    
    if (addDelete) {
        // 削除ボタン（右上に丸で囲んだ×印）を追加
        const deleteButton = document.createElement('span');
        deleteButton.classList.add('node-delete');
        deleteButton.innerHTML = '&times;';
        node.appendChild(deleteButton);
        deleteButton.addEventListener('click', (e) => {
            e.stopPropagation();
            removeNode(node);
        });
    }
    
    // ノードのドラッグ開始
    node.addEventListener('mousedown', startDrag);
    
    // クリックで子ノード生成
    node.addEventListener('click', (e) => {
        if (wasDragging) {
            wasDragging = false;
            return;
        }
        const parentRect = node.getBoundingClientRect();
        const newX = parentRect.right + 50;
        const newY = parentRect.top;
        // 子ノードは削除ボタン付きで作成
        const child = createNode('新しいノード', newX, newY);
        addConnection(node, child);
    });
    
    document.body.appendChild(node);
    return node;
}

// ノード削除関数
function removeNode(node) {
    // このノードに関連する接続線を削除
    connections = connections.filter((conn) => {
        if (conn.parent === node || conn.child === node) {
            if (conn.path.parentNode) {
                conn.path.parentNode.removeChild(conn.path);
            }
            return false;
        }
        return true;
    });
    // ノード自体を削除
    if (node.parentNode) {
        node.parentNode.removeChild(node);
    }
    updateConnections();
}

// ノード間の接続を記録し、SVGにpath要素を追加する
function addConnection(parent, child) {
    const svg = document.getElementById('mindmap');
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.classList.add('connection');
    svg.appendChild(path);
    
    connections.push({ parent, child, path });
    updateConnections();
}

// Drag functionality
function startDrag(e) {
    isDragging = true;
    dragNode = e.currentTarget;
    offsetX = e.clientX - dragNode.getBoundingClientRect().left;
    offsetY = e.clientY - dragNode.getBoundingClientRect().top;
    startX = e.clientX;
    startY = e.clientY;
    wasDragging = false; // ドラッグ開始時にリセット

    document.addEventListener('mousemove', dragNodeMove);
    document.addEventListener('mouseup', endDrag);
}

function dragNodeMove(e) {
    if (isDragging && dragNode) {
        // マウス移動距離が一定以上ならドラッグ済みと判断
        if (!wasDragging && (Math.abs(e.clientX - startX) > 3 || Math.abs(e.clientY - startY) > 3)) {
            wasDragging = true;
        }
        dragNode.style.left = `${e.clientX - offsetX}px`;
        dragNode.style.top = `${e.clientY - offsetY}px`;
        updateConnections();
    }
}

function endDrag() {
    isDragging = false;
    dragNode = null;
    document.removeEventListener('mousemove', dragNodeMove);
    document.removeEventListener('mouseup', endDrag);
}

// 各接続線の位置を更新する関数
function updateConnections() {
    connections.forEach((conn) => {
        const parentRect = conn.parent.getBoundingClientRect();
        const childRect = conn.child.getBoundingClientRect();
        let startX, startY, endX, endY;
        
        // 子ノードが親ノードの右側にある場合
        if (childRect.left > parentRect.right) {
            startX = parentRect.right;
            startY = parentRect.top + parentRect.height / 2;
            endX = childRect.left;
            endY = childRect.top + childRect.height / 2;
        } else {
            // それ以外の場合は、親ノードの左側と子ノードの右側を使用
            startX = parentRect.left;
            startY = parentRect.top + parentRect.height / 2;
            endX = childRect.right;
            endY = childRect.top + childRect.height / 2;
        }
        
        // 制御点を計算（ベジェ曲線用）
        const midX = (startX + endX) / 2;
        const d = Math.abs(endX - startX) / 2;
        const cp1X = startX + d;
        const cp2X = endX - d;
        
        // pathのd属性を更新（ベジェ曲線）
        const pathD = `M ${startX},${startY} C ${cp1X},${startY} ${cp2X},${endY} ${endX},${endY}`;
        conn.path.setAttribute('d', pathD);
    });
}