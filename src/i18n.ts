import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      "dashboard": "Dashboard",
      "schedules": "Schedules",
      "sourceCode": "Source Code",
      "docs": "Docs & BOM",
      "currentTemp": "Current Temp",
      "status": "Status",
      "timeRemaining": "Time Remaining",
      "startFiring": "Start Firing",
      "pause": "Pause",
      "abort": "Abort",
      "skipStep": "Skip Step",
      "systemError": "System Error",
      "firingProfile": "Firing Profile",
      "library": "Library",
      "newSchedule": "New Schedule",
      "save": "Save",
      "targetTemp": "Target Temp (°C)",
      "rate": "Rate (°C/hr)",
      "duration": "Duration (min)",
      "addRamp": "Add Ramp",
      "addHold": "Add Hold",
      "addCool": "Add Cool",
      "estimatedCost": "Est. Cost",
      "power": "Power (kW)",
      "tariff": "Tariff ($/kWh)",
      "kilnPro": "KilnPro",
      "step": "Step",
      "idle": "Idle",
      "heating": "Heating",
      "holding": "Holding",
      "cooling": "Cooling",
      "error": "Error",
      "autotune": "Autotune",
      "noSchedules": "No schedules found. Create one to get started.",
      "selectSchedule": "Select a schedule to edit",
      "orCreateNew": "Or create a new one from the library",
      "scheduleName": "Schedule Name"
    }
  },
  ua: {
    translation: {
      "dashboard": "Панель",
      "schedules": "Графіки",
      "sourceCode": "Код",
      "docs": "Документація",
      "currentTemp": "Поточна темп.",
      "status": "Статус",
      "timeRemaining": "Залишилось часу",
      "startFiring": "Почати випал",
      "pause": "Пауза",
      "abort": "Скасувати",
      "skipStep": "Пропустити крок",
      "systemError": "Системна помилка",
      "firingProfile": "Профіль випалу",
      "library": "Бібліотека",
      "newSchedule": "Новий графік",
      "save": "Зберегти",
      "targetTemp": "Цільова темп. (°C)",
      "rate": "Швидкість (°C/год)",
      "duration": "Тривалість (хв)",
      "addRamp": "Додати нагрів",
      "addHold": "Додати витримку",
      "addCool": "Додати охолодження",
      "estimatedCost": "Оціночна вартість",
      "power": "Потужність (кВт)",
      "tariff": "Тариф ($/кВтÂ·год)",
      "kilnPro": "KilnPro",
      "step": "Крок",
      "idle": "Очікування",
      "heating": "Нагрівання",
      "holding": "Витримка",
      "cooling": "Охолодження",
      "error": "Помилка",
      "autotune": "Автоналаштування",
      "noSchedules": "Графіки не знайдено. Створіть новий.",
      "selectSchedule": "Виберіть графік для редагування",
      "orCreateNew": "Або створіть новий з бібліотеки",
      "scheduleName": "Назва графіка"
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: "en",
    fallbackLng: "en",
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
