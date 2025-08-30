let count = 0;
const counterElement = document.querySelector('#counter p');
const clickButton = document.getElementById('playPause');
const imagesContainer = document.getElementById('images-container');

// 存储所有图片元素
const activeImages = [];
// 视口尺寸（避免频繁获取）
let viewportWidth = window.innerWidth;
let viewportHeight = window.innerHeight;

// 窗口 resize 时更新视口尺寸
window.addEventListener('resize', () => {
    viewportWidth = window.innerWidth;
    viewportHeight = window.innerHeight;
});

// 点击按钮逻辑
function playRandomAudioAndImage() {
    count++;
    counterElement.textContent = count;
    counterElement.classList.add('bounce');
    setTimeout(() => counterElement.classList.remove('bounce'), 300);

    // 随机播放音频
    const randomAudioIndex = Math.floor(Math.random() * audioElements.length);
    playAudio(audioElements[randomAudioIndex]);

    // 生成新图片（无数量限制）
    createNewImage();
}

// 生成随机方向进入的图片（关键扩展：支持任意角度入场）
function createNewImage() {
    const img = document.createElement('img');
    // 随机选择图片
    const randomImageIndex = Math.floor(Math.random() * imageUrls.length);
    img.src = imageUrls[randomImageIndex];

    // 图片加载完成后再初始化（避免尺寸为0导致位置错误）
    img.onload = function () {
        // 1. 随机图片尺寸
        const imgSize = 240 + Math.floor(Math.random() * 60);
        img.style.width = `${imgSize}px`;
        img.style.height = 'auto';
        const imgWidth = img.offsetWidth;
        const imgHeight = img.offsetHeight;

        // -------------------------- 关键扩展1：生成任意入场角度（0-360度） --------------------------
        // 随机入场角度：0度=右，90度=下，180度=左，270度=上，其他为斜向（如45度=右下→左上）
        const entryAngle = Math.random() * Math.PI * 2; // 0-2π 弧度（对应0-360度）
        // 入场方向的反方向：让图片从“视口外”向“视口中心”移动（确保入框）
        const moveAngle = entryAngle + Math.PI; // 角度偏移180度，反向指向视口
        // ----------------------------------------------------------------------------------

        // -------------------------- 关键扩展2：计算视口外的初始位置 --------------------------
        // 偏移距离：视口对角线的1.5倍（确保初始位置足够远，入框路径长且平滑）
        const offsetDistance = Math.sqrt(viewportWidth ** 2 + viewportHeight ** 2) * 1.5;
        // 根据移动角度计算初始位置（x=水平偏移，y=垂直偏移）
        const initXOffset = Math.cos(moveAngle) * offsetDistance;
        const initYOffset = Math.sin(moveAngle) * offsetDistance;
        // 初始位置 = 视口中心 + 偏移量（确保在视口外）
        const initLeft = (viewportWidth - imgWidth) / 2 + initXOffset;
        const initTop = (viewportHeight - imgHeight) / 2 + initYOffset;
        // 设置初始位置
        img.style.left = `${initLeft}px`;
        img.style.top = `${initTop}px`;
        // ----------------------------------------------------------------------------------

        // -------------------------- 关键扩展3：根据角度计算运动速度（x/y方向分量） --------------------------
        const baseSpeed = 2.5 + Math.random() * 2.5; // 基础速度（2.5-5px/帧，平滑不突兀）
        const vx = Math.cos(moveAngle) * baseSpeed; // 水平速度分量（cos(角度)×基础速度）
        const vy = Math.sin(moveAngle) * baseSpeed; // 垂直速度分量（sin(角度)×基础速度）
        // ----------------------------------------------------------------------------------

        // 4. 图片随机自旋转配置（保持原有逻辑）
        const rotateDir = Math.random() > 0.5 ? 1 : -1; // 1=顺时针，-1=逆时针
        const rotateSpeed = 0.5 + Math.random() * 1.5; // 0.5-2度/帧（平滑旋转）
        let initRotate = Math.floor(Math.random() * 360); // 初始角度随机

        // 给图片添加自定义属性（存储运动+旋转状态）
        img.dataset.vx = vx;
        img.dataset.vy = vy;
        img.dataset.rotateDir = rotateDir;
        img.dataset.rotateSpeed = rotateSpeed;
        img.dataset.rotate = initRotate;
        img.style.transform = `rotate(${initRotate}deg)`;

        // 5. 添加图片到容器和管理数组
        img.className = 'moving-image';
        imagesContainer.appendChild(img);
        activeImages.push(img);

        // 6. 启动图片运动和持续旋转
        animateImage(img);

        // // （可选）图片存在15秒后自动移除（避免无限堆积卡顿）
        // setTimeout(() => {
        //     if (activeImages.includes(img)) {
        //         // 移除前添加渐隐动画，避免突然消失
        //         img.style.animation = 'fadeOut 0.5s ease-in forwards';
        //         setTimeout(() => img.remove(), 500); // 等待渐隐完成后删除
        //         activeImages.splice(activeImages.indexOf(img), 1);
        //     }
        // }, 15000);
    };

    // 图片加载失败处理
    img.onerror = function () {
        console.error(`图片加载失败：${img.src}`);
    };
}

// 核心：图片运动+持续自旋转+边缘反弹（适配任意方向入场）
function animateImage(img) {
    // 获取图片当前状态（运动+旋转）
    let vx = parseFloat(img.dataset.vx);
    let vy = parseFloat(img.dataset.vy);
    let rotate = parseFloat(img.dataset.rotate);
    const rotateDir = parseFloat(img.dataset.rotateDir);
    const rotateSpeed = parseFloat(img.dataset.rotateSpeed);

    // 获取图片当前位置和尺寸
    let left = parseFloat(img.style.left);
    let top = parseFloat(img.style.top);
    const imgWidth = img.offsetWidth;
    const imgHeight = img.offsetHeight;

    // 1. 边缘检测与反弹（逻辑不变，适配任意运动方向）
    // 左右边缘反弹：碰到左右边框，水平速度反转
    if (left <= 0 || left + imgWidth >= viewportWidth) {
        vx *= -1;
    }
    // 上下边缘反弹：碰到上下边框，垂直速度反转
    if (top <= 0 || top + imgHeight >= viewportHeight) {
        vy *= -1;
    }

    // 2. 更新图片位置（按速度分量移动）
    left += vx;
    top += vy;
    // 限制位置在视口内（避免反弹时轻微超出）
    left = Math.max(0, Math.min(left, viewportWidth - imgWidth));
    top = Math.max(0, Math.min(top, viewportHeight - imgHeight));
    img.style.left = `${left}px`;
    img.style.top = `${top}px`;

    // 3. 持续平滑旋转（保持原有逻辑）
    rotate += rotateDir * rotateSpeed;
    // 角度归一化（超过360度后重置，避免数值无限增大）
    if (rotate >= 360) rotate -= 360;
    if (rotate <= -360) rotate += 360;
    img.style.transform = `rotate(${rotate}deg)`;

    // 4. 保存最新状态到图片自定义属性
    img.dataset.vx = vx;
    img.dataset.vy = vy;
    img.dataset.rotate = rotate;

    // 5. 循环调用（持续运动+旋转）
    if (activeImages.includes(img)) {
        requestAnimationFrame(() => animateImage(img));
    }
}

// 音频播放函数
function playAudio(audio) {
    try {
        audio.currentTime = 0;
        audio.play().catch(error => {
            console.error('自动播放被阻止:', error);
            alert('请允许网站播放声音以体验完整效果');
        });
    } catch (error) {
        console.error('音频播放错误:', error);
    }
}

// 绑定按钮点击事件
clickButton.addEventListener('click', playRandomAudioAndImage);

// 渐隐动画（用于图片移除时平滑消失）
const fadeOutStyle = document.createElement('style');
fadeOutStyle.textContent = `
    @keyframes fadeOut {
        0% { opacity: 0.9; }
        100% { opacity: 0; }
    }
`;
document.head.appendChild(fadeOutStyle);