// Инициализация Telegram WebApp
const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

console.log("=== ИГРА ЗАГРУЖЕНА ===");

// Размеры игрового мира
const WORLD_WIDTH = 4000;
const WORLD_HEIGHT = 3000;

// Конфигурация Phaser
const config = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    parent: 'game-container',
    backgroundColor: '#2d3748',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    },
    scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH
    }
};

let game;
let playerSprite;
let houseSprite;

// Загрузка ресурсов
function preload() {
    // Создаем текстуру для дома
    const houseGraphics = this.add.graphics();
    houseGraphics.fillStyle(0x8b4513, 1);
    houseGraphics.fillRect(0, 0, 80, 80);
    houseGraphics.fillStyle(0x654321, 1);
    houseGraphics.fillTriangle(0, 0, 40, -30, 80, 0);
    houseGraphics.fillStyle(0x4a5568, 1);
    houseGraphics.fillRect(30, 50, 20, 30);
    houseGraphics.generateTexture('house', 80, 80);
    houseGraphics.destroy();
    
    // Создаем текстуру для игрока
    const playerGraphics = this.add.graphics();
    playerGraphics.fillStyle(0x3498db, 1);
    playerGraphics.fillCircle(0, 0, 15);
    playerGraphics.generateTexture('player', 30, 30);
    playerGraphics.destroy();
}

// Создание игры
function create() {
    const scene = this;
    
    // Устанавливаем границы мира
    scene.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    scene.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    scene.cameras.main.setZoom(1);
    
    // Координаты дома: центр по X, максимально наверху
    const houseX = WORLD_WIDTH / 2;  // Центр по горизонтали
    const houseY = 100;  // Максимально наверху
    
    // Создаем дом
    houseSprite = scene.add.image(houseX, houseY, 'house');
    houseSprite.setDepth(50);
    houseSprite.setOrigin(0.5, 1); // Якорь снизу
    
    // Вертикальная дорожка: начинается на 20 пикселей ниже дома
    const verticalRoadStartY = houseY + 20;
    const verticalRoadWidth = 50; // Тонкая дорожка
    const verticalRoadLength = 300; // Длина вертикальной дорожки
    
    const roads = scene.add.graphics();
    
    // Вертикальная дорожка (тонкая)
    roads.fillStyle(0x4a4a4a, 1);
    roads.fillRect(houseX - verticalRoadWidth/2, verticalRoadStartY, verticalRoadWidth, verticalRoadLength);
    
    // Бордюры вертикальной дорожки
    roads.fillStyle(0x6a6a6a, 0.7);
    roads.fillRect(houseX - verticalRoadWidth/2 - 4, verticalRoadStartY, 4, verticalRoadLength);
    roads.fillRect(houseX + verticalRoadWidth/2, verticalRoadStartY, 4, verticalRoadLength);
    
    // Горизонтальная дорога: перпендикулярно от конца вертикальной дорожки
    const horizontalRoadY = verticalRoadStartY + verticalRoadLength;
    const horizontalRoadWidth = 110; // Основная дорога
    
    // Горизонтальная дорога (основная)
    roads.fillStyle(0x4a4a4a, 1);
    roads.fillRect(0, horizontalRoadY - horizontalRoadWidth/2, WORLD_WIDTH, horizontalRoadWidth);
    
    // Бордюры горизонтальной дороги
    roads.fillStyle(0x6a6a6a, 0.7);
    roads.fillRect(0, horizontalRoadY - horizontalRoadWidth/2 - 4, WORLD_WIDTH, 4);
    roads.fillRect(0, horizontalRoadY + horizontalRoadWidth/2, WORLD_WIDTH, 4);
    
    // Разметка горизонтальной дороги
    roads.fillStyle(0xffeb3b, 0.6);
    roads.fillRect(0, horizontalRoadY - 2, WORLD_WIDTH, 4);
    
    // Прерывистая разметка горизонтальной дороги
    roads.fillStyle(0xffffff, 0.5);
    for (let x = 0; x < WORLD_WIDTH; x += 90) {
        roads.fillRect(x, horizontalRoadY - 1, 55, 2);
    }
    
    // Создаем игрока (внутри дома)
    const startX = houseX;
    const startY = houseY - 25;
    
    playerSprite = scene.add.image(startX, startY, 'player');
    playerSprite.setScale(1.2);
    playerSprite.setDepth(100);
    playerSprite.setAlpha(0);
    
    // Анимация появления игрока
    scene.tweens.add({
        targets: playerSprite,
        alpha: 1,
        duration: 300,
        onComplete: () => {
            scene.tweens.add({
                targets: playerSprite,
                x: houseX + 50,
                y: houseY - 10,
                duration: 800,
                ease: 'Power2',
                onComplete: () => {
                    const diceButtonContainer = document.getElementById('dice-button-container');
                    if (diceButtonContainer) {
                        diceButtonContainer.style.display = 'flex';
                    }
                }
            });
        }
    });
    
    // Камера следует за игроком
    scene.cameras.main.centerOn(houseX, houseY);
    scene.time.delayedCall(1100, () => {
        scene.cameras.main.startFollow(playerSprite, true, 0.1, 0.1);
        scene.cameras.main.setDeadzone(150, 150);
    });
    
    // Меню
    setupMenu();
}

// Настройка меню
function setupMenu() {
    const menuButton = document.getElementById('menu-button');
    const infoMenu = document.getElementById('info-menu');
    const closeMenu = document.getElementById('close-menu');
    
    if (menuButton) {
        menuButton.addEventListener('click', () => {
            infoMenu.classList.add('active');
        });
    }
    
    if (closeMenu) {
        closeMenu.addEventListener('click', () => {
            infoMenu.classList.remove('active');
        });
    }
}

function update() {
    // Обновление каждый кадр (если нужно)
}

// Запуск игры
tg.ready(() => {
    game = new Phaser.Game(config);
    
    if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
        console.log('Пользователь:', tg.initDataUnsafe.user);
    }
});

// Обработка изменения размера окна
window.addEventListener('resize', () => {
    if (game) {
        game.scale.resize(window.innerWidth, window.innerHeight);
    }
});
