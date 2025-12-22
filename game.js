// Инициализация Telegram WebApp
const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

// Игровые константы (из бота)
const GAME_CONSTANTS = {
    START_BALANCE: 50000,
    CAFE_PRICE: 250,
    CAFE_BUY_PRICE: 5000,
    WORK_BASE_INVEST: 5000,
    SHOP_PRICE: 400,
    SHOP_BUY_PRICE: 8000,
    TAXI_BUY_PRICE: 18000,
    TAXI_RIDE_PRICE: 800,
    REST_PRICE: 800,
    REST_BUY_PRICE: 20000,
    EXCHANGE_FEE: 800,
    EXCHANGE_BUY_PRICE: 5000,
    BANK_BUY_PRICE: 30000,
    GYM_PRICE: 500,
    GYM_BUY_PRICE: 5000,
    LAUNDRY_PRICE: 500,
    LAUNDRY_BUY_PRICE: 5000,
    SCOOTER_RENT_PRICE: 500,
    SCOOTER_BUY_PRICE: 5000,
    CLUB_PRICE: 500,
    CLUB_BUY_PRICE: 5000,
    PARK_PRICE: 500,
    PARK_BUY_PRICE: 5000,
    HOSPITAL_VISIT_PRICE: 100,
    HOSPITAL_TREATMENT_PRICE: 1000,
    HOSPITAL_BUY_PRICE: 15000,
};

// Игровое состояние
let gameState = {
    balance: GAME_CONSTANTS.START_BALANCE,
    day: 1,
    cafes: [],
    shops: [],
    taxis: [],
    restaurants: [],
    exchanges: [],
    banks: [],
    gyms: [],
    hospitals: [],
    laundries: [],
    scooters: [],
    clubs: [],
    parks: [],
    lastDirection: null,
    lastStep: null,
    currentLocation: 'home',
    playerX: 0,
    playerY: 0,
    onlinePlayers: 0, // Количество онлайн игроков
    playerExited: false, // Флаг выхода игрока из дома
    hasShownDiceButton: false, // Флаг показа кнопки кубика
    canRollDice: false // Можно ли бросать кубик
};

// Конфигурация Phaser
const config = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    parent: 'game-container',
    backgroundColor: '#0a0e27',
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

// Размеры игрового мира (большая карта)
const WORLD_WIDTH = 4000;
const WORLD_HEIGHT = 3000;

// ВЕРСИЯ 2.2: Дом в центре, одна дорога, кафе убраны
console.log("=== ====== Game.js ВЕРСИЯ 2.2 ЗАГРУЖЕНА! ====== ===");
console.log("Дом должен быть в центре: X=" + (4000/2) + ", Y=" + (3000/2));

// Глобальные переменные игры
let game;
let playerSprite;
let cityMap;
let locations = [];
let diceScene;
let isRollingDice = false;
let particles;
let gameWorld; // Игровой мир
let homeLocation; // ДОМ

// Класс для локаций
class Location {
    constructor(scene, x, y, type, name, color) {
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.type = type;
        this.name = name;
        this.color = color;
        this.graphics = null;
        this.icon = null;
        this.label = null;
        this.labelBg = null;
        this.iconGlow = null;
        this.isVisible = false;
        this.create();
        this.setVisible(false); // По умолчанию скрыты, показываем только видимые
    }
    
    setVisible(visible) {
        this.isVisible = visible;
        if (this.graphics) {
            this.graphics.setVisible(visible);
            this.graphics.setActive(visible);
        }
        if (this.icon) {
            this.icon.setVisible(visible);
            this.icon.setActive(visible);
        }
        if (this.label) {
            this.label.setVisible(visible);
            this.label.setActive(visible);
        }
        if (this.labelBg) {
            this.labelBg.setVisible(visible);
            this.labelBg.setActive(visible);
        }
    }

    create() {
        // Стиль Labrador Adventures - мягкие, простые формы
        const graphics = this.scene.add.graphics();
        
        // Для кафе - квадратные и меньше
        let buildingWidth, buildingHeight;
        if (this.type === 'cafe') {
            buildingWidth = 55; // Еще меньше
            buildingHeight = 55; // Квадратные
        } else {
            buildingWidth = 85;
            buildingHeight = 95;
        }
        
        // Приглушаем цвета для мягкого вида
        const buildingColor = Phaser.Display.Color.ValueToColor(this.color);
        const baseColor = buildingColor.lighten(15).color; // Светлее для мягкости
        const roofColor = buildingColor.darken(25).color; // Крыша чуть темнее
        
        // Основание здания - простой прямоугольник с закругленными углами (без светлого основания)
        graphics.fillStyle(baseColor, 1);
        graphics.fillRoundedRect(
            this.x - buildingWidth/2, 
            this.y - buildingHeight/2, 
            buildingWidth, 
            buildingHeight, 
            12 // Больше закругление для мягкости
        );
        
        // Мягкая обводка (светлая, тонкая)
        graphics.lineStyle(2, 0xffffff, 0.4);
        graphics.strokeRoundedRect(
            this.x - buildingWidth/2, 
            this.y - buildingHeight/2, 
            buildingWidth, 
            buildingHeight, 
            12
        );
        
        // Крыша - только для не-кафе (треугольная), для кафе убираем
        if (this.type !== 'cafe') {
            graphics.fillStyle(roofColor, 1);
            graphics.fillTriangle(
                this.x - buildingWidth/2 - 3, this.y - buildingHeight/2,
                this.x + buildingWidth/2 + 3, this.y - buildingHeight/2,
                this.x, this.y - buildingHeight/2 - 22
            );
            
            // Мягкая обводка крыши
            graphics.lineStyle(2, 0xffffff, 0.3);
            graphics.lineBetween(this.x - buildingWidth/2 - 3, this.y - buildingHeight/2, this.x + buildingWidth/2 + 3, this.y - buildingHeight/2);
            graphics.lineBetween(this.x + buildingWidth/2 + 3, this.y - buildingHeight/2, this.x, this.y - buildingHeight/2 - 22);
            graphics.lineBetween(this.x, this.y - buildingHeight/2 - 22, this.x - buildingWidth/2 - 3, this.y - buildingHeight/2);
        }
        
        // Простые окна (для кафе - меньше, для остальных - как было)
        const windowSize = this.type === 'cafe' ? 10 : 16;
        const windowSpacing = this.type === 'cafe' ? 14 : 22;
        const windowsPerRow = 2;
        const rows = this.type === 'cafe' ? 1 : 2; // Для кафе 1 ряд окон
        
        const windowStartY = this.type === 'cafe' 
            ? this.y - buildingHeight/2 + 15  // Для квадратного кафе
            : this.y - buildingHeight/2 + 25; // Для обычных зданий
        
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < windowsPerRow; col++) {
                const wx = this.x - (windowsPerRow - 1) * windowSpacing / 2 + col * windowSpacing;
                const wy = windowStartY + row * (this.type === 'cafe' ? 20 : 28);
                
                // Простое окно с мягким свечением
                const isLit = Phaser.Math.Between(0, 100) > 40; // 60% светятся
                const windowGlow = isLit ? 0xffd700 : 0x4a4a4a;
                graphics.fillStyle(windowGlow, isLit ? 0.7 : 0.3);
                graphics.fillRoundedRect(wx - windowSize/2, wy - windowSize/2, windowSize, windowSize, 3);
                
                // Тонкая обводка окна
                graphics.lineStyle(1, 0xffffff, 0.5);
                graphics.strokeRoundedRect(wx - windowSize/2, wy - windowSize/2, windowSize, windowSize, 3);
            }
        }
        
        // Простая дверь (закругленная, для кафе меньше)
        const doorWidth = this.type === 'cafe' ? 12 : 20;
        const doorHeight = this.type === 'cafe' ? 16 : 26;
        const doorY = this.type === 'cafe' 
            ? this.y + buildingHeight/2 - 14  // Для квадратного кафе
            : this.y + buildingHeight/2 - 22; // Для обычных зданий
        
        graphics.fillStyle(0x8b6f47, 1);
        graphics.fillRoundedRect(this.x - doorWidth/2, doorY, doorWidth, doorHeight, 5);
        
        // Мягкая обводка двери
        graphics.lineStyle(1.5, 0xffffff, 0.4);
        graphics.strokeRoundedRect(this.x - doorWidth/2, doorY, doorWidth, doorHeight, 5);
        
        // Ручка двери (простая точка)
        graphics.fillStyle(0xffd700, 0.8);
        graphics.fillCircle(this.x + (this.type === 'cafe' ? 3 : 6), doorY + (this.type === 'cafe' ? 8 : 14), this.type === 'cafe' ? 2 : 3);
        
        this.graphics = graphics;
        
        // Иконка локации (мягкая, дружелюбная, для кафе не создаем)
        if (this.type !== 'cafe') {
            const iconText = this.getIconEmoji();
            this.icon = this.scene.add.text(this.x, this.y - 70, iconText, {
                fontSize: '36px',
                fontFamily: 'Arial'
            }).setOrigin(0.5);
        } else {
            this.icon = null; // Для кафе иконку не создаем
        }
        
        // Убрано: свечение иконки (чтобы не было светлых квадратиков)
        // Убрано: фон названия локации (чтобы не было светлых квадратиков)
        this.iconGlow = null;
        this.labelBg = null;
        
        // Для кафе надпись на самом здании (по центру), для остальных - снизу
        const labelY = this.type === 'cafe' ? this.y : this.y + 84;
        const labelFontSize = this.type === 'cafe' ? '13px' : '15px';
        this.label = this.scene.add.text(this.x, labelY, this.name, {
            fontSize: labelFontSize,
            fill: '#ffffff',
            fontFamily: 'Arial',
            fontWeight: 'bold',
            stroke: '#000000',
            strokeThickness: this.type === 'cafe' ? 4 : 3, // Более толстая обводка для кафе
            shadow: {
                offsetX: 1,
                offsetY: 1,
                color: '#000000',
                blur: 2,
                stroke: true,
                fill: true
            }
        }).setOrigin(0.5).setDepth(200); // Устанавливаем высокий depth, чтобы текст был поверх всего
        
        // Интерактивность
        const hitArea = this.scene.add.zone(this.x, this.y, 100, 100);
        hitArea.setInteractive();
        hitArea.on('pointerdown', () => this.onClick());
        
        // Эффект свечения при наведении (без изменения позиции - используем alpha вместо scale для graphics)
        hitArea.on('pointerover', () => {
            // Для graphics меняем только alpha, чтобы не было сдвига
            this.scene.tweens.add({
                targets: this.graphics,
                alpha: 0.9,
                duration: 200,
                ease: 'Power2'
            });
            // Для label и icon используем scale (они имеют правильный origin)
            const scaleTargets = [this.label];
            if (this.icon) scaleTargets.push(this.icon);
            this.scene.tweens.add({
                targets: scaleTargets,
                scale: 1.15,
                duration: 200,
                ease: 'Power2'
            });
            // Свечение вокруг здания (только если есть иконка)
            if (this.icon) {
                this.scene.tweens.add({
                    targets: this.icon,
                    alpha: 1.5,
                    duration: 200,
                    ease: 'Power2'
                });
            }
        });
        
        hitArea.on('pointerout', () => {
            // Возвращаем graphics к исходному состоянию
            this.scene.tweens.add({
                targets: this.graphics,
                alpha: 1,
                duration: 200,
                ease: 'Power2'
            });
            // Возвращаем label и icon к исходному размеру
            const scaleTargets = [this.label];
            if (this.icon) scaleTargets.push(this.icon);
            this.scene.tweens.add({
                targets: scaleTargets,
                scale: 1,
                duration: 200,
                ease: 'Power2'
            });
            if (this.icon) {
                this.scene.tweens.add({
                    targets: this.icon,
                    alpha: 1,
                    duration: 200,
                    ease: 'Power2'
                });
            }
        });
    }

    getIconEmoji() {
        const icons = {
            'home': '🏠',
            'cafe': '☕',
            'shop': '🛒',
            'work': '💼',
            'restaurant': '🍽️',
            'hospital': '🏥',
            'bank': '🏦',
            'gym': '💪',
            'exchange': '💱',
            'taxi': '🚕',
            'laundry': '🧺',
            'scooter': '🛴',
            'club': '🎉',
            'park': '🌳',
            'police': '🚔'
        };
        return icons[this.type] || '📍';
    }

    onClick() {
        // Анимация клика
        const clickTargets = [this.graphics];
        if (this.icon) clickTargets.push(this.icon);
        this.scene.tweens.add({
            targets: clickTargets,
            scale: 0.9,
            duration: 100,
            yoyo: true,
            ease: 'Power2'
        });
        
        // Отправка данных боту
        sendToBot(this.type, { location: this.name });
    }
}

function preload() {
    // Создание спрайта дома в стиле тайлсет
    const houseGraphics = this.add.graphics();
    const houseSize = 80;
    
    // Основание дома (мягкий коричневый)
    houseGraphics.fillStyle(0xd4a574, 1);
    houseGraphics.fillRoundedRect(0, 30, houseSize, 50, 5);
    
    // Крыша (красная черепица)
    houseGraphics.fillStyle(0xc84a4a, 1);
    houseGraphics.fillTriangle(houseSize/2, 0, 0, 30, houseSize, 30);
    
    // Дверь (коричневая)
    houseGraphics.fillStyle(0x8b6f47, 1);
    houseGraphics.fillRoundedRect(houseSize/2 - 12, 50, 24, 30, 3);
    
    // Окно слева
    houseGraphics.fillStyle(0xffd700, 0.8);
    houseGraphics.fillRect(15, 40, 20, 20);
    houseGraphics.lineStyle(2, 0x654321, 1);
    houseGraphics.strokeRect(15, 40, 20, 20);
    
    // Окно справа
    houseGraphics.fillStyle(0xffd700, 0.8);
    houseGraphics.fillRect(45, 40, 20, 20);
    houseGraphics.lineStyle(2, 0x654321, 1);
    houseGraphics.strokeRect(45, 40, 20, 20);
    
    // Обводка дома
    houseGraphics.lineStyle(2, 0xffffff, 0.3);
    houseGraphics.strokeRoundedRect(0, 30, houseSize, 50, 5);
    
    houseGraphics.generateTexture('house', houseSize, 80);
    houseGraphics.destroy();
    
    // Создание спрайта игрока в стиле тайлсет
    const playerGraphics = this.add.graphics();
    const playerSize = 32;
    
    // Тело игрока (круг)
    playerGraphics.fillStyle(0x4a90e2, 1); // Голубой цвет
    playerGraphics.fillCircle(playerSize/2, playerSize/2 + 4, 12);
    
    // Голова
    playerGraphics.fillStyle(0xffdbac, 1); // Телесный цвет
    playerGraphics.fillCircle(playerSize/2, playerSize/2 - 4, 10);
    
    // Глаза
    playerGraphics.fillStyle(0x000000, 1);
    playerGraphics.fillCircle(playerSize/2 - 3, playerSize/2 - 6, 2);
    playerGraphics.fillCircle(playerSize/2 + 3, playerSize/2 - 6, 2);
    
    // Рот (улыбка)
    playerGraphics.lineStyle(2, 0x000000, 1);
    playerGraphics.beginPath();
    playerGraphics.arc(playerSize/2, playerSize/2 - 2, 3, 0, Math.PI);
    playerGraphics.strokePath();
    
    // Тень под игроком
    playerGraphics.fillStyle(0x000000, 0.2);
    playerGraphics.fillEllipse(playerSize/2, playerSize - 2, 16, 6);
    
    playerGraphics.generateTexture('player', playerSize, playerSize);
    playerGraphics.destroy();
    
    // Создание текстуры для кубика
    createDiceTextures(this);
}

function createDiceTextures(scene) {
    // Создаем красивые текстуры для каждой стороны кубика (тайлсет стиль)
    for (let i = 1; i <= 6; i++) {
        const graphics = scene.add.graphics();
        const diceSize = 70;
        
        // Градиентный фон кубика (белый с легким оттенком)
        graphics.fillGradientStyle(0xffffff, 0xffffff, 0xf5f5f5, 0xf5f5f5, 1);
        graphics.fillRoundedRect(0, 0, diceSize, diceSize, 10);
        
        // Тень/объемность - темная сторона справа и снизу
        graphics.fillStyle(0xe0e0e0, 0.8);
        graphics.fillRoundedRect(diceSize - 5, 0, 5, diceSize, 10);
        graphics.fillRoundedRect(0, diceSize - 5, diceSize, 5, 10);
        
        // Светлая сторона сверху и слева для объема
        graphics.fillStyle(0xffffff, 0.6);
        graphics.fillRoundedRect(0, 0, 5, diceSize, 10);
        graphics.fillRoundedRect(0, 0, diceSize, 5, 10);
        
        // Основная обводка
        graphics.lineStyle(3, 0x333333, 1);
        graphics.strokeRoundedRect(0, 0, diceSize, diceSize, 10);
        
        // Внутренняя обводка для глубины
        graphics.lineStyle(1, 0xcccccc, 0.5);
        graphics.strokeRoundedRect(2, 2, diceSize - 4, diceSize - 4, 8);
        
        // Рисуем точки на кубике (более стильные)
        const dots = getDiceDots(i);
        graphics.fillStyle(0x2c3e50, 1); // Темно-синий цвет точек
        dots.forEach(dot => {
            // Основная точка
            graphics.fillCircle(dot.x, dot.y, 7);
            // Свечение точки
            graphics.fillStyle(0x34495e, 0.5);
            graphics.fillCircle(dot.x - 1, dot.y - 1, 7);
            graphics.fillStyle(0x2c3e50, 1);
        });
        
        graphics.generateTexture(`dice_${i}`, diceSize, diceSize);
        graphics.destroy();
    }
}

function getDiceDots(value) {
    // Позиции точек для кубика размером 70x70
    const center = 35;
    const offset = 20;
    const positions = {
        1: [{ x: center, y: center }],
        2: [{ x: center - offset, y: center - offset }, { x: center + offset, y: center + offset }],
        3: [{ x: center - offset, y: center - offset }, { x: center, y: center }, { x: center + offset, y: center + offset }],
        4: [{ x: center - offset, y: center - offset }, { x: center + offset, y: center - offset }, { x: center - offset, y: center + offset }, { x: center + offset, y: center + offset }],
        5: [{ x: center - offset, y: center - offset }, { x: center + offset, y: center - offset }, { x: center, y: center }, { x: center - offset, y: center + offset }, { x: center + offset, y: center + offset }],
        6: [{ x: center - offset, y: center - offset }, { x: center - offset, y: center }, { x: center - offset, y: center + offset }, { x: center + offset, y: center - offset }, { x: center + offset, y: center }, { x: center + offset, y: center + offset }]
    };
    return positions[value] || [];
}

function create() {
    const scene = this;
    
    // Устанавливаем размер игрового мира
    scene.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    scene.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    
    // Настраиваем зум камеры
    scene.cameras.main.setZoom(1);
    scene.input.on('wheel', (pointer, gameObjects, deltaX, deltaY, deltaZ) => {
        const currentZoom = scene.cameras.main.zoom;
        let newZoom = currentZoom;
        
        if (deltaY > 0) {
            newZoom = Phaser.Math.Clamp(currentZoom - 0.1, 0.5, 2.0);
        } else {
            newZoom = Phaser.Math.Clamp(currentZoom + 0.1, 0.5, 2.0);
        }
        
        scene.cameras.main.zoomTo(newZoom, 200);
    });
    
    // Создание карты города
    createCityMap(scene);
    
    // Создание локаций по схеме
    createAllLocations(scene);
    
    // Создание игрока (начинает в ДОМЕ - центр экрана)
    createPlayer(scene);
    
    // ВЕРСИЯ 2.2: Дом в центре, одна дорога, кафе убраны
    const versionText = scene.add.text(10, 10, 'ВЕРСИЯ 2.2', {
        fontSize: '32px',
        color: '#00ff00',
        fontStyle: 'bold',
        backgroundColor: '#000000',
        padding: { x: 10, y: 5 }
    });
    versionText.setDepth(1000);
    console.log("Визуальный индикатор ВЕРСИЯ 2.2 создан на экране");
    
    // Первоначальное обновление видимых локаций
    updateVisibleLocations(scene);
    
    // Создание частиц
    particles = scene.add.particles(0, 0, 'player', {
        scale: { start: 0.3, end: 0 },
        speed: { min: 20, max: 40 },
        lifespan: 500,
        frequency: 100,
        emitting: false
    });
    
    // Создание кнопки броска кубика
    createDiceButton(scene);
    
    // Обновление UI
    updateUI();
    
    // Обработка изменения размера
    scene.scale.on('resize', () => {
        scene.cameras.main.setViewport(0, 0, scene.scale.width, scene.scale.height);
    });
}

function createCityMap(scene) {
    try {
        // Фон убран - оставляем только дороги (чтобы не было светлых блоков)
        // Можно использовать темный или однотонный фон, если нужно
        const bg = scene.add.graphics();
        bg.fillStyle(0x2d3748, 1); // Темный фон вместо светлого
        bg.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
        
        // Мягкие дороги (приглушенные цвета)
        const roads = scene.add.graphics();
        const mainRoadWidth = 110; // Чуть уже для мягкости
        const sideRoadWidth = 70;  // Обычные дороги
        const roadColor = 0x5a5a5a; // Светлее
        const asphaltColor = 0x4a4a4a; // Мягче
        
        // Одна горизонтальная дорога через центр экрана (где дом)
        const roadY = WORLD_HEIGHT / 2; // Центр экрана
        
        // Асфальт
        roads.fillStyle(asphaltColor, 1);
        roads.fillRect(0, roadY - mainRoadWidth/2, WORLD_WIDTH, mainRoadWidth);
        
        // Мягкие бордюры
        roads.fillStyle(0x6a6a6a, 0.7);
        roads.fillRect(0, roadY - mainRoadWidth/2 - 4, WORLD_WIDTH, 4);
        roads.fillRect(0, roadY + mainRoadWidth/2, WORLD_WIDTH, 4);
        
        // Простая разметка (мягче)
        roads.fillStyle(0xffeb3b, 0.6);
        roads.fillRect(0, roadY - 2, WORLD_WIDTH, 4);
        
        // Прерывистая разметка (более мягкая)
        roads.fillStyle(0xffffff, 0.5);
        for (let x = 0; x < WORLD_WIDTH; x += 90) {
            roads.fillRect(x, roadY - 1, 55, 2);
        }
        
    } catch (error) {
        console.error('Ошибка создания карты:', error);
    }
}

function createAllLocations(scene) {
    // ДОМ теперь создается отдельно как спрайт в createPlayer
    // Не создаем дом как Location, так как он уже создан как спрайт
    // homeLocation будет null, дом управляется отдельно
    
    // Все кафе и другие локации убраны - только дом в центре
}

function createPlayer(scene) {
    // Позиция дома (центр экрана)
    const houseX = WORLD_WIDTH / 2;
    const houseY = WORLD_HEIGHT / 2;
    
    // Создание спрайта дома (без светлого основания)
    const houseSprite = scene.add.image(houseX, houseY, 'house');
    houseSprite.setDepth(50);
    houseSprite.setOrigin(0.5, 1); // Якорь снизу
    
    // Начальная позиция игрока (внутри дома, у двери)
    const startX = houseX;
    const startY = houseY - 25; // Позиция у двери дома
    
    // Конечная позиция (выходит из дома)
    gameState.playerX = houseX + 50;
    gameState.playerY = houseY - 10;
    
    // Создание спрайта игрока (изначально скрыт внутри дома)
    playerSprite = scene.add.image(startX, startY, 'player');
    playerSprite.setScale(1.2);
    playerSprite.setDepth(100);
    playerSprite.setAlpha(0); // Начинаем невидимым
    
    // Анимация появления и выхода игрока из дома
    scene.tweens.add({
        targets: playerSprite,
        alpha: 1,
        duration: 300,
        onComplete: () => {
            // Анимация выхода из дома
            scene.tweens.add({
                targets: playerSprite,
                x: gameState.playerX,
                y: gameState.playerY,
                duration: 800,
                ease: 'Power2',
                onComplete: () => {
                    // После выхода добавляем пульсацию
                    scene.tweens.add({
                        targets: playerSprite,
                        scale: 1.3,
                        duration: 1000,
                        yoyo: true,
                        repeat: -1,
                        ease: 'Sine.easeInOut'
                    });
                    
                    // Показываем кнопку "Кинуть фишки" после выхода из дома (только один раз)
                    gameState.playerExited = true;
                    const diceButtonContainer = document.getElementById('dice-button-container');
                    if (diceButtonContainer && !gameState.hasShownDiceButton) {
                        diceButtonContainer.style.display = 'flex';
                        gameState.hasShownDiceButton = true;
                    }
                }
            });
        }
    });
    
    // Следование камеры за игроком (начинаем с дома)
    scene.cameras.main.centerOn(houseX, houseY);
    
    // Задержка перед началом следования за игроком (после выхода)
    scene.time.delayedCall(1100, () => {
        scene.cameras.main.startFollow(playerSprite, true, 0.1, 0.1);
        scene.cameras.main.setDeadzone(150, 150);
    });
}

function createDiceButton(scene) {
    // Кнопка будет создана в HTML, но добавим визуальный эффект
    const button = document.getElementById('roll-dice-button');
    if (button) {
        button.addEventListener('click', () => {
            if (!isRollingDice) {
                rollDiceAnimation(scene);
            }
        });
    }
}

function rollDiceAnimation(scene) {
    if (isRollingDice) return;
    isRollingDice = true;
    
    const width = scene.cameras.main.width;
    const height = scene.cameras.main.height;
    
    // Создание затемнения
    const overlay = scene.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7);
    overlay.setDepth(200);
    
    // Создание первого кубика (направление) - более крупные и красивые
    let dice1 = scene.add.image(width / 2 - 90, height / 2, 'dice_1');
    dice1.setScale(1.8);
    dice1.setDepth(201);
    
    // Создание второго кубика (шаги)
    let dice2 = scene.add.image(width / 2 + 90, height / 2, 'dice_1');
    dice2.setScale(1.8);
    dice2.setDepth(201);
    
    // Текст подсказки
    const hintText = scene.add.text(width / 2, height / 2 + 100, 'Направление          Шаги', {
        fontSize: '20px',
        fill: '#ffffff',
        fontFamily: 'Arial'
    }).setOrigin(0.5).setDepth(202);
    
    // Анимация вращения кубиков
    let rollCount = 0;
    const maxRolls = 25;
    let dice1Value = 1;
    let dice2Value = 1;
    
    const rollInterval = setInterval(() => {
        rollCount++;
        dice1Value = Phaser.Math.Between(1, 6);
        dice2Value = Phaser.Math.Between(1, 6);
        dice1.setTexture(`dice_${dice1Value}`);
        dice2.setTexture(`dice_${dice2Value}`);
        
        // Вращение
        scene.tweens.add({
            targets: [dice1, dice2],
            angle: dice1.angle + 90,
            duration: 100,
            ease: 'Power2'
        });
        
        if (rollCount >= maxRolls) {
            clearInterval(rollInterval);
            
            // Финальные значения
            dice1Value = Phaser.Math.Between(1, 6);
            dice2Value = Phaser.Math.Between(1, 6);
            dice1.setTexture(`dice_${dice1Value}`);
            dice2.setTexture(`dice_${dice2Value}`);
            
            // Эффект взрыва частиц
            particles.setPosition(width / 2, height / 2);
            particles.explode(30);
            
            // Анимация результата
            scene.tweens.add({
                targets: [dice1, dice2],
                scale: 3.5,
                duration: 300,
                yoyo: true,
                ease: 'Back.easeOut'
            });
            
            // Определяем четное/нечетное по первой фишке
            const isEven = dice1Value % 2 === 0;
            const roadDirection = isEven ? 'правой' : 'левой';
            const steps = dice2Value;
            
            // Формируем текст результата
            const resultText = `Вам выпало ${isEven ? 'четное' : 'нечетное'} число на первой фишке.\n` +
                             `${isEven ? 'Четное' : 'Нечетное'} - ${roadDirection} дорога.\n` +
                             `Вам по ${roadDirection} дороге на ${steps} клеток.`;
            
            // Обновляем текст с результатом
            hintText.setText(resultText);
            hintText.setFontSize('18px');
            hintText.setWordWrapWidth(600);
            
            // Скрываем кнопку "Кинуть фишки"
            const diceButtonContainer = document.getElementById('dice-button-container');
            if (diceButtonContainer) {
                diceButtonContainer.style.display = 'none';
            }
            
            // Показываем текст с результатами и через 2.5 секунды показываем кнопку "Пошли"
            scene.time.delayedCall(2500, () => {
                // Показываем кнопку "Пошли"
                const goButtonContainer = document.getElementById('go-button-container');
                if (goButtonContainer) {
                    goButtonContainer.style.display = 'flex';
                    
                    // Обработчик кнопки "Пошли"
                    const goButton = document.getElementById('go-button');
                    if (goButton && !goButton.hasEventListener) {
                        goButton.hasEventListener = true;
                        goButton.addEventListener('click', () => {
                            // Пока при нажатии ничего не происходит
                            // Скрываем кнопку "Пошли" и элементы кубиков
                            goButtonContainer.style.display = 'none';
                            dice1.destroy();
                            dice2.destroy();
                            hintText.destroy();
                            overlay.destroy();
                            isRollingDice = false;
                            
                            // TODO: Добавить логику перемещения игрока здесь
                        });
                    }
                }
            });
        }
    }, 100);
}

function update() {
    // Обновление игровой логики
    if (playerSprite && particles) {
        particles.setPosition(playerSprite.x, playerSprite.y);
    }
    
    // Оптимизация: показываем только видимые локации
    if (game && game.scene.scenes[0]) {
        updateVisibleLocations(game.scene.scenes[0]);
    }
}

// Оптимизация: обновление видимых локаций
function updateVisibleLocations(scene) {
    if (!scene.cameras.main) return;
    
    const camera = scene.cameras.main;
    const cameraBounds = {
        x: camera.worldView.x - 200, // Добавляем запас для плавного появления
        y: camera.worldView.y - 200,
        width: camera.worldView.width + 400,
        height: camera.worldView.height + 400
    };
    
    locations.forEach(location => {
        const isInView = (
            location.x >= cameraBounds.x &&
            location.x <= cameraBounds.x + cameraBounds.width &&
            location.y >= cameraBounds.y &&
            location.y <= cameraBounds.y + cameraBounds.height
        );
        
        location.setVisible(isInView);
    });
}

// Функция перемещения игрока по результату кубика
function movePlayerByDice(scene, direction, steps) {
    if (!playerSprite) return;
    
    const stepSize = 100; // Размер одного шага в пикселях
    let newX = gameState.playerX;
    let newY = gameState.playerY;
    
    // Вычисляем новую позицию в зависимости от направления
    switch(direction) {
        case 'Север':
            newY -= steps * stepSize;
            break;
        case 'Юг':
            newY += steps * stepSize;
            break;
        case 'Восток':
            newX += steps * stepSize;
            break;
        case 'Запад':
            newX -= steps * stepSize;
            break;
    }
    
    // Ограничиваем перемещение границами карты
    newX = Phaser.Math.Clamp(newX, 50, WORLD_WIDTH - 50);
    newY = Phaser.Math.Clamp(newY, 50, WORLD_HEIGHT - 50);
    
    // Плавное перемещение игрока
    const distance = Phaser.Math.Distance.Between(
        playerSprite.x, playerSprite.y,
        newX, newY
    );
    
    const duration = Math.min(distance * 3, 3000);
    
    scene.tweens.add({
        targets: playerSprite,
        x: newX,
        y: newY,
        duration: duration,
        ease: 'Power2'
    });
    
    // Обновляем позицию в состоянии
    gameState.playerX = newX;
    gameState.playerY = newY;
    
    // Эффект частиц при движении
    particles.setPosition(playerSprite.x, playerSprite.y);
    particles.start();
    
    scene.time.delayedCall(duration, () => {
        particles.stop();
        
        // Проверяем, достиг ли игрок какой-либо локации
        checkLocationReach(scene, newX, newY);
    });
}

// Проверка достижения локации
function checkLocationReach(scene, x, y) {
    const reachDistance = 80; // Радиус взаимодействия с локацией
    
    for (let location of locations) {
        const dist = Phaser.Math.Distance.Between(x, y, location.x, location.y);
        if (dist < reachDistance) {
            // Игрок достиг локации
            tg.showAlert(`Вы достигли: ${location.name}`);
            // Можно добавить логику взаимодействия с локацией
            break;
        }
    }
}

function handleMapClick(pointer, scene) {
    // Убираем клик по карте - перемещение только по кубику
    // Можно оставить для тестирования, но лучше отключить
    // if (isRollingDice) return;
    // ... остальной код удален для автоматического перемещения
}

function enterLocation(locationName) {
    tg.showAlert(`Вы входите в ${locationName}`);
}

function updateUI() {
    // Обновление данных в меню
    const menuBalance = document.getElementById('menu-balance');
    const menuDay = document.getElementById('menu-day');
    const menuOnline = document.getElementById('menu-online');
    const propertyList = document.getElementById('property-list');
    
    if (menuBalance) {
        menuBalance.textContent = gameState.balance.toLocaleString('ru-RU') + ' ₽';
    }
    if (menuDay) {
        menuDay.textContent = gameState.day;
    }
    if (menuOnline) {
        // TODO: Получать реальное количество онлайн игроков от бота
        menuOnline.textContent = gameState.onlinePlayers || '0';
    }
    
    // Обновление списка собственности
    if (propertyList) {
        updatePropertyList(propertyList);
    }
}

// Обновление списка собственности
function updatePropertyList(container) {
    container.innerHTML = '';
    
    const properties = [];
    
    // Собираем всю собственность
    if (gameState.cafes && gameState.cafes.length > 0) {
        gameState.cafes.forEach(cafe => {
            properties.push({ type: 'Кафе', name: cafe });
        });
    }
    if (gameState.shops && gameState.shops.length > 0) {
        gameState.shops.forEach(shop => {
            properties.push({ type: 'Магазин', name: shop });
        });
    }
    if (gameState.restaurants && gameState.restaurants.length > 0) {
        gameState.restaurants.forEach(rest => {
            properties.push({ type: 'Ресторан', name: rest });
        });
    }
    if (gameState.taxis && gameState.taxis.length > 0) {
        gameState.taxis.forEach(taxi => {
            properties.push({ type: 'Такси', name: taxi });
        });
    }
    if (gameState.banks && gameState.banks.length > 0) {
        gameState.banks.forEach(bank => {
            properties.push({ type: 'Банк', name: bank });
        });
    }
    if (gameState.hospitals && gameState.hospitals.length > 0) {
        gameState.hospitals.forEach(hospital => {
            properties.push({ type: 'Больница', name: hospital });
        });
    }
    if (gameState.gyms && gameState.gyms.length > 0) {
        gameState.gyms.forEach(gym => {
            properties.push({ type: 'Спортзал', name: gym });
        });
    }
    if (gameState.laundries && gameState.laundries.length > 0) {
        gameState.laundries.forEach(laundry => {
            properties.push({ type: 'Прачечная', name: laundry });
        });
    }
    if (gameState.scooters && gameState.scooters.length > 0) {
        gameState.scooters.forEach(scooter => {
            properties.push({ type: 'Самокат', name: scooter });
        });
    }
    if (gameState.clubs && gameState.clubs.length > 0) {
        gameState.clubs.forEach(club => {
            properties.push({ type: 'Клуб', name: club });
        });
    }
    if (gameState.parks && gameState.parks.length > 0) {
        gameState.parks.forEach(park => {
            properties.push({ type: 'Парк', name: park });
        });
    }
    if (gameState.exchanges && gameState.exchanges.length > 0) {
        gameState.exchanges.forEach(exchange => {
            properties.push({ type: 'Обменник', name: exchange });
        });
    }
    
    if (properties.length === 0) {
        container.innerHTML = '<div class="property-item">Пока нет собственности</div>';
    } else {
        properties.forEach(prop => {
            const item = document.createElement('div');
            item.className = 'property-item';
            item.textContent = `${prop.type}: ${prop.name}`;
            container.appendChild(item);
        });
    }
}

// Инициализация меню
function initMenu() {
    const menuButton = document.getElementById('menu-button');
    const infoMenu = document.getElementById('info-menu');
    const closeMenu = document.getElementById('close-menu');
    
    if (menuButton && infoMenu) {
        menuButton.addEventListener('click', () => {
            infoMenu.classList.add('active');
            updateUI(); // Обновляем данные при открытии
        });
    }
    
    if (closeMenu && infoMenu) {
        closeMenu.addEventListener('click', () => {
            infoMenu.classList.remove('active');
        });
    }
    
    // Закрытие меню при клике вне его
    if (infoMenu) {
        infoMenu.addEventListener('click', (e) => {
            if (e.target === infoMenu) {
                infoMenu.classList.remove('active');
            }
        });
    }
}

// Функция для отправки данных боту
function sendToBot(action, data) {
    const payload = {
        action: action,
        ...data
    };
    tg.sendData(JSON.stringify(payload));
}

// Запуск игры
function startGame() {
    game = new Phaser.Game(config);
}

// Инициализация при загрузке страницы
window.addEventListener('load', () => {
    startGame();
    initMenu(); // Инициализация меню
    
    // Получение данных от бота (если нужно)
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
