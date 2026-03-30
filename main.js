// =====================
// 初期設定
// =====================
const canvas = document.getElementById("c");
const ctx = canvas.getContext("2d");

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resize();
window.addEventListener("resize", resize);

// =====================
// 定数
// =====================
let earthRadius = 60;
let cameraScale = 1;
let score = 0;
let visualRotation = 0;
let visualRotSpeed = 0;
let visualTailSpeed = 0;
//当たり判定
let debugHit = false;
// =====================
//    画像データ
// =====================
const BASE_PATH = "assets/planets/";

const earthImg   = new Image();
const moonImg    = new Image();
const marsImg    = new Image();
const jupiterImg = new Image();
const sunImg     = new Image();

earthImg.src   = BASE_PATH + "earth.png";
moonImg.src    = BASE_PATH + "moon.png";
marsImg.src    = BASE_PATH + "mars.png";
jupiterImg.src = BASE_PATH + "jupiter.png";
sunImg.src     = BASE_PATH + "sun.png";
// =====================
// 惑星データ（完全版）
// =====================
const PLANET_DATA = {

  moon: {
    name: "月",
    type: "circle",
    size: 40,
    reward: 50,
    orbitRadius: 1300,
    orbitSpeed: 0.01,
    unlockRadius: 0,

    img: moonImg,
    scaleFix: 1.05
  },

  mars: {
    name: "火星",
    type: "circle",
    size: 50,
    reward: 80,
    orbitRadius: 1700,
    orbitSpeed: -0.005,
    unlockRadius: 0,

    img: marsImg,
    scaleFix: 1.1
  },

  jupiter: {
    name: "木星",
    type: "circle",
    size: 1500,
    reward: 120,
    orbitRadius: 5000,
    orbitSpeed: 0.003,
    unlockRadius: 0,

    img: jupiterImg,
    scaleFix: 1.15   // ← 見た目ちょいデカ
  },

  sun: {
    name: "太陽",
    type: "circle",
    size: 5000,
    reward: 500,
    orbitRadius: 10000,
    orbitSpeed: 0.0002,
    unlockRadius: 0,

    img: sunImg,
    scaleFix: 1.1
  }

};
// =====================
// オブジェクト
// =====================
let objs = [];
let spawnTimer = 0;
// =====================
// 惑星インスタンス
// =====================
let planets = [];

// =====================
// 初期生成（とりあえず
// =====================
function initPlanets() {

  Object.keys(PLANET_DATA).forEach(key => {
    const data = PLANET_DATA[key];

    planets.push({
      type: key,
      data: data,
      active: false, // ← 追加（最初は全員非表示）

      // とりあえずランダム角度に配置
      x: Math.cos(Math.random() * Math.PI * 2) * data.orbitRadius,
      y: Math.sin(Math.random() * Math.PI * 2) * data.orbitRadius,

      angle: Math.random() * Math.PI * 2
    });
  });

}

// 初期化
initPlanets();

// =====================
// 回転状態
// =====================
let rotation = 0;
let rotSpeed = 0;

// =====================
// タッチ管理
// =====================
let lastX = null;

canvas.addEventListener("touchstart", e => {
  lastX = e.touches[0].clientX;
});

canvas.addEventListener("touchmove", e => {
  const x = e.touches[0].clientX;

  if (lastX !== null) {
    const dx = x - lastX;

    // =====================
    // スワイプ → 回転加速
    // =====================
    let swipePower = dx * 0.002;

    // =====================
    // 逆方向なら減速
    // =====================
    if (Math.sign(rotSpeed) !== Math.sign(swipePower)) {
      rotSpeed *= 0.3;
    }

    rotSpeed += swipePower;
  }

  lastX = x;
});

canvas.addEventListener("touchend", () => {
  lastX = null;
});
// =====================
// キーボード操作（PC用）
// =====================
let keyLeft = false;
let keyRight = false;

window.addEventListener("keydown", e => {
  if (e.key === "ArrowLeft") keyLeft = true;
  if (e.key === "ArrowRight") keyRight = true;
});

window.addEventListener("keyup", e => {
  if (e.key === "ArrowLeft") keyLeft = false;
  if (e.key === "ArrowRight") keyRight = false;
});
// =====================
// 宇宙ゴミ生成（円形）
// =====================
function spawn() {
  spawnTimer++;

  if (spawnTimer % 20 !== 0) return;

 let type;

  // =====================
  // 種類分岐
  // =====================
  const rType = Math.random();

  if (rType < 0.25) {
    type = "trash";
  } else {
    type = "energy";
  }
  // =====================
  // 半径（画面よりちょいデカい円）
  // =====================
  const maxR = Math.max(canvas.width, canvas.height) * 0.8 / cameraScale;

  // =====================
  // ランダム角度＋距離
  // =====================
  const angle = Math.random() * Math.PI * 2;
  const r = Math.sqrt(Math.random()) * maxR; // ←均等分布のコツ
  // =====================
  // 基準サイズ（カメラ基準）
  // =====================
  let baseSize = 6 / cameraScale;

  // =====================
  // ランク（無限成長）
  // =====================
  const level = Math.floor(Math.log2(1 / cameraScale));

  // =====================
  // サイズ決定
  // =====================
  let size = baseSize * Math.pow(1.8, level);

  // バラつき（重要）
  size *= 0.7 + Math.random() * 0.6;

  //ここからゴミ
  objs.push({
  x: Math.cos(angle) * r,
  y: Math.sin(angle) * r,
  vx: (Math.random() - 0.5) * 1,
  vy: (Math.random() - 0.5) * 1,

  // =====================
  // 流れ（ここ追加）
  // =====================
  flowX: Math.cos(Math.random() * Math.PI * 2) * (0.01 + Math.random() * 0.01),
  flowY: Math.sin(Math.random() * Math.PI * 2) * (0.01 + Math.random() * 0.01),

  type: type,
  size: size
});
}
// ==========================================================
//                          更新
// ==========================================================
function update() {
 // =====================
  // キー入力による回転
  // =====================
  if (keyLeft) {
    rotSpeed -= 0.01; // 吸い込み
  }

  if (keyRight) {
    rotSpeed += 0.01; // 反発
  }
 // =====================
 // 回転の極小停止
 // =====================
 if (Math.abs(rotSpeed) < 0.0001) {
  rotSpeed = 0;
 }
 // =====================
 // 減衰（慣性）
 // =====================
 rotSpeed *= 0.95;
 rotation += rotSpeed;
// =====================
// 見た目用の回転（慣性テールあり）
// =====================
if (Math.abs(rotSpeed) > 0.0001) {
  // 操作中：完全追従＋記録
  visualRotSpeed = rotSpeed;
  visualTailSpeed = rotSpeed; // ←ここが重要
} else {
  // 操作が止まったら：記録した速度で回り続ける
  visualTailSpeed *= 0.9995;
  visualRotSpeed = visualTailSpeed;
}

visualRotation += visualRotSpeed;
 // =====================
 // 宇宙ゴミ生成
 // =====================
 spawn();
 // =====================
  // 惑星の出現解放
  // =====================
  planets.forEach(p => {
    if (!p.active && earthRadius >= p.data.unlockRadius) {
      p.active = true;
    }
  });
  // =====================
  // 惑星更新（円運動＋影響）
  // =====================
  planets.forEach(p => {
      if (!p.active) return; // ← これ追加（超重要）
  // =====================
  // circleタイプ（月）
  // =====================
  if (p.data.type === "circle") {

    const targetRadius = p.data.orbitRadius - earthRadius * 3;

    if (!p.currentRadius) {
      p.currentRadius = targetRadius;
    }

    p.currentRadius += (targetRadius - p.currentRadius) * 0.1;

    p.angle += p.data.orbitSpeed;

    p.x = Math.cos(p.angle) * p.currentRadius;
    p.y = Math.sin(p.angle) * p.currentRadius;

    return; // ←ここ超重要（下の処理をスキップ）
  }
    });

// =====================
// 位置更新＋摩擦
// =====================
objs.forEach(o => {

  // =====================
  // 🌙 円運動（objs版）
  // =====================
  if (o.orbit) {
    o.angle += o.orbitSpeed;

    const targetRadius = o.orbitRadius - earthRadius * 1.5;

    if (!o.currentRadius) {
      o.currentRadius = targetRadius;
    }

    o.currentRadius += (targetRadius - o.currentRadius) * 0.1;

    o.x = Math.cos(o.angle) * o.currentRadius;
    o.y = Math.sin(o.angle) * o.currentRadius;

    return; // ←これも入れとく（安定用）
  }

  // =====================
  // 通常ゴミの動き
  // =====================
  o.vx += o.flowX;
  o.vy += o.flowY;

  o.x += o.vx;
  o.y += o.vy;

  o.vx *= 0.98;
  o.vy *= 0.98;
});
  // =====================
  // 回転による力
  // =====================
  objs.forEach(o => {
    // =====================
    // 重さ係数 
    // =====================
    let weight = 1;

    if (o.type === "moon2") {
      weight = 0.2;
    }
    // =====================
    // 中心への方向
    // =====================
    const dx = -o.x;
    const dy = -o.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // =====================
    // 表面距離（ここが今回の核心）
    // =====================
    const surfaceDist = Math.max(0, dist - earthRadius);

    // =====================
    // 近いほど強くなる力
    // =====================
    const force = 1 / (surfaceDist + 20);

    // =====================
    // 左回転 → 吸い込み
    // =====================
    if (rotSpeed < 0) {
      o.vx += dx * force * 0.1 * weight;
      o.vy += dy * force * 0.1 * weight;
    }

    // =====================
    // 右回転 → 弾き（強）
    // =====================
    if (rotSpeed > 0) {

      let power = 0.5;

    // =====================
    // 赤だけ強く弾く
    // =====================
    if (o.type === "trash") {
      power = 1.2; // ←ここで調整
    }

    const boost = 1 + (200 / ((surfaceDist + 10) * (surfaceDist + 10)));

    o.vx -= dx * force * power * boost * weight;
    o.vy -= dy * force * power * boost * weight;
    o.vx *= 0.98;
    o.vy *= 0.98;
    }
  });

  // =====================
  // 当たり判定
  // 地球に触れたら消える
  // =====================
  objs = objs.filter(o => {
    // =====================
    // 🌙 orbitは消さない（テスト用）
    // =====================
    if (o.orbit) return true;

      const dist = Math.sqrt(o.x * o.x + o.y * o.y);
      const hitDist = earthRadius + o.size * 0.5;
      if (dist <= hitDist) {

      // =====================
      // 緑 → 成長
      // =====================
      if (o.type === "energy") {

          earthRadius += 2;
          score += 2;
        }
      // =====================
      // 赤 → 縮小
      // =====================
      if (o.type === "trash") {

        earthRadius -= 2;
        earthRadius = Math.max(20, earthRadius);
        score -= 1;
      }

      return false;
    }
    // =====================
      // 惑星の当たり判定
      // =====================
      planets = planets.filter(p => {

        const dx = p.x;
        const dy = p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        const hitDist = earthRadius + p.data.size;

        if (dist <= hitDist) {

          // =====================
          // ＋惑星（成長）
          // =====================
          if (p.data.effect === "plus") {
            earthRadius += 20;
            score += 50;
          }

          // =====================
          // −惑星（縮小）
          // =====================
          if (p.data.effect === "minus") {
            earthRadius -= 20;
            earthRadius = Math.max(20, earthRadius);
            score -= 20;
          }

          return false; // 消える
        }

        return true;
        });
      return true;
    });
  // =====================
  // カメラ調整
  // =====================
  if (earthRadius > 100) {
      cameraScale = 100 / earthRadius;
    } else {
      cameraScale = 1;
  }
}
// ============================================
//                  描画
// ============================================
function draw() {
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const cx = canvas.width / 2;
  const cy = canvas.height / 2;

  ctx.save();

  // =====================
  // カメラ（ここが本物）
  // =====================
  ctx.translate(cx, cy);
  ctx.scale(cameraScale, cameraScale);

 // =====================
  // 🌍 地球（画像）
  // =====================
  // =====================
  // 🌍 青いグロー（外側）
  // =====================
  const glow = ctx.createRadialGradient(
    0, 0, earthRadius * 0.9,
    0, 0, earthRadius * 1.4
  );

  glow.addColorStop(0, "rgba(0,150,255,0.15)");
  glow.addColorStop(1, "rgba(0,150,255,0)");

  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, 0, earthRadius * 1.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.save();

  ctx.rotate(visualRotation);

  // =====================
  // 🌍 地球描画（ズレ補正ver）
  // =====================
  const scaleFix = 1.4;

  // サイズ計算
  const drawSize = earthRadius * 2 * scaleFix;

  // 中心基準
  let drawX = -drawSize / 2;
  let drawY = -drawSize / 2;

  // =====================
  // 🔧 中心ズレ補正（ここ調整）
  // =====================
  const offsetX = -0.5;
  const offsetY = 2.5; // ←まずこれで試す

  ctx.drawImage(
    earthImg,
    drawX + offsetX,
    drawY + offsetY,
    drawSize,
    drawSize
  );

  ctx.restore();
  // =====================
  // オブジェクト（ここが重要）
  // =====================
  objs.forEach(o => {

  // =====================
  // 🌙 orbit（テスト用 月）
  // =====================
  if (o.orbit) {
    ctx.fillStyle = "#fff"; // ← 白
  } else {
   if (o.type === "moon2") {
    ctx.fillStyle = "#f90"; // オレンジ
  } else {
    ctx.fillStyle = o.type === "energy" ? "#0f0" : "#f00";
  }
  }
    ctx.fillRect(
      o.x - o.size / 2,
      o.y - o.size / 2,
      o.size,
      o.size
    );
  });
// =====================
// 惑星描画（データ駆動）
// =====================
planets.forEach(p => {

  if (!p.active) return;

  const size = p.data.size * (p.scale || 1);

  ctx.save();
  ctx.translate(p.x, p.y);

  // =====================
  // 🪐 画像があるなら画像
  // =====================
  if (p.data.img) {

    const scaleFix = p.data.scaleFix || 1;
    const sizeFix = size * scaleFix;

    ctx.drawImage(
      p.data.img,
      -sizeFix,
      -sizeFix,
      sizeFix * 2,
      sizeFix * 2
    );
    //当たり判定
    if (debugHit) {
      ctx.beginPath();
      ctx.arc(0, 0, size, 0, Math.PI * 2);
      ctx.strokeStyle = "red";
      ctx.lineWidth = 2;
      ctx.stroke();
    }

  } else {

    // fallback（円）
    ctx.fillStyle = "#fff";

    ctx.beginPath();
    ctx.arc(0, 0, size, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();

});
ctx.restore();
 // =====================
 // スコア表示
 // =====================
 ctx.fillStyle = "#fff";
 ctx.font = "40px sans-serif";
 ctx.fillText("Score: " + Math.floor(score), 20, 30);
}
// =====================
// ループ
// =====================
function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

loop();