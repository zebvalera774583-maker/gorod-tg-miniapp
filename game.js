// Инициализация Telegram WebApp (с проверкой)
let tg;
if (window.Telegram && window.Telegram.WebApp) {
    tg = window.Telegram.WebApp;
    tg.ready();
    tg.expand();
} else {
    console.warn("Telegram WebApp API недоступен. Запуск в обычном режиме.");
    // Создаем заглушку для совместимости
    tg = {
        ready: (callback) => {
            if (callback) {
                if (document.readyState === 'loading') {
                    document.addEventListener('DOMContentLoaded', callback);
                } else {
                    callback();
                }
            }
        },
        expand: () => {},
        initDataUnsafe: {}
    };
}

console.log("=== ИГРА ЗАГРУЖЕНА ===");

// Размеры игрового мира
const WORLD_WIDTH = 4000;
const WORLD_HEIGHT = 3000;

let game;
let playerSprite;
let houseSprite;

// Функция создания конфигурации Phaser
function createConfig() {
    return {
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
}

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
    const houseX = WORLD_WIDTH / 2;  // Центр по горизонтали (2000)
    const houseY = 150;  // Максимально наверху (увеличено для видимости)
    
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
    scene.cameras.main.setZoom(0.8); // Уменьшаем зум для лучшей видимости
    scene.cameras.main.centerOn(houseX, houseY);
    scene.time.delayedCall(1100, () => {
        scene.cameras.main.startFollow(playerSprite, true, 0.1, 0.1);
        scene.cameras.main.setDeadzone(150, 150);
    });
    
    // Отладочный текст для проверки
    const debugText = scene.add.text(houseX, houseY + 100, 'ДОМ ЗДЕСЬ', {
        fontSize: '32px',
        color: '#00ff00',
        fontStyle: 'bold',
        backgroundColor: '#000000',
        padding: { x: 10, y: 5 }
    });
    debugText.setOrigin(0.5, 0);
    debugText.setDepth(1000);
    
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

// Функция инициализации игры
function initGame() {
    console.log('=== initGame вызвана ===');
    console.log('Phaser доступен:', typeof Phaser !== 'undefined');
    console.log('Размер окна:', window.innerWidth, 'x', window.innerHeight);
    console.log('game-container существует:', !!document.getElementById('game-container'));
    
    // Проверяем, что Phaser загружен
    if (typeof Phaser === 'undefined') {
        console.error('Phaser не загружен! Проверьте подключение скрипта.');
        const container = document.getElementById('game-container');
        if (container) {
            container.innerHTML = 
                '<div style="color: white; padding: 20px; text-align: center;">Ошибка: Phaser не загружен</div>';
        }
        return;
    }
    
    // Проверяем контейнер
    const container = document.getElementById('game-container');
    if (!container) {
        console.error('Контейнер game-container не найден!');
        return;
    }
    
    try {
        console.log('Инициализация Phaser игры...');
        const config = createConfig();
        console.log('Конфигурация:', {
            width: config.width,
            height: config.height,
            parent: config.parent
        });
        
        game = new Phaser.Game(config);
        console.log('Игра успешно создана!', game);
        
        if (tg && tg.initDataUnsafe && tg.initDataUnsafe.user) {
            console.log('Пользователь:', tg.initDataUnsafe.user);
        }
    } catch (error) {
        console.error('Ошибка при создании игры:', error);
        console.error('Стек ошибки:', error.stack);
        if (container) {
            container.innerHTML = 
                '<div style="color: white; padding: 20px; text-align: center;">Ошибка: ' + error.message + '</div>';
        }
    }
}

// Запуск игры после загрузки всех ресурсов
function startGame() {
    // Функция проверки и запуска
    const tryInit = () => {
        if (typeof Phaser !== 'undefined') {
            console.log('Phaser загружен, запускаем игру...');
            tg.ready(initGame);
        } else {
            console.log('Ожидание загрузки Phaser...');
            setTimeout(tryInit, 100);
        }
    };
    
    // Проверяем готовность DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', tryInit);
    } else {
        // DOM уже готов, сразу проверяем Phaser
        tryInit();
    }
    
    // Таймаут на случай, если Phaser не загрузится
    setTimeout(() => {
        if (typeof Phaser === 'undefined') {
            console.error('Phaser не загрузился за 10 секунд');
            document.getElementById('game-container').innerHTML = 
                '<div style="color: white; padding: 20px; text-align: center; font-size: 18px;">' +
                'Ошибка: Не удалось загрузить Phaser. Проверьте подключение к интернету.</div>';
        }
    }, 10000);
}

// Запускаем игру
startGame();

// Обработка изменения размера окна
window.addEventListener('resize', () => {
    if (game) {
        game.scale.resize(window.innerWidth, window.innerHeight);
    }
});
