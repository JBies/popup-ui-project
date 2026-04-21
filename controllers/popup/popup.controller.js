// controllers/popup/popup.controller.js
// Päämoduuli joka yhdistää kaikki popup-moduulit

const crudController = require('./popup.crud.controller');
const statsController = require('./popup.stats.controller');
const adminController = require('./popup.admin.controller');
const templatesController = require('./popup.templates.controller');

// CRUD-toiminnot
exports.createPopup = crudController.createPopup;
exports.getUserPopups = crudController.getUserPopups;
exports.updatePopup = crudController.updatePopup;
exports.deletePopup = crudController.deletePopup;
exports.getEmbedPopup = crudController.getEmbedPopup;

// Tilastot ja seuranta
exports.registerView = statsController.registerView;
exports.registerClick = statsController.registerClick;
exports.getPopupStats = statsController.getPopupStats;
exports.getAdminPopupStats = statsController.getAdminPopupStats;
exports.resetStats = statsController.resetStats;
exports.getSiteElements = statsController.getSiteElements;

// Admin-toiminnot
exports.getAllPopups = adminController.getAllPopups;
exports.getAdminPopup = adminController.getAdminPopup;
exports.updateAdminPopup = adminController.updateAdminPopup;
exports.deleteAdminPopup = adminController.deleteAdminPopup;
exports.getUserPopupsAdmin = adminController.getUserPopupsAdmin;
exports.createPopupForUser = adminController.createPopupForUser;
exports.getPopupAuditLogs = adminController.getPopupAuditLogs;

// Template-presetit
exports.getTemplates = templatesController.getTemplates;
exports.createFromTemplate = templatesController.createFromTemplate;
exports.getUserTemplates = templatesController.getUserTemplates;
exports.saveAsTemplate = templatesController.saveAsTemplate;