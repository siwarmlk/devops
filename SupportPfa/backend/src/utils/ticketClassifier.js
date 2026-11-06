const { spawn } = require('child_process');
const path = require('path');

/**
 * Maps the model output or raw text to the categories used in the project.
 * Uses a keyword-based safety net for higher accuracy on obvious cases.
 * @param {string} category The model's prediction
 * @param {string} title The ticket title
 * @param {string} description The ticket description
 */
const mapToProjectCategory = (category, title = '', description = '') => {
  const mapping = {
    'Authentification': 'Authentification',
    'Support technique': 'Support technique',
    'Reseau': 'Reseau',
    'Materiel': 'Materiel',
    'Logiciel': 'Logiciel',
    'Messagerie': 'Messagerie',
    'Securite': 'Securite',
    'Gestion des comptes': 'Gestion des comptes',
    'Information': 'Information',
    'Reclamation': 'Reclamation',
    'Demande de service': 'Demande de service',
    'Urgence': 'Urgence'
  };
  
  const text = `${title} ${description}`.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  // --- Safety Net: Keyword Heuristics (Bilingual French/English) ---
  
  // 1. Urgence (Check first as it overrides everything)
  if (text.includes('urgent') || text.includes('critique') || text.includes('priorit') || 
      text.includes('panne general') || text.includes('indisponible') || 
      text.includes('interruption') || text.includes('impact majeur') || text.includes('emergency') || 
      text.includes('outage')) {
    return 'Urgence';
  }

  // 2. Authentification
  if (text.includes('connexion') || text.includes('login') || text.includes('authentification') || 
      text.includes('mot de passe') || text.includes('mdp') || 
      text.includes('identifiant') || text.includes('password') || text.includes('auth')) {
    return 'Authentification';
  }

  // 3. Messagerie
  if (text.includes('email') || text.includes('messagerie') || text.includes('outlook') || 
      text.includes('boite mail') || text.includes('courrier electronique') || text.includes('piece jointe') || 
      text.includes('spam') || text.includes('mail') || text.includes('inbox') || text.includes('attachment')) {
    return 'Messagerie';
  }

  // 4. Sécurité
  if (text.includes('securite') || text.includes('virus') || text.includes('malware') || 
      text.includes('ransomware') || text.includes('phishing') || text.includes('piratage') || 
      text.includes('menace') || text.includes('antivirus') || text.includes('pare-feu') || 
      text.includes('hack') || text.includes('firewall')) {
    return 'Securite';
  }

  // 5. Réclamation
  if (text.includes('reclamation') || text.includes('plainte') || text.includes('insatisfaction') || 
      text.includes('mecontentement') || text.includes('facturation') || text.includes('facture') || 
      text.includes('remboursement') || text.includes('contestation') || text.includes('litige') || 
      text.includes('invoice') || text.includes('bill') || text.includes('refund') || text.includes('claim')) {
    return 'Reclamation';
  }

  // 6. Gestion des comptes
  if (text.includes('creation de compte') || text.includes('suppression de compte') || 
      text.includes('modification de profil') || text.includes('droits d') || text.includes('permission') || 
      text.includes('role utilisateur') || text.includes('habilitation') || text.includes('profile') || 
      text.includes('account')) {
    return 'Gestion des comptes';
  }

  // 7. Logiciel
  if (text.includes('installation') || text.includes('mise a jour') || text.includes('logiciel') || 
      text.includes('application') || text.includes('version') || text.includes('configuration') || 
      text.includes('licence') || text.includes('compatibilite') || text.includes('telechargement') || 
      text.includes('software') || text.includes('update') || text.includes('app')) {
    return 'Logiciel';
  }

  // 8. Demande de service
  if (text.includes('demande') || text.includes('intervention') || text.includes('maintenance') || 
      text.includes('assistance') || text.includes('support') || text.includes('activation')) {
    return 'Demande de service';
  }

  // 9. Support technique
  if (text.includes('bug') || text.includes('erreur') || text.includes('panne') || 
      text.includes('dysfonctionnement') || text.includes('incident') || text.includes('technique') || 
      text.includes('crash') || text.includes('performance') || text.includes('lenteur') || 
      text.includes('ecran blanc') || text.includes('echec') || text.includes('anomalie') || 
      text.includes('error') || text.includes('broken')) {
    return 'Support technique';
  }

  // 10. Réseau
  if (text.includes('wifi') || text.includes('reseau') || text.includes('internet') || 
      text.includes('deconnexion') || text.includes('adresse ip') || text.includes('vpn') || 
      text.includes('bande passante') || text.includes('routeur') || text.includes('latence') || 
      text.includes('network')) {
    return 'Reseau';
  }

  // 11. Matériel
  if (text.includes('ordinateur') || text.includes('imprimante') || text.includes('scanner') || 
      text.includes('clavier') || text.includes('souris') || text.includes('ecran') || 
      text.includes('serveur') || text.includes('disque dur') || text.includes('defectueux') || 
      text.includes('reparation') || text.includes('hardware') || text.includes('printer') || 
      text.includes('keyboard') || text.includes('mouse') || text.includes('monitor')) {
    return 'Materiel';
  }

  // 12. Information
  if (text.includes('renseignement') || text.includes('information') || text.includes('question') || 
      text.includes('aide') || text.includes('documentation') || text.includes('procedure') || 
      text.includes('tutoriel') || text.includes('guide') || text.includes('help')) {
    return 'Information';
  }

  // Fallback to model prediction if mapped
  if (category && mapping[category]) return mapping[category];
  
  // Final fallback (Information is a good default for 12 categories)
  return 'Information';
};

/**
 * Classifies a ticket based on its title and description using the Python model.
 * @param {string} title 
 * @param {string} description 
 * @returns {Promise<string>} The predicted category.
 */
const classifyTicket = (title, description) => {
  return new Promise((resolve) => {
    const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';
    
    const pythonProcess = spawn(pythonCmd, [
      path.join(__dirname, 'classify.py'),
      title,
      description
    ]);

    let result = '';
    let error = '';

    pythonProcess.stdout.on('data', (data) => {
      result += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      error += data.toString();
    });

    pythonProcess.on('close', (code) => {
      let aiCategory = 'Question generale';
      
      if (code === 0) {
        const lines = result.trim().split('\n');
        const lastLine = lines[lines.length - 1].trim();
        if (!lastLine.startsWith('Error:')) {
          aiCategory = lastLine;
        }
      } else {
        console.error(`[Classifier] AI script failed: ${error}`);
      }
      
      const finalCategory = mapToProjectCategory(aiCategory, title, description);
      console.log(`[Classifier] Input: "${title}" | AI: "${aiCategory}" | Final: "${finalCategory}"`);
      resolve(finalCategory);
    });
    
    pythonProcess.on('error', (err) => {
      console.error(`[Classifier] Spawn error: ${err.message}`);
      resolve(mapToProjectCategory('Question generale', title, description));
    });
  });
};

module.exports = { classifyTicket };
