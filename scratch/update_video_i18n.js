const fs = require('fs');
const path = require('path');

const dir = 'public-administration/i18n';
const frPath = path.join(dir, 'video.fr.json');
const esPath = path.join(dir, 'video.es.json');

let fr = JSON.parse(fs.readFileSync(frPath, 'utf8'));
fr["Ministry of Public Administration — Talent Portal Demo Video"] = "Ministère de la Fonction Publique — Vidéo de Démonstration du Portail des Talents";
fr["Ministry of Public Administration"] = "Ministère de la Fonction Publique";
fr["Demo for Government Agency talent management"] = "Démo pour la gestion des talents des agences gouvernementales";
fr["To deploy the Ministry of Public Administration for your government organization"] = "Pour déployer le Ministère de la Fonction Publique pour votre organisation gouvernementale";

let es = JSON.parse(fs.readFileSync(esPath, 'utf8'));
es["Ministry of Public Administration — Talent Portal Demo Video"] = "Ministerio de Administración Pública — Video de Demostración del Portal de Talento";
es["Ministry of Public Administration"] = "Ministerio de Administración Pública";
es["Demo for Government Agency talent management"] = "Demostración de gestión de talento de agencias gubernamentales";
es["To deploy the Ministry of Public Administration for your government organization"] = "Para implementar el Ministerio de Administración Pública en su organización gubernamental";

fs.writeFileSync(frPath, JSON.stringify(fr, null, 2), 'utf8');
fs.writeFileSync(esPath, JSON.stringify(es, null, 2), 'utf8');

console.log('Video i18n updated.');
