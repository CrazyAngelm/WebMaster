// 📁 docs/База данных Hornygrad.md - Полная структура Web-версии
// 🎯 Core function: Описание всех игровых сущностей для реализации
// 💡 Usage: Основа для TypeScript интерфейсов и IndexedDB схемы

# 📜 База данных Hornygrad (Web-версия)

## Список сущностей

### Игроки и Персонажи
* Пользователь (User)
* Персонаж (Character)
* Шаблон персонажа (CharacterTemplate)

### Мир и Локации
* Локация (Location)
* Доступные локации (LocationConnection)
* Здание (Building)

### Предметы и Инвентарь
* Предмет (ItemTemplate)
* Существующий предмет (ExistingItem)
* Инвентарь (Inventory)
* Оружие (Weapon)
* Броня (Armor)
* Артефакт (Artifact)
* Свиток (Scroll)
* Зелье (Potion)
* Сумка (Bag)

### Боевая система
* Способность (Skill)
* Способность персонажа (CharacterSkill)
* Эффект (Effect)
* Бафф (Buff)
* Бой (Battle)
* Участник боя (BattleParticipant)
* Награда (Reward)

### Справочники и Константы
* Ранг (Rank)
* Раса (Race)
* Редкость (Rarity)
* Скорость (Speed)
* Дистанция (Distance)
* Тип применения (TargetType)
* Тип оружия (WeaponType)
* Тип брони (ArmorType)
* Тип щита (ShieldType)
* Тип пробития брони (ArmorPenetration)
* Тип эффекта (EffectType)
* Уровень эффекта (EffectLevel)
* Условие срабатывания (TriggerCondition)
* Тип предмета (ItemType)
* Дополнительные параметры (AdditionalParameters)

### Профессии и Крафт
* Профессия (Profession)
* Ранг профессии (ProfessionRank)
* Рецепт профессии (ProfessionRecipe)

### Торговля
* Магазин (Shop)
* Сделка (Trade)
* Подробности сделки (TradeDetail)

### Прогрессия и Тренировки
* Тип тренировки (TrainingType)
* Тренировка (Training)

### Старт игры
* Стартовая конфигурация (StartGameTemplate)

---

## Детальное описание сущностей

### Пользователь (User)
* `id` (uuid): Уникальный идентификатор
* `name` (string): Имя пользователя
* `avatarUrl` (string): URL аватара
* `settings` (json): Настройки игры (звук, интерфейс, язык)
* `createdAt` (datetime): Дата создания аккаунта

### Персонаж (Character)
* `id` (uuid)
* `userId` (ref): Владелец персонажа
* `name` (string): Имя персонажа
* `appearance` (text): Описание внешности
* `bio` (text): Биография
* `avatarUrl` (string): Картинка персонажа
* `raceId` (ref): Раса
* `rankId` (ref): Текущий ранг
* `currentEssence` (int): Текущая сущность
* `maxEssence` (int): Максимальная сущность
* `currentProtection` (int): Текущая защита
* `maxProtection` (int): Максимальная защита (равна maxEssence)
* `speedId` (ref): Скорость передвижения
* `inventoryId` (ref): Инвентарь
* `locationId` (ref): Текущая локация
* `buildingId` (ref?): Текущее здание (опционально)
* `position` (string): Позиция в локации
* `isDead` (bool): Мертв ли персонаж
* `isInCombat` (bool): В бою ли сейчас
* `isPlayer` (bool): Игрок или NPC
* `additionalParametersId` (ref): Бонусы (уклонение, меткость и т.д.)
* `breakthroughPoints` (int): Очки для прорыва ранга

### Шаблон персонажа (CharacterTemplate)
* `id` (uuid)
* `name` (string): Имя шаблона
* `appearance` (text): Описание внешности
* `bio` (text): Биография
* `avatarUrl` (string)
* `raceId` (ref)
* `rankId` (ref): Начальный ранг
* `startEssence` (int): Начальная сущность
* `startProtection` (int): Начальная защита
* `speedId` (ref)
* `inventoryTemplate` (json): Начальные предметы
* `skills` (array): Стартовые способности
* `additionalParametersId` (ref)

---

### Локация (Location)
* `id` (uuid)
* `name` (string): Название локации
* `description` (text): Описание
* `zoneType` (string): Зеленая/Желтая/Красная
* `globalPosition` (string): Координаты на карте мира
* `buildings` (array): Список зданий в локации
* `connections` (array): Связи с другими локациями

### Доступные локации (LocationConnection)
* `id` (uuid)
* `fromLocationId` (ref): Откуда
* `toLocationId` (ref): Куда
* `isBidirectional` (bool): Двустороннее ли перемещение

### Здание (Building)
* `id` (uuid)
* `locationId` (ref): Локация, где находится
* `name` (string)
* `description` (text)
* `position` (string): Позиция в локации
* `canHaveShops` (bool): Можно ли размещать магазины
* `shops` (array): Список магазинов в здании

---

### Предмет (ItemTemplate)
* `id` (uuid)
* `name` (string)
* `description` (text)
* `itemTypeId` (ref): Тип предмета
* `rarityId` (ref): Редкость
* `maxStack` (int): Максимальный стак
* `weight` (int): Вес в слотах инвентаря
* `cannotDrop` (bool): Нельзя выкинуть
* `usableInCombat` (bool?): Можно использовать только в бою/вне боя/везде

### Существующий предмет (ExistingItem)
* `id` (uuid)
* `templateId` (ref): Ссылка на шаблон
* `inventoryId` (ref): В каком инвентаре
* `quantity` (int): Количество (для стакающихся)
* `currentEssence` (int?): Текущая сущность (для оружия/свитков)
* `currentDurability` (int?): Текущая прочность (для брони/оружия)
* `isEquipped` (bool): Надет ли
* `buffs` (array): Активные баффы от предмета
* `purchasePrice` (int?): Цена покупки (для магазина)
* `sellPrice` (int?): Цена продажи (для магазина)

### Инвентарь (Inventory)
* `id` (uuid)
* `characterId` (ref): Владелец
* `currentWeight` (int): Текущий вес
* `maxWeight` (int): Максимальный вес
* `items` (array): Список предметов

### Оружие (Weapon)
* `id` (uuid)
* `itemTemplateId` (ref): Базовый предмет
* `weaponTypeId` (ref): Одноручное/Двуручное/Щит/Стабилизатор
* `currentEssence` (int): Текущая сущность
* `maxEssence` (int): Максимальная сущность
* `currentDurability` (int?): Прочность (для оружия с прочностью)
* `maxDurability` (int?): Максимальная прочность
* `distanceId` (ref): Дистанция атаки
* `armorPenetrationId` (ref): Тип пробития
* `spellSlots` (int): Количество слотов для заклинаний (для стабилизаторов)
* `innateSkillId` (ref?): Встроенная способность

### Броня (Armor)
* `id` (uuid)
* `itemTemplateId` (ref)
* `armorTypeId` (ref): Легкая/Средняя/Тяжелая/Сверхтяжелая
* `currentDurability` (int): Текущая прочность
* `maxDurability` (int): Максимальная прочность
* `buffs` (array): Баффы от брони

### Артефакт (Artifact)
* `id` (uuid)
* `itemTemplateId` (ref)
* `skillId` (ref?): Встроенная способность
* `buffs` (array): Баффы от артефакта

### Свиток (Scroll)
* `id` (uuid)
* `itemTemplateId` (ref)
* `essence` (int): Сущность свитка
* `skillId` (ref): Заклинание в свитке

### Зелье (Potion)
* `id` (uuid)
* `itemTemplateId` (ref)
* `essence` (int): Сущность зелья
* `effectId` (ref): Эффект зелья

### Сумка (Bag)
* `id` (uuid)
* `itemTemplateId` (ref)
* `slotCount` (int): Количество слотов

---

### Способность (Skill)
* `id` (uuid)
* `name` (string)
* `description` (text)
* `rarityId` (ref)
* `castTime` (int?): Время применения (ходы)
* `cooldown` (int?): Откат (ходы)
* `targetTypeId` (ref): На кого применяется
* `distanceId` (ref?): Дальность
* `armorPenetrationId` (ref?): Пробитие брони
* `alwaysPenetrates` (bool): Всегда пробивает броню
* `effects` (array): Список эффектов способности
* `isCombat` (bool): Боевая способность
* `isStarter` (bool): Стартовая способность

### Способность персонажа (CharacterSkill)
* `id` (uuid)
* `characterId` (ref)
* `skillId` (ref)
* `currentCooldown` (int?): Текущий откат
* `castTimeRemaining` (int?): Осталось ходов до применения
* `isItemSkill` (bool): Способность от предмета
* `baseEssence` (int): Базовая сущность способности

### Эффект (Effect)
* `id` (uuid)
* `name` (string)
* `effectTypeId` (ref): Тип эффекта
* `duration` (int?): Длительность (ходы, null = бесконечно)
* `triggerConditionId` (ref): Условие срабатывания
* `effectLevelId` (ref?): Уровень эффекта
* `value` (int): Сила эффекта
* `isEssenceBased` (bool): Работает от сущности персонажа
* `isWeaponEssenceBased` (bool): Работает от сущности оружия
* `isCombat` (bool): Боевой эффект
* `isNegative` (bool): Дебафф
* `parameter` (string): Параметр воздействия (evasion, accuracy, и т.д.)

### Бафф (Buff)
* `id` (uuid)
* `effectId` (ref)
* `currentTick` (int): Текущий тик длительности
* `value` (int): Значение баффа
* `characterId` (ref?): На персонаже
* `itemId` (ref?): От предмета

---

### Бой (Battle)
* `id` (uuid)
* `locationId` (ref): Где происходит бой
* `status` (string): Active/Finished/Paused
* `isPaused` (bool): Пауза
* `currentTurn` (int): Чей сейчас ход
* `turnOrder` (array): Порядок ходов
* `rewardId` (ref?): Награда за бой
* `endedAt` (datetime?): Дата окончания

### Участник боя (BattleParticipant)
* `id` (uuid)
* `battleId` (ref)
* `characterId` (ref)
* `teamId` (int): Номер команды
* `initiative` (int): Бросок инициативы
* `hasTurn` (bool): Его ли сейчас ход
* `mainActionUsed` (bool): Использовано основное действие
* `bonusActionUsed` (bool): Использовано дополнительное действие

### Награда (Reward)
* `id` (uuid)
* `battleId` (ref)
* `isAutoGenerated` (bool): Автоматически сгенерирована
* `essence` (int): Сущность в награде
* `inventoryId` (ref?): Инвентарь с предметами
* `position` (string): Где выпала награда
* `generatedAt` (datetime?): Дата генерации

---

### Ранг (Rank)
* `id` (uuid)
* `order` (int): Порядок (1-6)
* `name` (string): Название ранга
* `description` (text): Описание
* `minDiceRoll` (int): Минимальный бросок кубика для прорыва
* `startEssence` (int): Начальная сущность
* `maxEssence` (int): Максимальная сущность
* `maxArtifacts` (int): Максимальное количество артефактов
* `maxSkills` (int): Максимальное количество способностей
* `breakthroughConditions` (text): Условия прорыва
* `breakthroughChance` (float): Шанс прорыва (0-1)

### Раса (Race)
* `id` (uuid)
* `name` (string)
* `description` (text)
* `speedId` (ref): Базовая скорость
* `innateEffects` (array): Врожденные эффекты
* `innateSkills` (array): Врожденные способности

### Редкость (Rarity)
* `id` (uuid)
* `order` (int): Порядок (от обычного к божественному)
* `name` (string)
* `color` (string): HEX цвет для интерфейса
* `dropChance` (float): Шанс дропа (0-1)
* `maxEssenceWeapon2H` (int): Макс. сущность двуручного оружия
* `maxEssenceWeapon1H` (int): Макс. сущность одноручного оружия
* `maxEssenceScroll` (int): Макс. сущность свитка
* `maxEssencePotion` (int): Макс. сущность зелья
* `maxDurabilityArmor` (int): Макс. прочность брони
* `maxSpellSlots` (int): Макс. слотов заклинаний в стабилизаторе

### Скорость (Speed)
* `id` (uuid)
* `order` (int): Порядок
* `name` (string): Название (Обычная, Быстрая и т.д.)
* `maxValue` (int): Максимальное расстояние за ход

### Дистанция (Distance)
* `id` (uuid)
* `order` (int)
* `name` (string): Ближняя/Средняя/Дальняя/Снайперская
* `min` (int): Минимальная дистанция
* `max` (int): Максимальная дистанция

### Тип применения (TargetType)
* `id` (uuid)
* `name` (string): На себя/На цель/На несколько целей

### Тип оружия (WeaponType)
* `id` (uuid)
* `name` (string): Одноручное/Двуручное/Щит/Одноручный стабилизатор/Двуручный стабилизатор
* `additionalParametersId` (ref?): Дополнительные параметры типа

### Тип брони (ArmorType)
* `id` (uuid)
* `order` (int)
* `name` (string): Легкая/Средняя/Тяжелая/Сверхтяжелая
* `power` (int): Сила защиты
* `additionalParametersId` (ref?): Доп. параметры

### Тип щита (ShieldType)
* `id` (uuid)
* `order` (int)
* `name` (string)
* `power` (int): Сила щита
* `additionalParametersId` (ref?)

### Тип пробития брони (ArmorPenetration)
* `id` (uuid)
* `order` (int)
* `name` (string): Нет/Легкое/Среднее/Тяжелое/Очень тяжелое
* `armorTypeId` (ref?): Против какого типа брони
* `power` (int): Сила пробития
* `additionalParametersId` (ref?)
* `hideEssence` (int): Скрывает сущность оружия

### Тип эффекта (EffectType)
* `id` (uuid)
* `name` (string): Блокирующий/Периодический/Ослабляющий/Усиливающий/Подчиняющий/Созидание/Пространственный/Уникальный

### Уровень эффекта (EffectLevel)
* `id` (uuid)
* `order` (int)
* `name` (string): Слабый/Обычный/Сильный
* `maxEssence` (int): Максимальная сущность эффекта
* `maxEssencePercent` (float): Максимальная сущность в процентах

### Условие срабатывания (TriggerCondition)
* `id` (uuid)
* `name` (string): Мгновенно/Задержка/Условие

### Тип предмета (ItemType)
* `id` (uuid)
* `name` (string): Оружие/Броня/Артефакт/Свиток/Зелье/Сумка/Материал/Прочее

### Дополнительные параметры (AdditionalParameters)
* `id` (uuid)
* `evasionBonus` (int): Бонус уклонения
* `accuracyBonus` (int): Бонус меткости
* `damageResistance` (int): Сопротивление урону
* `movementBonus` (int): Бонус к передвижению
* `initiative` (int): Инициатива

---

### Профессия (Profession)
* `id` (uuid)
* `characterId` (ref)
* `name` (string): Кузнец/Портной/Зельевар/Алхимик/Начертатель/Повар
* `currentExp` (int): Текущий опыт
* `professionRankId` (ref): Текущий ранг профессии

### Ранг профессии (ProfessionRank)
* `id` (uuid)
* `order` (int): Порядок (1-6)
* `name` (string): Ученик/Подмастерье/Умелец/Мастер/Великий мастер/Прославленный мастер
* `startExp` (int): Стартовый опыт для этого ранга
* `maxExp` (int): Максимальный опыт для этого ранга

### Рецепт профессии (ProfessionRecipe)
* `id` (uuid)
* `professionName` (string): Для какой профессии
* `recipeItemId` (ref?): Предмет-рецепт (если нужно изучать)
* `resultItemTemplateId` (ref): Что создается
* `requiredRank` (int): Требуемый ранг профессии
* `requiredIngredients` (array): [{ templateId, quantity }]
* `characterId` (ref?): У какого персонажа изучен (для персонажа)
* `isLearned` (bool): Изучен ли рецепт

---

### Магазин (Shop)
* `id` (uuid)
* `buildingId` (ref): В каком здании
* `name` (string): Название магазина
* `description` (text)
* `inventoryId` (ref): Инвентарь с товарами
* `isOpen` (bool): Открыт ли магазин

### Сделка (Trade)
* `id` (uuid)
* `creatorCharacterId` (ref): Создатель сделки
* `participantCharacterId` (ref): Участник сделки
* `status` (string): Pending/Accepted/Completed/Cancelled

### Подробности сделки (TradeDetail)
* `id` (uuid)
* `tradeId` (ref)
* `characterId` (ref): Какой персонаж предлагает
* `itemId` (ref): Предмет
* `quantity` (int): Количество

---

### Тип тренировки (TrainingType)
* `id` (uuid)
* `name` (string): Название типа тренировки
* `recoveryMinutes` (int): Восстановление в минутах
* `minProgress` (int): Минимальный прогресс
* `maxProgress` (int): Максимальный прогресс

### Тренировка (Training)
* `id` (uuid)
* `characterId` (ref)
* `trainingTypeId` (ref)
* `lastTrainingDate` (datetime?): Дата последней тренировки

---

### Старт игры (StartGameTemplate)
* `id` (uuid)
* `name` (string): Название шаблона старта
* `description` (text): Описание
* `startingItems` (array): Предметы при старте
* `startingLocationId` (ref): Стартовая локация
* `startingBuildingId` (ref?): Стартовое здание

---

## Примечания

* Все `id` используют формат UUID (string) для совместимости с Web-технологиями.
* Все `ref` означают ссылку на другую сущность по `id`.
* Массивы (`array`) хранятся как JSON или связанные таблицы в зависимости от реализации.
* Опциональные поля помечены как `?` (например, `buildingId (ref?)`).
* Сущности `BindChannelEntity` и `RoleEntity` удалены, так как они специфичны для Discord-бота.
* Поля `ServerId`, `Channel ID`, `Prefix` и другие Discord-специфичные удалены из всех сущностей.
* Система полностью автономна и готова для реализации в браузере (IndexedDB) с возможностью синхронизации через Backend в будущем.
