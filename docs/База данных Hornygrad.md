// 📁 docs/База данных Hornygrad.md - Структура данных
// 🎯 Core function: Описание сущностей и полей для хранения состояния игры
// 💡 Usage: Основа для создания TypeScript интерфейсов и IndexedDB

# База данных Web-версии Hornygrad

## Основные сущности

### Пользователь (User)
*   `id` (uuid): Уникальный ID игрока (локальный или облачный).
*   `name` (string): Имя пользователя.
*   `avatarUrl` (string): Ссылка на аватар.
*   `settings` (json): Настройки интерфейса, звук и т.д.

### Персонаж (Character)
*   `id` (uuid): ID персонажа.
*   `userId` (ref): Владелец персонажа.
*   `name` (string): Имя персонажа.
*   `raceId` (ref): Ссылка на Расу.
*   `rankId` (ref): Ссылка на Ранг.
*   `description` (text): Описание внешности.
*   `bio` (text): Биография.
*   `stats`:
    *   `essence`: { current: int, max: int }
    *   `protection`: { current: int, max: int }
    *   `speedId` (ref): Ссылка на Скорость.
*   `inventoryId` (ref): Ссылка на Инвентарь.
*   `location`: { locationId: ref, buildingId: ref, position: string }
*   `isDead` (bool): Статус жизни.
*   `bonuses`: { evasion: int, accuracy: int, damageResistance: int, initiative: int }

### Мир и Локации
*   **Локация (Location):** `id`, `name`, `description`, `zoneType` (Green/Yellow/Red).
*   **Здание (Building):** `id`, `locationId`, `name`, `description`, `hasShop` (bool).
*   **Связи локаций:** `id`, `fromLocationId`, `toLocationIds` (array).

### Механики и Параметры
*   **Ранг (Rank):** `id`, `order`, `name`, `maxEssence`, `maxArtifacts`, `maxSkills`, `breakthroughConditions`.
*   **Раса (Race):** `id`, `name`, `description`, `baseSpeedId`, `innateSkills` (array), `passiveEffects` (array).
*   **Редкость (Rarity):** `id`, `order`, `name`, `color`, `dropChance`, `essenceCaps` (по типам предметов).

### Предметы и Инвентарь
*   **Инвентарь (Inventory):** `id`, `characterId`, `maxWeight`, `items` (array of ExistingItem).
*   **Шаблон предмета (ItemTemplate):** `id`, `name`, `type`, `rarityId`, `weight`, `isUnique`.
*   **Экземпляр предмета (ExistingItem):** `id`, `templateId`, `quantity`, `currentEssence`, `currentDurability`, `isEquipped`, `buffs` (array).

### Боевая система
*   **Способность (Skill):** `id`, `name`, `description`, `rarityId`, `castTime`, `cooldown`, `range`, `effects` (array).
*   **Бой (Battle):** `id`, `locationId`, `status` (Active/Finished), `turnOrder` (array of Participants).
*   **Участник боя (Participant):** `id`, `characterId`, `teamId`, `initiative`, `currentActions` (main/bonus).

### Эффекты и Баффы
*   **Эффект (Effect):** `id`, `name`, `type` (Buff/Debuff), `duration` (ticks/turns), `triggerCondition`, `value`, `parameter` (essence/speed/etc).

---
*Примечание: Все ID переведены на UUID формат для гибкости между локальным и серверным хранилищем.*
