const { AppSetting } = require('../models/AppSetting');
const { DEFAULT_TICKET_CATEGORIES } = require('../models/Ticket');

const CATEGORY_KEY = 'ticket_categories';
const MODEL_SUPERVISION_KEY = 'classification_model_supervision';

const DEFAULT_MODEL_SUPERVISION = {
  modelName: 'TicketClassifier-v1',
  version: '1.0.0',
  status: 'active',
  accuracy: 0.91,
  precision: 0.89,
  recall: 0.9,
  lastEvaluationAt: null,
  notes: "Configuration initiale. A adapter a votre pipeline ML."
};

const getSettingValue = async (key, fallback) => {
  const setting = await AppSetting.findOne({ key }).lean();
  if (!setting) {
    return fallback;
  }
  return setting.value;
};

const upsertSettingValue = async (key, value) => {
  await AppSetting.findOneAndUpdate(
    { key },
    { $set: { value } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  return value;
};

const getTicketCategories = async () => {
  const categories = await getSettingValue(CATEGORY_KEY, DEFAULT_TICKET_CATEGORIES);
  return Array.isArray(categories) ? categories : DEFAULT_TICKET_CATEGORIES;
};

const setTicketCategories = async (categories) => {
  return upsertSettingValue(CATEGORY_KEY, categories);
};

const getModelSupervision = async () => {
  return getSettingValue(MODEL_SUPERVISION_KEY, DEFAULT_MODEL_SUPERVISION);
};

const setModelSupervision = async (payload) => {
  const current = await getModelSupervision();
  return upsertSettingValue(MODEL_SUPERVISION_KEY, { ...current, ...payload });
};

module.exports = {
  getTicketCategories,
  setTicketCategories,
  getModelSupervision,
  setModelSupervision,
  DEFAULT_MODEL_SUPERVISION
};
