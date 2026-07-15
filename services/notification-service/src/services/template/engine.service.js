const fs = require('fs');
const path = require('path');

class TemplateEngine {
  constructor(logger) {
    this.logger = logger;
    this.templates = {};
    this.loadTemplatesFromDisk();
  }

  loadTemplatesFromDisk() {
    try {
      const templatesPath = path.join(__dirname, '../../templates');
      if (!fs.existsSync(templatesPath)) return;

      const files = fs.readdirSync(templatesPath);
      for (const file of files) {
        if (file.endsWith('.json')) {
          const key = file.replace('.json', '');
          const rawData = fs.readFileSync(path.join(templatesPath, file), 'utf8');
          this.templates[key] = JSON.parse(rawData);
        }
      }
    } catch (err) {
      this.logger.error('Failed to compile localization templates from disk:', err);
    }
  }

  render(templateName, lang = 'en', variables = {}) {
    const activeTemplate = this.templates[templateName];
    if (!activeTemplate || !activeTemplate[lang]) {
      this.logger.warn(`Localized matching block missing for [${templateName}] language [${lang}]. Falling back...`);
      return { title: "Alert Notification", body: "You have a new update from JustTap." };
    }

    let { title, body } = activeTemplate[lang];
    
    for (const [key, val] of Object.entries(variables)) {
      const regexToken = new RegExp(`{{${key}}}`, 'g');
      title = title.replace(regexToken, val);
      body = body.replace(regexToken, val);
    }

    return { title, body };
  }
}

module.exports = TemplateEngine;