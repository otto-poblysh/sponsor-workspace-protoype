const fs = require('fs');
const path = require('path');

const dir = 'public-administration/i18n';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));

files.forEach(f => {
  const filePath = path.join(dir, f);
  let content = fs.readFileSync(filePath, 'utf8');

  // English Key replacements - careful to only replace keys that changed in the EN HTML
  // But wait! If the English string changed, the KEY in the JSON file MUST change as well,
  // otherwise it won't match.
  // We replaced "Corporate Talent Portal" with "Ministry of Public Administration"
  content = content.replace(/"Corporate Talent Portal"/g, '"Ministry of Public Administration"');
  content = content.replace(/"Corporate Multinational Group LTD"/g, '"Ministry of Public Administration"');
  content = content.replace(/"Subsidiaries & Business Units"/g, '"Government Agencies"');
  content = content.replace(/"Subsidiaries"/g, '"Agencies"');
  content = content.replace(/"Subsidiary"/g, '"Agency"');
  
  // Update French translations
  if (f.includes('.fr.')) {
    content = content.replace(/"Portail des Talents du Groupe"/g, '"Ministère de la Fonction Publique"');
    content = content.replace(/"Corporate Multinational Group LTD"/g, '"Ministère de la Fonction Publique"');
    content = content.replace(/"Filiales et Unités Commerciales"/g, '"Agences Gouvernementales"');
    content = content.replace(/"Filiales"/g, '"Agences"');
    content = content.replace(/"Filiale"/g, '"Agence"');
  }
  
  // Update Spanish translations
  if (f.includes('.es.')) {
    content = content.replace(/"Portal de Talento Corporativo"/g, '"Ministerio de Administración Pública"');
    content = content.replace(/"Corporate Multinational Group LTD"/g, '"Ministerio de Administración Pública"');
    content = content.replace(/"Filiales y Unidades de Negocio"/g, '"Agencias Gubernamentales"');
    content = content.replace(/"Filiales"/g, '"Agencias"');
    content = content.replace(/"Filial"/g, '"Agencia"');
  }

  fs.writeFileSync(filePath, content, 'utf8');
});
console.log('i18n replacements completed.');
