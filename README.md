# 🛍️ Project Omega - Plugin Marketplace

Bienvenue sur la **Marketplace des Plugins** pour **Project Omega CMS** ! Ici, vous pouvez ajouter de nouveaux plugins pour étendre les fonctionnalités du CMS.

## 🚀 Créer un Plugin

Un plugin est un module autonome qui peut être installé et utilisé dans **Project Omega CMS** sans redémarrer le serveur.

### 📦 Structure d’un Plugin
Chaque plugin doit suivre cette structure minimale :
```
    example-plugin
   ├─ Controller
   │  └─ Controller.js
   ├─ Routes
   │  └─ MainRoutes.js
   ├─ admin
   │  └─ dashboard.js
   ├─ plugin.json
   └─ public
      └─ publicComponent.js

```

### 🔧 Configuration (`config.json`)
```json
{
  "id": "randomuid",
  "name": "Exemple plugin",
  "version": "1.0.0",
  "description": "Un plugin d'exemple",
  "folder": "example-plugin",
  "url": "/example-plugin"
}
```

## 📥 Soumettre un Plugin
Si vous souhaitez partager votre plugin avec la communauté, voici la procédure :

### 🛠 Étapes pour proposer un plugin :
1. **Forker ce repository**.
2. **Créer un dossier** dans `plugins/` avec le nom de votre plugin.
3. **Ajouter votre plugin** en respectant la structure décrite plus haut.
4. **Créer une Pull Request** en expliquant votre plugin et ses fonctionnalités.

## 💡 Bonnes Pratiques
- Documentez bien votre plugin dans `README.md`.
- Testez votre plugin avant de le soumettre.
- Respectez la structure standard des plugins.

## 📄 Licence
Votre plugin doit être sous une licence libre compatible avec Project Omega CMS (MIT, GPL, etc.).

---
Rejoignez la communauté et enrichissez Project Omega CMS avec de nouveaux plugins ! 🚀

